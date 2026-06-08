"use client";

import { useParams } from "next/navigation";
import { RequestDetailBody } from "@/components/request-detail/request-detail-body";
import { RequestDetailDialogs } from "@/components/request-detail/request-detail-dialogs";
import { PageHeader } from "@/components/shared/page-header";
import { BackButtonLink } from "@/components/ui/back-button-link";
import { useRequestDetail } from "@/hooks/use-request-detail";
import { useAuth } from "@/lib/auth-context";

export default function Page() {
  const params = useParams<{ id: string }>();
  const { state } = useAuth();
  const d = useRequestDetail(params.id, state.auth.userId);

  const backAction = (
    <BackButtonLink href="/requests">Back to My Requests</BackButtonLink>
  );

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
        canReviewCompletion={!!d.canReviewCompletion}
        userId={state.auth.userId}
        onProvideOpen={() => {
          d.setProvideError(null);
          d.setProvideOpen(true);
        }}
        onApproveOpen={() => d.setApproveOpen(true)}
        onReopenOpen={() => d.setReopenOpen(true)}
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
    </>
  );
}
