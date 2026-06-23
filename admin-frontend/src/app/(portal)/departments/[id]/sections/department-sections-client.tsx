"use client";

import { SectionMemberPicker } from "@/components/admin-departments/section-member-picker";
import { SectionRosterCard } from "@/components/admin-departments/section-roster-card";
import { ApiErrorBanner } from "@/components/shared/api-error-banner";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { PageHeader } from "@/components/shared/page-header";
import { BackButtonLink } from "@/components/ui/back-button-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PersonSelect } from "@/components/ui/person-select";
import { Select } from "@/components/ui/select";
import { fieldLabelClassName } from "@/components/ui/field-control";
import { useDepartmentSections } from "@/hooks/use-department-sections";
import { Layers, UserMinus, Users } from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-card border border-zamtel-border bg-white p-4 shadow-card sm:p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-2xl font-semibold tabular-nums text-brand-dark">{value}</p>
          <p className="text-sm text-zamtel-muted">{label}</p>
        </div>
      </div>
    </div>
  );
}

function FlowPanel({
  title,
  description,
  step,
  totalSteps,
  error,
  children,
  footer,
}: {
  title: string;
  description: string;
  step?: number;
  totalSteps?: number;
  error: string | null;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <section className="mb-6 overflow-hidden rounded-card border border-brand-primary/25 bg-white shadow-card">
      <div className="border-b border-zamtel-border/80 bg-brand-primary/5 px-4 py-4 sm:px-6">
        {step && totalSteps ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">
            Step {step} of {totalSteps}
          </p>
        ) : null}
        <h2 className="mt-1 text-lg font-semibold text-brand-dark">{title}</h2>
        <p className="mt-1 text-sm text-zamtel-muted">{description}</p>
        {totalSteps && step ? (
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-brand-primary/15">
            <div
              className="h-full rounded-full bg-brand-primary transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        ) : null}
      </div>
      <div className="px-4 py-5 sm:px-6">
        {error ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {children}
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-zamtel-border/80 bg-surface-subtle px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
        {footer}
      </div>
    </section>
  );
}

export function DepartmentSectionsClient({ departmentId }: { departmentId: string }) {
  const s = useDepartmentSections(departmentId);

  if (s.loading && !s.roster) {
    return <LoadingScreen />;
  }

  if (!s.roster) {
    return (
      <PageHeader
        title="Department not found"
        description={s.loadError ?? ""}
        actions={<BackButtonLink href="/departments">Back to Departments</BackButtonLink>}
      />
    );
  }

  const { department } = s.roster;
  const inFlow = s.flow !== null;
  const showCreateStep1 = s.flow?.mode === "create" && s.flow.step === 1;
  const showCreateStep2 = s.flow?.mode === "create" && s.flow.step === 2;
  const showEdit = s.flow?.mode === "edit";
  const showManage = s.flow?.mode === "members";

  return (
    <>
      <PageHeader
        title={department.name}
        description="Organize teams into sub-sections and assign members to each one."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <BackButtonLink href="/departments">Back to Departments</BackButtonLink>
            {!inFlow ? (
              <Button type="button" onClick={s.startAddSection}>
                New sub-section
              </Button>
            ) : null}
          </div>
        }
      />

      <ApiErrorBanner message={s.loadError} onRetry={() => void s.reload()} className="mb-4" />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Sub-sections" value={s.roster.sections.length} icon={Layers} />
        <StatCard label="Total members" value={s.totalMembers} icon={Users} />
        <StatCard label="Unassigned" value={s.unassignedCount} icon={UserMinus} />
      </div>

      {showCreateStep1 || showEdit ? (
        <FlowPanel
          title={showEdit ? `Edit ${s.flow?.sectionName}` : "Create sub-section"}
          description={
            showEdit
              ? "Update the sub-section name, manager, or status."
              : "Start with the basics — you will assign team members in the next step."
          }
          step={showCreateStep1 ? 1 : undefined}
          totalSteps={showCreateStep1 ? 2 : undefined}
          error={s.error}
          footer={
            <>
              <Button variant="outline" type="button" onClick={s.resetFlow} disabled={s.saving}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void s.saveSectionDetails()} disabled={s.saving}>
                {s.saving ? "Saving…" : showCreateStep1 ? "Continue" : "Save changes"}
              </Button>
            </>
          }
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <label className={fieldLabelClassName}>Sub-section name *</label>
              <Input
                className="mt-1"
                maxLength={120}
                value={s.draft.name}
                onChange={(e) => s.setDraft((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Infrastructure"
              />
            </div>
            <div>
              <label className={fieldLabelClassName}>Section manager</label>
              <PersonSelect
                className="mt-1"
                value={s.draft.managerUserId}
                onChange={(managerUserId) => s.setDraft((p) => ({ ...p, managerUserId }))}
                people={s.managerOptions}
                allowEmpty
                emptyLabel="No manager"
                placeholder="Choose a manager…"
              />
            </div>
            <div>
              <label className={fieldLabelClassName}>Status</label>
              <Select
                className="mt-1"
                value={s.draft.isActive ? "Active" : "Inactive"}
                onChange={(e) => s.setDraft((p) => ({ ...p, isActive: e.target.value === "Active" }))}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </Select>
            </div>
          </div>
        </FlowPanel>
      ) : null}

      {showCreateStep2 || showManage ? (
        <FlowPanel
          title={showManage ? `Manage members — ${s.flow?.sectionName}` : `Add members — ${s.flow?.sectionName}`}
          description={
            showManage
              ? "Add people from the department pool or remove members from this sub-section."
              : "Choose who should belong to this new sub-section. You can skip this and assign people later."
          }
          step={showCreateStep2 ? 2 : undefined}
          totalSteps={showCreateStep2 ? 2 : undefined}
          error={s.error}
          footer={
            <>
              <Button variant="outline" type="button" onClick={s.resetFlow} disabled={s.saving}>
                {showCreateStep2 ? "Skip for now" : "Done"}
              </Button>
              <Button type="button" onClick={() => void s.assignSelectedMembers()} disabled={s.saving}>
                {s.saving
                  ? "Saving…"
                  : s.selectedUserIds.size
                    ? `Assign ${s.selectedUserIds.size} member${s.selectedUserIds.size === 1 ? "" : "s"}`
                    : showCreateStep2
                      ? "Finish"
                      : "Done"}
              </Button>
            </>
          }
        >
          {showManage && s.activeSection?.users.length ? (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-brand-dark">Current members</h3>
              <ul className="mt-3 space-y-2">
                {s.activeSection.users.map((user) => (
                  <li
                    key={user.id}
                    className="flex flex-col gap-2 rounded-control border border-zamtel-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-brand-dark">{user.fullName}</p>
                      <p className="truncate text-sm text-zamtel-muted">{user.email}</p>
                    </div>
                    <Button
                      size="compact"
                      variant="outline"
                      type="button"
                      disabled={s.saving}
                      onClick={() => void s.removeMember(user.id)}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <h3 className="text-sm font-semibold text-brand-dark">
            {showManage ? "Add members" : "Select team members"}
          </h3>
          <div className="mt-3">
            <SectionMemberPicker
              members={s.assignableMembers}
              selectedIds={s.selectedUserIds}
              onToggle={s.toggleUser}
              onSelectAll={s.selectUsers}
              emptyMessage="Everyone in this department is already assigned to this sub-section."
              hint="People can be moved from department-wide or from another sub-section within this department."
            />
          </div>
        </FlowPanel>
      ) : null}

      {!inFlow ? (
        <div className="space-y-4">
          {s.roster.sections.length === 0 ? (
            <div className="rounded-card border border-dashed border-zamtel-border bg-white px-6 py-12 text-center shadow-card">
              <Layers className="mx-auto h-10 w-10 text-brand-primary/70" aria-hidden />
              <p className="mt-4 text-lg font-semibold text-brand-dark">No sub-sections yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-zamtel-muted">
                Create sub-sections to organize {department.name} into smaller teams, then assign members to each one.
              </p>
              <Button className="mt-6" type="button" onClick={s.startAddSection}>
                Create first sub-section
              </Button>
            </div>
          ) : (
            s.roster.sections.map((section, index) => (
              <SectionRosterCard
                key={section.id}
                title={section.name}
                memberCount={section.users.length}
                managerName={section.manager?.fullName}
                isActive={section.isActive}
                users={section.users}
                defaultOpen={index === 0}
                emptyMessage="No members assigned yet. Use Manage members to add people."
                onEdit={() => s.startEditSection(section)}
                onManageMembers={() => s.startManageMembers(section)}
              />
            ))
          )}

          <SectionRosterCard
            title="Department-wide"
            memberCount={s.roster.departmentUsers.length}
            isActive={department.isActive}
            users={s.roster.departmentUsers}
            emptyMessage="All members are assigned to a sub-section."
            variant="unassigned"
          />
        </div>
      ) : null}
    </>
  );
}
