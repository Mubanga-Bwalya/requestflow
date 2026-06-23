"use client";

import type { Dispatch, SetStateAction } from "react";
import { ActionChoiceCard } from "@/components/shared/action-choice-card";
import { TemplateField } from "@/components/create-request/template-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { fieldLabelClassName } from "@/components/ui/field-control";
import { Select } from "@/components/ui/select";
import { PRIORITY_OPTIONS, priorityLabel } from "@/lib/create-request-utils";
import type { Department, RequestTypeDef } from "@/lib/request-templates";
import { departmentDescription } from "@/lib/department-copy";
import type { Priority } from "@/types/request";

type Props = {
  step: number;
  department: Department | null;
  departments: { id: string; name: string; description: string | null }[];
  loadingDepartments: boolean;
  section: string | null;
  sections: { id: string; name: string }[];
  onSectionChange: (name: string) => void;
  templates: { id: string; name: string; department: Department }[];
  loadingTemplates: boolean;
  requestTypeId: string;
  setRequestTypeId: (id: string) => void;
  requestType: RequestTypeDef | null;
  loadingFields: boolean;
  defaultPriority: Priority;
  priority: Priority;
  setPriority: (v: Priority) => void;
  showPriorityOverride: boolean;
  setShowPriorityOverride: (v: boolean) => void;
  allowUploads: boolean;
  fileUploadLimitMb: number;
  values: Record<string, string>;
  fieldErrors: Record<string, string>;
  attachmentName: string;
  onDepartmentChange: (d: Department) => void;
  setFieldValue: (key: string, value: string) => void;
  setAttachmentName: (name: string) => void;
  setValues: Dispatch<SetStateAction<Record<string, string>>>;
  createdId: string | null;
  onViewRequests: () => void;
  onViewDetail: (id: string) => void;
  onCreateAnother: () => void;
};

export function CreateRequestSteps(props: Props) {
  const {
    step,
    department,
    departments,
    loadingDepartments,
    section,
    sections,
    onSectionChange,
    templates,
    loadingTemplates,
    requestTypeId,
    setRequestTypeId,
    requestType,
    loadingFields,
    defaultPriority,
    priority,
    setPriority,
    showPriorityOverride,
    setShowPriorityOverride,
    allowUploads,
    fileUploadLimitMb,
    values,
    fieldErrors,
    attachmentName,
    onDepartmentChange,
    setFieldValue,
    setAttachmentName,
    setValues,
    createdId,
    onViewRequests,
    onViewDetail,
    onCreateAnother,
  } = props;

  if (step === 1) {
    return (
      <div className="space-y-5">
        <div className="rounded-card border border-zamtel-border bg-white p-5">
          <p className="font-semibold text-brand-dark">Choose department and request type</p>
          <p className="mt-1 text-sm text-zamtel-muted">
            Select who should handle your request, then pick the matching form.
          </p>
          {loadingDepartments ? (
            <p className="mt-2 text-sm text-zamtel-muted">Loading departments…</p>
          ) : departments.length ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {departments.map((d) => (
                <ActionChoiceCard
                  key={d.id}
                  title={d.name}
                  description={departmentDescription(d.name, d.description)}
                  variant={department === d.name ? "primary" : "default"}
                  dataTestId={`department-card-${d.name.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => onDepartmentChange(d.name)}
                />
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-amber-800">No active departments are configured. Contact your administrator.</p>
          )}
        </div>

        {department && sections.length ? (
          <div className="rounded-card border border-zamtel-border bg-white p-5">
            <label className={fieldLabelClassName}>Section</label>
            <p className="mt-1 text-sm text-zamtel-muted">
              Choose the section handling your request, or keep it department-wide.
            </p>
            <div className="mt-3">
              <Select value={section ?? ""} onChange={(e) => onSectionChange(e.target.value)}>
                <option value="">{department} (department-wide)</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        ) : null}

        {department ? (
          <div className="rounded-card border border-zamtel-border bg-white p-5">
            <label className={fieldLabelClassName}>Request type *</label>
            <p className="mt-1 text-sm text-zamtel-muted">
              {loadingTemplates
                ? "Loading types from database…"
                : `${templates.length} type(s) available for ${section ?? department}.`}
            </p>
            <div className="mt-3" data-rf-testid="request-type-select">
              <Select
                className="mt-0"
                value={requestTypeId}
                disabled={loadingTemplates || !templates.length}
                onChange={(e) => {
                  setRequestTypeId(e.target.value);
                  setValues({});
                }}
              >
                <option value="">Select request type…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
            {!loadingTemplates && !templates.length ? (
              <p className="mt-2 text-sm text-amber-800">No request types are available for this department.</p>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="rounded-card border border-zamtel-border bg-white p-5">
        <p className="font-semibold text-brand-dark">Request details</p>
        <p className="mt-1 text-sm text-zamtel-muted">
          Complete the fields for {requestType?.name ?? "your request"}. Required fields are marked with *.
        </p>
        {loadingFields ? (
          <p className="mt-2 text-sm text-zamtel-muted">Loading form fields…</p>
        ) : requestType ? (
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {requestType.fields.map((f) => (
                <TemplateField
                  key={f.key}
                  field={f}
                  value={values[f.key] ?? ""}
                  error={fieldErrors[f.key]}
                  allowUploads={allowUploads}
                  fileUploadLimitMb={fileUploadLimitMb}
                  attachmentName={attachmentName}
                  onChange={setFieldValue}
                  onAttachmentName={setAttachmentName}
                />
              ))}
            </div>

            <details
              className="rounded-md border border-brand-dark/10 bg-brand-primary/5 p-3"
              open={showPriorityOverride}
              onToggle={(e) => setShowPriorityOverride((e.target as HTMLDetailsElement).open)}
            >
              <summary className="rf-summary-toggle px-1 text-sm font-medium text-brand-dark">
                Change priority (optional)
              </summary>
              <p className="mt-2 text-xs text-zamtel-muted">
                Defaults to {priorityLabel(defaultPriority)}. Only change this if your request needs faster handling.
              </p>
              <div className="mt-3 max-w-xs">
                <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
            </details>
          </div>
        ) : (
          <p className="mt-2 text-sm text-zamtel-muted">Select a request type on the previous step.</p>
        )}
      </div>
    );
  }

  if (step === 3 && requestType) {
    const reviewPriority = showPriorityOverride ? priority : defaultPriority;
    return (
      <div className="rounded-md border border-brand-dark/10 bg-white p-4">
        <p className="font-semibold text-brand-dark">Review and submit</p>
        <Alert title="Review summary">
          <div className="space-y-2">
            <p>
              <span className="font-medium">Department:</span> {department}
            </p>
            <p>
              <span className="font-medium">Request type:</span> {requestType.name}
            </p>
            <p>
              <span className="font-medium">Priority:</span> {priorityLabel(reviewPriority)}
              {showPriorityOverride ? "" : " (default)"}
            </p>
            {requestType.fields.map((f) => {
              const raw = values[f.key] ?? "";
              let display = raw || "—";
              if (f.type === "CHECKBOX") display = raw === "true" ? "Yes" : "No";
              if (f.type === "MULTI_SELECT" && raw) display = raw.split("|||").join(", ");
              return (
                <p key={f.key}>
                  <span className="font-medium">{f.label}:</span> {display}
                </p>
              );
            })}
            {attachmentName ? (
              <p>
                <span className="font-medium">Attachment:</span> {attachmentName}
              </p>
            ) : null}
          </div>
        </Alert>
        <p className="mt-3 text-xs text-zamtel-muted">
          Your name, request number, and submission date are added automatically when you submit.
        </p>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="rounded-md border border-brand-lime/50 bg-brand-lime/30 p-4">
        <p className="text-lg font-semibold text-brand-dark">Request submitted</p>
        <p className="mt-1 text-sm text-brand-dark/80">
          Your request was sent. The department will review it and may contact you if they need more information.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={onViewRequests}>View My Requests</Button>
          <Button variant="outline" onClick={onCreateAnother}>
            Create Another Request
          </Button>
          {createdId ? (
            <Button variant="outline" onClick={() => onViewDetail(createdId)}>
              View Details
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return null;
}
