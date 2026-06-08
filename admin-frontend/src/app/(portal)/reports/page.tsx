"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { fieldLabelClassName } from "@/components/ui/field-control";
import { Select } from "@/components/ui/select";
import { fetchDepartments, type ApiDepartment } from "@/lib/departments-api";
import { peekApiCache } from "@/lib/query-cache";
import { fetchAdminReports, type ReportCard } from "@/lib/admin-api";

export default function Page() {
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [dept, setDept] = useState("ALL");
  const [cards, setCards] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartments(true).then(setDepartments).catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const cacheKey = `admin:reports:${dept}`;
    const cached = peekApiCache<{ cards: ReportCard[] }>(cacheKey);
    if (cached) {
      setCards(cached.cards);
      setLoading(false);
    } else {
      setLoading(true);
    }
    const param = dept === "ALL" ? undefined : dept;
    fetchAdminReports(param)
      .then((r) => {
        if (!cancelled) setCards(r.cards);
      })
      .catch(() => {
        if (!cancelled && !cached) setCards([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dept]);

  return (
    <>
      <PageHeader title="Reports" description="Operational summaries from live request data." />
      <div className="mb-4 max-w-xs">
        <label className={fieldLabelClassName}>Filter by department</label>
        <Select className="mt-1" value={dept} onChange={(e) => setDept(e.target.value)}>
          <option value="ALL">All</option>
          {departments.map((d) => (
            <option key={d.id} value={d.name}>
              {d.name}
            </option>
          ))}
        </Select>
      </div>
      {loading ? (
        <p className="text-sm text-muted">Loading reports…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map((item) => (
            <Card key={item.label} className="relative overflow-hidden">
              <div className="absolute left-0 top-0 h-1 w-full bg-brand-primary" aria-hidden />
              <CardContent>
                <p className="text-sm text-muted">{item.label}</p>
                <p className="mt-1 text-lg font-semibold text-brand-dark">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
