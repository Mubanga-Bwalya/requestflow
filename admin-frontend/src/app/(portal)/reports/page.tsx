"use client";

import { useEffect, useState } from "react";
import { ReportsSkeleton } from "@/components/shared/skeleton";
import { ReportsView } from "@/components/admin-reports/reports-view";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { fieldLabelClassName } from "@/components/ui/field-control";
import { Select } from "@/components/ui/select";
import { fetchDepartments, type ApiDepartment } from "@/lib/departments-api";
import { invalidateApiCache, peekApiCache } from "@/lib/query-cache";
import { apiErrorMessage } from "@/lib/api-error";
import { fetchAdminReports, type AdminReportsData } from "@/lib/admin-api";

export default function Page() {
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [dept, setDept] = useState("ALL");
  const [data, setData] = useState<AdminReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    fetchDepartments(true).then(setDepartments).catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const cacheKey = `admin:reports:v2:${dept}`;
    const cached = peekApiCache<AdminReportsData>(cacheKey);
    if (cached) {
      setData(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);
    const param = dept === "ALL" ? undefined : dept;
    fetchAdminReports(param)
      .then((report) => {
        if (!cancelled) setData(report);
      })
      .catch((err) => {
        if (!cancelled && !cached) {
          setData(null);
          setError(
            apiErrorMessage(
              err,
              "Could not load reports. Start the backend with: cd backend && npm run build && npm run start:dev",
            ),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dept, reloadKey]);

  return (
    <>
      <PageHeader
        title="Reports"
        description="KPIs, bottlenecks, and recommended actions from live request data."
      />
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="min-w-[12rem]">
          <label className={fieldLabelClassName} htmlFor="report-dept">
            Department
          </label>
          <Select
            id="report-dept"
            className="mt-1"
            value={dept}
            onChange={(e) => setDept(e.target.value)}
          >
            <option value="ALL">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </Select>
        </div>
        <Button
          type="button"
          variant="outline"
          size="compact"
          onClick={() => {
            invalidateApiCache(`admin:reports:v2:${dept}`);
            setReloadKey((k) => k + 1);
          }}
        >
          Refresh
        </Button>
      </div>

      {error ? (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading && !data ? (
        <ReportsSkeleton />
      ) : data ? (
        <ReportsView data={data} />
      ) : null}
    </>
  );
}
