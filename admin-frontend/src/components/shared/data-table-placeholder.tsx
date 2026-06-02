import { isValidElement } from "react";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Progress } from "@/components/ui/progress";
import { Table, Td, Th } from "@/components/ui/table";

function parsePercent(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.min(100, value));
  if (typeof value !== "string") return null;
  const m = value.trim().match(/^(\d{1,3})%$/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, n));
}

export function DataTablePlaceholder({columns,rows}:{columns:{key:string;label:string}[];rows:Record<string,string|number>[]}){
  return (
    <Table>
      <thead>
        <tr>{columns.map(c=><Th key={c.key}>{c.label}</Th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row,i)=>(
          <tr key={i} className="hover:bg-brand-primary/5">
            {columns.map((c)=>{
              const raw = row[c.key];
              if (isValidElement(raw)) return <Td key={c.key}>{raw}</Td>;
              const str = raw == null ? "-" : String(raw);

              if (c.key.toLowerCase().includes("status") || c.key.toLowerCase() === "active") {
                return <Td key={c.key}><StatusBadge status={str} /></Td>;
              }

              if (c.key.toLowerCase().includes("priority")) {
                return <Td key={c.key}><PriorityBadge priority={str} /></Td>;
              }

              if (c.key.toLowerCase().includes("progress")) {
                const pct = parsePercent(raw);
                if (pct == null) return <Td key={c.key}>{str}</Td>;
                return (
                  <Td key={c.key}>
                    <div className="flex min-w-[160px] items-center gap-3">
                      <div className="w-full"><Progress value={pct} /></div>
                      <span className="w-10 text-right text-xs font-medium text-slate-700">{pct}%</span>
                    </div>
                  </Td>
                );
              }

              return <Td key={c.key}>{str}</Td>;
            })}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

