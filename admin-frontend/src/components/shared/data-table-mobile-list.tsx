import { isValidElement, type ReactNode } from "react";
import { DataTableCellContent } from "@/components/shared/data-table-cell";
import type { DataTableColumn, DataTableRow } from "@/components/shared/data-table";

const TITLE_KEYS = ["title", "label", "name", "email", "field"];
const META_KEYS = new Set(["department", "requestType", "deadline", "role", "roleName", "fieldType", "required", "displayOrder", "managerName", "templateCount"]);
const SKIP_KEYS = new Set(["__view", "__actions", "id"]);

function titleColumn(columns: DataTableColumn[]): DataTableColumn | undefined {
  return columns.find((c) => TITLE_KEYS.includes(c.key)) ?? columns.find((c) => !SKIP_KEYS.has(c.key) && !c.key.includes("status"));
}

function badgeColumns(columns: DataTableColumn[]): DataTableColumn[] {
  return columns.filter((c) => {
    const k = c.key.toLowerCase();
    return k.includes("status") || k === "active" || k.includes("priority");
  });
}

function metaColumns(columns: DataTableColumn[]): DataTableColumn[] {
  return columns.filter((c) => META_KEYS.has(c.key));
}

function progressColumn(columns: DataTableColumn[]): DataTableColumn | undefined {
  return columns.find((c) => c.key.toLowerCase().includes("progress"));
}

export function DataTableMobileList({ columns, rows }: { columns: DataTableColumn[]; rows: DataTableRow[] }) {
  const titleCol = titleColumn(columns);
  const badges = badgeColumns(columns);
  const meta = metaColumns(columns);
  const progressCol = progressColumn(columns);
  const actionKey = columns.find((c) => c.key === "__view" || c.key === "__actions")?.key;

  return (
    <ul className="space-y-3 lg:hidden" aria-label="List">
      {rows.map((row, i) => (
        <li
          key={i}
          className="rounded-card border border-zamtel-border bg-white p-4 shadow-card transition-[border-color,box-shadow] hover:border-brand-primary/25 hover:shadow-md"
        >
          {titleCol ? (
            <div className="min-w-0 text-base font-semibold leading-snug text-brand-dark">
              <DataTableCellContent columnKey={titleCol.key} raw={row[titleCol.key]} />
            </div>
          ) : null}

          {badges.length ? (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {badges.map((c) => (
                <DataTableCellContent key={c.key} columnKey={c.key} raw={row[c.key]} />
              ))}
            </div>
          ) : null}

          {progressCol ? (
            <div className="mt-3">
              <DataTableCellContent columnKey={progressCol.key} raw={row[progressCol.key]} compact />
            </div>
          ) : null}

          {meta.length ? (
            <dl className="mt-3 space-y-2 border-t border-zamtel-border pt-3">
              {meta.map((c) => {
                const raw = row[c.key];
                if (raw == null || (typeof raw === "string" && raw.trim() === "")) return null;
                return (
                  <div key={c.key} className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <dt className="shrink-0 text-xs font-semibold uppercase tracking-wide text-zamtel-muted">{c.label}</dt>
                    <dd className="min-w-0 text-sm">
                      <DataTableCellContent columnKey={c.key} raw={raw} />
                    </dd>
                  </div>
                );
              })}
            </dl>
          ) : null}

          {actionKey && isValidElement(row[actionKey]) ? (
            <div className="mt-4 flex flex-col gap-2 border-t border-zamtel-border pt-3 [&_a]:w-full [&_button]:min-h-11 [&_button]:w-full sm:flex-row sm:flex-wrap">
              {row[actionKey] as ReactNode}
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
