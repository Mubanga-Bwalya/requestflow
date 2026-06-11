"use client";

import { DataTable, type DataTableColumn, type DataTableRow } from "@/components/shared/data-table";
import type { ActivityLogItem } from "@/lib/admin-api";
import { activityActionLabel } from "@/lib/activity-log-labels";
import { formatRelativeTime } from "@/lib/utils";

const columns: DataTableColumn[] = [
  { key: "when", label: "When" },
  { key: "type", label: "Type" },
  { key: "what", label: "What happened" },
  { key: "request", label: "Request" },
  { key: "who", label: "Who" },
];

export function ActivityLogsTable({ items }: { items: ActivityLogItem[] }) {
  const rows: DataTableRow[] = items.map((row) => ({
    when: formatRelativeTime(row.createdAt),
    type: (
      <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-xs font-medium text-brand-dark">
        {activityActionLabel(row.action)}
      </span>
    ),
    what: (
      <span className="block max-w-lg text-sm text-slate-700" title={row.description}>
        {row.description}
      </span>
    ),
    request: row.requestNumber ?? "—",
    who: row.userName ?? row.userEmail ?? "System",
  }));

  return <DataTable columns={columns} rows={rows} />;
}
