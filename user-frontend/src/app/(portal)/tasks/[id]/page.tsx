"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { PageHeader } from "@/components/shared/page-header";
import { BackButtonLink } from "@/components/ui/back-button-link";
import { fetchAssignmentDetail } from "@/lib/assignments-api";

/** Legacy route — team work now lives on the unified request detail page. */
export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    fetchAssignmentDetail(params.id)
      .then((assignment) => {
        if (!cancelled) {
          router.replace(`/requests/${assignment.requestId}?from=tasks`);
        }
      })
      .catch(() => {
        if (!cancelled) router.replace("/tasks");
      });
    return () => {
      cancelled = true;
    };
  }, [params.id, router]);

  return (
    <>
      <PageHeader
        title="Opening request…"
        description="Redirecting to the combined request view."
        actions={<BackButtonLink href="/tasks">Back to My Assigned Tasks</BackButtonLink>}
      />
      <LoadingScreen />
    </>
  );
}
