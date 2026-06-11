"use client";

import { useState } from "react";
import { SystemLogDetailDialog } from "@/components/admin-logs/system-log-detail-dialog";
import { DataTable, type DataTableColumn, type DataTableRow } from "@/components/shared/data-table";
import { TableActionButton } from "@/components/shared/table-action-button";
import type { SystemEventItem } from "@/lib/admin-api";
import { formatRelativeTime } from "@/lib/utils";

function levelBadge(level: SystemEventItem["level"]) {
  const cls =
    level === "ERROR"
      ? "rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800"
      : "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900";
  return <span className={cls}>{level}</span>;
}

const columns: DataTableColumn[] = [
  { key: "when", label: "When" },
  { key: "level", label: "Level" },
  { key: "code", label: "Code" },
  { key: "status", label: "HTTP" },
  { key: "request", label: "Request ID" },
  { key: "route", label: "Route" },
  { key: "user", label: "User" },
  { key: "message", label: "Message" },
  { key: "__view", label: "" },
];

export function SystemLogsTable({ items }: { items: SystemEventItem[] }) {
  const [selected, setSelected] = useState<SystemEventItem | null>(null);

  const open = (ev: SystemEventItem) => setSelected(ev);
  const close = () => setSelected(null);

  const rows: DataTableRow[] = items.map((ev) => ({
    when: formatRelativeTime(ev.createdAt),
    level: levelBadge(ev.level),
    code: ev.code,
    status: ev.statusCode != null ? String(ev.statusCode) : "—",
    request: ev.requestId ?? "—",
    route: ev.httpMethod && ev.path ? `${ev.httpMethod} ${ev.path}` : ev.path ?? "—",
    user: ev.userName ?? ev.userEmail ?? "—",
    message: (
      <button
        type="button"
        className="rf-text-link block max-w-md truncate text-left text-sm text-slate-700"
        onClick={() => open(ev)}
      >
        {ev.message}
      </button>
    ),
    __view: <TableActionButton onClick={() => open(ev)}>View</TableActionButton>,
  }));

  return (
    <>
      <DataTable columns={columns} rows={rows} />
      <SystemLogDetailDialog event={selected} open={selected !== null} onOpenChange={(next) => !next && close()} />
    </>
  );
}
