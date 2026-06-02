"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DataTablePlaceholder } from "@/components/shared/data-table-placeholder";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { useLocalStore } from "@/lib/local-store";

export default function Page() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { state, actions } = useLocalStore();
  const assignment = useMemo(() => state.assignments.find((a) => a.id === params.id) ?? null, [params.id, state.assignments]);

  const [addOpen, setAddOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [mTitle, setMTitle] = useState("");
  const [mOwner, setMOwner] = useState("");
  const [mDeadline, setMDeadline] = useState("");
  const [mStatus, setMStatus] = useState<"TODO" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED">("TODO");
  const [mProgress, setMProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const members = assignment?.members.map((m) => m.name) ?? [];
  const selectedMilestone = assignment?.milestones.find((m) => m.id === selectedMilestoneId) ?? null;

  function openUpdate(milestoneId: string) {
    setError(null);
    setSelectedMilestoneId(milestoneId);
    const m = assignment?.milestones.find((x) => x.id === milestoneId);
    if (m) {
      setMProgress(m.progress);
      setMStatus(m.status as any);
    }
    setUpdateOpen(true);
  }

  if (!assignment) {
    return (
      <AppShell title="Task / Assignment Details">
        <PageHeader title="Assignment not found" description="This assignment does not exist in local mock state." actions={<Button onClick={() => router.push("/tasks")}>Back to Tasks</Button>} />
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600">Try returning to the task list.</p>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell title="Task / Assignment Details">
      <PageHeader title="Task / Assignment Details" description="Structured milestone planning and progress updates for assigned members." />
      <div className="space-y-4">
        <Card className="relative overflow-hidden">
          <div className="absolute left-0 top-0 h-1 w-full bg-brand-primary" aria-hidden />
          <CardContent>
            <h2 className="text-xl font-semibold text-brand-dark">{assignment.title}</h2>
            <p className="text-sm text-slate-700">Related Request: {assignment.relatedRequest}</p>
            <p className="text-sm text-slate-700">Assigned Members: {assignment.members.map((m) => m.name).join(", ")}</p>
            <div className="mt-3">
              <Progress value={assignment.progress} />
              <p className="mt-2 text-sm text-slate-700">
                Overall Progress: <span className="font-medium text-brand-dark">{assignment.progress}%</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-semibold text-brand-dark">Milestones</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setAddOpen(true)}>
                  Add Milestone
                </Button>
                <Button
                  variant="success"
                  onClick={() => actions.setAssignmentStatus(assignment.id, "READY_FOR_REVIEW")}
                  disabled={assignment.status === "READY_FOR_REVIEW" || assignment.status === "COMPLETED"}
                >
                  Mark Ready for Review
                </Button>
              </div>
            </div>

            <div className="mt-3">
              <DataTablePlaceholder
                columns={[
                  { key: "title", label: "Milestone" },
                  { key: "owner", label: "Owner" },
                  { key: "status", label: "Status" },
                  { key: "progress", label: "Progress" },
                  { key: "__actions", label: "" },
                ]}
                rows={assignment.milestones.map((m) => ({
                  ...m,
                  progress: `${m.progress}%`,
                  __actions: (
                    <button className="text-brand-primary hover:underline" type="button" onClick={() => openUpdate(m.id)}>
                      Update
                    </button>
                  ) as any,
                }))}
              />
              <p className="mt-3 text-xs text-slate-600">Prototype logic: overall progress is the average of milestone progress.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={addOpen}
        onOpenChange={(v) => {
          setAddOpen(v);
          setError(null);
        }}
        title="Add Milestone"
        description="Create a new milestone for this assignment (local-only)."
      >
        {error ? <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Title *</label>
            <Input value={mTitle} onChange={(e) => setMTitle(e.target.value)} placeholder="e.g. Poster design draft" />
          </div>
          <div>
            <label className="text-sm font-medium">Owner *</label>
            <Select value={mOwner} onChange={(e) => setMOwner(e.target.value)}>
              <option value="">Select owner...</option>
              {members.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Deadline (optional)</label>
            <Input type="date" value={mDeadline} onChange={(e) => setMDeadline(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Initial status</label>
            <Select value={mStatus} onChange={(e) => setMStatus(e.target.value as any)}>
              <option value="TODO">TODO</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="BLOCKED">BLOCKED</option>
              <option value="COMPLETED">COMPLETED</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Initial progress</label>
            <Input type="number" min={0} max={100} value={String(mProgress)} onChange={(e) => setMProgress(Number(e.target.value || 0))} />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => setAddOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setError(null);
              if (!mTitle.trim()) return setError("Title is required.");
              if (!mOwner) return setError("Owner is required.");
              const progress = Math.max(0, Math.min(100, Number.isFinite(mProgress) ? mProgress : 0));
              actions.addMilestone(assignment.id, { title: mTitle.trim(), owner: mOwner, status: mStatus, progress });
              setMTitle("");
              setMOwner("");
              setMDeadline("");
              setMStatus("TODO");
              setMProgress(0);
              setAddOpen(false);
            }}
          >
            Add Milestone
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={updateOpen}
        onOpenChange={(v) => {
          setUpdateOpen(v);
          setError(null);
        }}
        title="Update Milestone Progress"
        description={selectedMilestone ? `Update progress for: ${selectedMilestone.title}` : "Update milestone"}
      >
        {error ? <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Status</label>
            <Select value={mStatus} onChange={(e) => setMStatus(e.target.value as any)}>
              <option value="TODO">TODO</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="BLOCKED">BLOCKED</option>
              <option value="COMPLETED">COMPLETED</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Progress (0-100)</label>
            <Input type="number" min={0} max={100} value={String(mProgress)} onChange={(e) => setMProgress(Number(e.target.value || 0))} />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => setUpdateOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!selectedMilestoneId) return setUpdateOpen(false);
              const progress = Math.max(0, Math.min(100, Number.isFinite(mProgress) ? mProgress : 0));
              actions.updateMilestone(assignment.id, selectedMilestoneId, { progress, status: mStatus });
              setUpdateOpen(false);
            }}
          >
            Save
          </Button>
        </div>
      </Dialog>
    </AppShell>
  );
}
