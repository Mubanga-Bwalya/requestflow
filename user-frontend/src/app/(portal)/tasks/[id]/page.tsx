"use client";

import { useParams } from "next/navigation";
import { MilestoneDialogs } from "@/components/task-detail/milestone-dialogs";
import { TaskDetailBody } from "@/components/task-detail/task-detail-body";
import { PageHeader } from "@/components/shared/page-header";
import { BackButtonLink } from "@/components/ui/back-button-link";
import { useAssignmentDetail } from "@/hooks/use-assignment-detail";
import { useAuth } from "@/lib/auth-context";

export default function Page() {
  const params = useParams<{ id: string }>();
  const { state } = useAuth();
  const a = useAssignmentDetail(params.id, state.auth.userId);

  const backAction = (
    <BackButtonLink href="/tasks">Back to My Assigned Tasks</BackButtonLink>
  );

  if (a.loading) {
    return <PageHeader title="Task details" description="Loading…" />;
  }

  if (!a.assignment || a.error) {
    return (
      <PageHeader title="Task not found" description={a.error ?? ""} actions={backAction} />
    );
  }

  return (
    <>
      <PageHeader title="Task details" description={a.assignment.title} actions={backAction} />
      <TaskDetailBody
        assignment={a.assignment}
        userId={state.auth.userId}
        saving={a.saving}
        onAddOpen={() => a.setAddOpen(true)}
        onMarkReady={() => void a.markReadyForReview()}
        onUpdateMilestone={a.openUpdate}
      />
      <MilestoneDialogs
        assignment={a.assignment}
        addOpen={a.addOpen}
        setAddOpen={a.setAddOpen}
        updateOpen={a.updateOpen}
        setUpdateOpen={a.setUpdateOpen}
        mTitle={a.mTitle}
        setMTitle={a.setMTitle}
        mOwnerId={a.mOwnerId}
        setMOwnerId={a.setMOwnerId}
        mDeadline={a.mDeadline}
        setMDeadline={a.setMDeadline}
        mDescription={a.mDescription}
        setMDescription={a.setMDescription}
        mStatus={a.mStatus}
        setMStatus={a.setMStatus}
        mProgress={a.mProgress}
        setMProgress={a.setMProgress}
        formError={a.formError}
        fieldErrors={a.fieldErrors}
        canAddMilestone={a.canAddMilestone}
        saving={a.saving}
        userId={state.auth.userId}
        onAdd={() => void a.submitAddMilestone()}
        onUpdate={() => void a.submitUpdateMilestone()}
      />
    </>
  );
}
