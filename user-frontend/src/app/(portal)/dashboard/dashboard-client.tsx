"use client";

import { useMemo } from "react";
import { ClipboardList, Inbox, List, MessageCircleWarning } from "lucide-react";
import { DashboardNextStepsPanel } from "@/components/dashboard/dashboard-next-steps-panel";
import { DashboardRecentRequests, DashboardShortcuts } from "@/components/dashboard/dashboard-sidebar-panels";
import { DashboardStatSkeletons, StatChip } from "@/components/dashboard/dashboard-stat-chips";
import { DashboardRecentRequestsSkeleton } from "@/components/shared/skeleton";
import { ApiErrorBanner } from "@/components/shared/api-error-banner";
import { PageHeader } from "@/components/shared/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { useUserWorkspace } from "@/hooks/use-user-workspace";
import { buildNextSteps } from "@/lib/dashboard-next-steps";
import { useAuth } from "@/lib/auth-context";
import { hasManagerInbox, resolveInboxDepartment } from "@/lib/role-utils";

export function DashboardClient() {
  const { state } = useAuth();
  const isManager = hasManagerInbox(state.auth);
  const ws = useUserWorkspace(
    state.auth.userId,
    isManager ? resolveInboxDepartment(state.auth) : null,
    isManager,
  );

  const nextSteps = useMemo(
    () => buildNextSteps(ws.requests, ws.assignments, ws.inbox, isManager),
    [ws.requests, ws.assignments, ws.inbox, isManager],
  );

  const recentRequests = useMemo(() => {
    return [...ws.requests]
      .sort((a, b) => {
        const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return tb - ta;
      })
      .slice(0, 3);
  }, [ws.requests]);

  const displayName = state.profile.displayName || "there";
  const firstName = displayName.split(" ")[0];
  const actionCount = nextSteps.length;

  const description = ws.loading && !ws.requests.length
    ? "Pulling together your latest requests and tasks…"
    : ws.error
      ? "Some dashboard data could not be loaded."
      : actionCount > 0
      ? `You have ${actionCount} item${actionCount === 1 ? "" : "s"} waiting on you.`
      : "You're caught up — here's a quick snapshot of your work.";

  return (
    <>
      <PageHeader
        title={`Welcome, ${firstName}`}
        description={description}
        actions={<ButtonLink href="/requests/create">New request</ButtonLink>}
      />

      <div className="space-y-5">
        <ApiErrorBanner message={ws.error} onRetry={() => void ws.reload()} />
        <div className={`grid gap-3 ${isManager ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"}`}>
          {ws.loading ? (
            <DashboardStatSkeletons count={isManager ? 4 : 3} />
          ) : (
            <>
              <StatChip
                href="/requests"
                value={ws.stats.myRequestsTotal}
                label="My requests"
                description="Submitted by you"
                icon={List}
              />
              <StatChip
                href="/requests?tab=NEEDS_ACTION"
                value={ws.stats.needsResponse}
                label="Needs your response"
                description="Waiting on your input"
                icon={MessageCircleWarning}
                attention
              />
              <StatChip
                href="/tasks"
                value={ws.stats.tasksToStart}
                label="Tasks to start"
                description="Assigned to you"
                icon={ClipboardList}
                attention
              />
              {isManager ? (
                <StatChip
                  href="/department-inbox"
                  value={ws.stats.inboxActions}
                  label="Incoming (team)"
                  description="Needs team action"
                  icon={Inbox}
                  attention
                />
              ) : null}
            </>
          )}
        </div>

        <div className="grid gap-5 lg:grid-cols-5">
          <DashboardNextStepsPanel loading={ws.loading} steps={nextSteps} />
          <div className="flex flex-col gap-5 lg:col-span-2">
            <DashboardShortcuts isManager={isManager} />
            {ws.loading && !recentRequests.length ? (
              <DashboardRecentRequestsSkeleton />
            ) : (
              <DashboardRecentRequests requests={recentRequests} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
