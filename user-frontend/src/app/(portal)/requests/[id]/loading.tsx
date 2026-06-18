import { RequestDetailSkeleton } from "@/components/request-detail/request-detail-skeleton";
import { PageHeader } from "@/components/shared/page-header";

export default function RequestDetailLoading() {
  return (
    <>
      <PageHeader title="Request details" description="Loading request…" />
      <RequestDetailSkeleton />
    </>
  );
}
