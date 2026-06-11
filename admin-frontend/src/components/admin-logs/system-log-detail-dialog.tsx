"use client";

import { Dialog } from "@/components/ui/dialog";
import type { SystemEventItem } from "@/lib/admin-api";
import { formatRelativeTime } from "@/lib/utils";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-zamtel-border/60 py-3 last:border-b-0 sm:grid-cols-[8rem_1fr] sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-zamtel-muted">{label}</dt>
      <dd className="text-sm text-slate-800">{value}</dd>
    </div>
  );
}

export function SystemLogDetailDialog({
  event,
  open,
  onOpenChange,
}: {
  event: SystemEventItem | null;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  if (!event) return null;

  const when = new Date(event.createdAt);
  const whenLabel = Number.isNaN(when.getTime())
    ? event.createdAt
    : `${when.toLocaleString()} (${formatRelativeTime(event.createdAt)})`;
  const route =
    event.httpMethod && event.path
      ? `${event.httpMethod} ${event.path}`
      : event.path ?? "—";
  const user =
    event.userName && event.userEmail
      ? `${event.userName} (${event.userEmail})`
      : event.userName ?? event.userEmail ?? "—";
  const portal =
    event.context && typeof event.context.portal === "string"
      ? event.context.portal
      : null;
  const stack =
    event.context && typeof event.context.stack === "string"
      ? event.context.stack
      : null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={event.code}
      description={`${event.level} · ${whenLabel}`}
    >
      <dl>
        <DetailRow label="Level" value={event.level} />
        <DetailRow label="When" value={whenLabel} />
        <DetailRow label="Route" value={route} />
        <DetailRow
          label="HTTP status"
          value={event.statusCode != null ? String(event.statusCode) : "—"}
        />
        <DetailRow label="Request ID" value={event.requestId ?? "—"} />
        <DetailRow label="User" value={user} />
        {portal ? <DetailRow label="Portal" value={portal} /> : null}
      </dl>
      <div className="mt-4 rounded-md border border-zamtel-border bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zamtel-muted">Message</p>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">
          {event.message}
        </p>
      </div>
      {stack ? (
        <div className="mt-4 rounded-md border border-zamtel-border bg-slate-900 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Stack trace</p>
          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-slate-100">
            {stack}
          </pre>
        </div>
      ) : null}
    </Dialog>
  );
}
