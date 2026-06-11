"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { MilestoneDialogs } from "@/components/task-detail/milestone-dialogs";
import { RequestDetailBody } from "@/components/request-detail/request-detail-body";
import { RequestDetailDialogs } from "@/components/request-detail/request-detail-dialogs";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { PageHeader } from "@/components/shared/page-header";
import { BackButtonLink } from "@/components/ui/back-button-link";
import { useAssignmentDetail } from "@/hooks/use-assignment-detail";
import { useRequestDetail } from "@/hooks/use-request-detail";
import { useAuth } from "@/lib/auth-context";
import { hasManagerInbox, resolveInboxDepartment } from "@/lib/role-utils";

export default function Page() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <RequestDetailPageContent />
    </Suspense>
  );
}

function RequestDetailPageContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const { state } = useAuth();
  const managesInbox = hasManagerInbox(state.auth);
  const inboxDepartment = managesInbox ? resolveInboxDepartment(state.auth) : null;
  const d = useRequestDetail(params.id, state.auth.userId);
  const work = useAssignmentDetail(d.req?.assignmentId ?? undefined, state.auth.userId);

  const backHref =
    from === "inbox" ? "/department-inbox" : from === "tasks" ? "/tasks" : "/requests";
  const backLabel =
    from === "inbox"
      ? "Back to Incoming requests"
      : from === "tasks"
        ? "Back to My Assigned Tasks"
        : "Back to My Requests";
  const backAction = <BackButtonLink href={backHref}>{backLabel}</BackButtonLink>;

  const canManageInbox =
    managesInbox &&
    !!d.req &&
    !!inboxDepartment &&
    d.req.department.toLowerCase() === inboxDepartment.toLowerCase();

  if (d.loading) {
    return <PageHeader title="Request details" description="Loading…" />;
  }

  if (!d.req || d.error) {
    return (
      <PageHeader title="Request not found" description={d.error ?? ""} actions={backAction} />
    );
  }

  return (
    <>
      <PageHeader title="Request details" description={d.req.requestNumber} actions={backAction} />
      <RequestDetailBody
        req={d.req}
        assignment={work.assignment}
        assignmentLoading={work.loading}
        canReviewCompletion={!!d.canReviewCompletion}
        canManageInbox={canManageInbox}
        inboxDepartment={inboxDepartment}
        userId={state.auth.userId}
        milestoneSaving={work.saving}
        onProvideOpen={() => {
          d.setProvideError(null);
          d.setProvideOpen(true);
        }}
        onApproveOpen={() => d.setApproveOpen(true)}
        onReopenOpen={() => d.setReopenOpen(true)}
        onReqUpdated={d.reload}
        onAddMilestoneOpen={() => work.setAddOpen(true)}
        onMarkReady={() => void work.markReadyForReview().then(() => d.reload())}
        onUpdateMilestone={work.openUpdate}
      />
      <RequestDetailDialogs
        req={d.req}
        userId={state.auth.userId}
        provideOpen={d.provideOpen}
        setProvideOpen={d.setProvideOpen}
        approveOpen={d.approveOpen}
        setApproveOpen={d.setApproveOpen}
        reopenOpen={d.reopenOpen}
        setReopenOpen={d.setReopenOpen}
        providedValues={d.providedValues}
        setProvidedValues={d.setProvidedValues}
        provideError={d.provideError}
        setProvideError={d.setProvideError}
        provideSaving={d.provideSaving}
        approveSaving={d.approveSaving}
        reopenSaving={d.reopenSaving}
        onSubmitMissing={() => void d.submitMissingInfo()}
        onApprove={() => void d.approve()}
        onReopen={() => void d.reopen()}
      />
      {work.assignment ? (
        <MilestoneDialogs
          assignment={work.assignment}
          addOpen={work.addOpen}
          setAddOpen={work.setAddOpen}
          updateOpen={work.updateOpen}
          setUpdateOpen={work.setUpdateOpen}
          mTitle={work.mTitle}
          setMTitle={work.setMTitle}
          mOwnerId={work.mOwnerId}
          setMOwnerId={work.setMOwnerId}
          mDeadline={work.mDeadline}
          setMDeadline={work.setMDeadline}
          mDescription={work.mDescription}
          setMDescription={work.setMDescription}
          mStatus={work.mStatus}
          setMStatus={work.setMStatus}
          mProgress={work.mProgress}
          setMProgress={work.setMProgress}
          formError={work.formError}
          fieldErrors={work.fieldErrors}
          canAddMilestone={work.canAddMilestone}
          saving={work.saving}
          userId={state.auth.userId}
          onAdd={() => void work.submitAddMilestone().then(() => d.reload())}
          onUpdate={() => void work.submitUpdateMilestone().then(() => d.reload())}
        />
      ) : null}
    </>
  );
}
