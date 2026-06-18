import type { ReactNode } from "react";
import { DataTableCellContent } from "@/components/shared/data-table-cell";
import { DataTableMobileList } from "@/components/shared/data-table-mobile-list";
import { Table, Td, Th } from "@/components/ui/table";

export type DataTableColumn = { key: string; label: string };
export type DataTableRow = Record<string, string | number | ReactNode>;

export function DataTable({
  columns,
  rows,
  caption,
}: {
  columns: DataTableColumn[];
  rows: DataTableRow[];
  caption?: string;
}) {
  return (
    <>
      <DataTableMobileList columns={columns} rows={rows} />
      <div className="hidden lg:block">
        <Table>
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr>
              {columns.map((c) => (
                <Th key={c.key} className={c.key === "__view" || c.key === "__actions" ? "min-w-[100px]" : undefined}>
                  {c.label}
                </Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={typeof row.id === "string" || typeof row.id === "number" ? String(row.id) : i}
                className="rf-table-row even:bg-brand-primary/[0.02] hover:bg-brand-primary/[0.06]"
              >
                {columns.map((c) => (
                  <Td
                    key={c.key}
                    className={c.key === "__view" || c.key === "__actions" ? "text-right" : undefined}
                  >
                    <DataTableCellContent columnKey={c.key} raw={row[c.key]} />
                  </Td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </>
  );
}
