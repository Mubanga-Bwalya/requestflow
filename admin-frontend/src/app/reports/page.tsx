"use client";

import { useMemo, useState } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { reportSummary } from "@/lib/mock-data";

export default function Page() {
  const [dept, setDept] = useState<"ALL" | "HR" | "MARKETING">("ALL");

  const cards = useMemo(() => {
    if (dept === "ALL") return reportSummary;
    if (dept === "HR") {
      return reportSummary.map((c) =>
        c.label === "Requests by Department" ? { ...c, value: "HR 100%" } : c,
      );
    }
    return reportSummary.map((c) =>
      c.label === "Requests by Department" ? { ...c, value: "Marketing 100%" } : c,
    );
  }, [dept]);

  return (
    <AdminShell title="Reports">
      <PageHeader title="Reports" description="Operational summaries for request health and throughput." />
      <div className="mb-4 max-w-xs">
        <label className="text-sm font-medium">Filter by department</label>
        <Select value={dept} onChange={(e) => setDept(e.target.value as typeof dept)}>
          <option value="ALL">All</option>
          <option value="HR">HR</option>
          <option value="MARKETING">Marketing</option>
        </Select>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((item) => (
          <Card key={item.label} className="relative overflow-hidden">
            <div className="absolute left-0 top-0 h-1 w-full bg-brand-primary" aria-hidden />
            <CardContent>
              <p className="text-sm text-slate-600">{item.label}</p>
              <p className="mt-1 text-lg font-semibold text-brand-dark">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}
