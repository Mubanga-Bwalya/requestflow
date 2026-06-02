"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStore } from "@/lib/local-store";
import { getRequestTypesForDepartment, type Department, type RequestTypeDef } from "@/lib/request-templates";

export function CreateRequestClient({ presetDepartment }: { presetDepartment: Department | null }) {
  const router = useRouter();
  const { actions } = useLocalStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [department, setDepartment] = useState<Department | null>(presetDepartment);
  const types = useMemo(() => (department ? getRequestTypesForDepartment(department) : []), [department]);
  const [requestTypeId, setRequestTypeId] = useState<string>("");
  const requestType: RequestTypeDef | null = useMemo(() => types.find((t) => t.id === requestTypeId) ?? null, [types, requestTypeId]);

  const [deadline, setDeadline] = useState<string>("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [values, setValues] = useState<Record<string, string>>({});
  const [attachmentName, setAttachmentName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  function next() {
    setError(null);
    if (step === 1) {
      if (!department) return setError("Please choose a department.");
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!requestType) return setError("Please choose a request type.");
      setStep(3);
      return;
    }
    if (step === 3) {
      if (!requestType) return setError("Please choose a request type.");
      const requiredMissing = requestType.fields.filter((f) => f.required).filter((f) => !String(values[f.key] ?? "").trim());
      if (!deadline) requiredMissing.push({ key: "deadline", label: "Deadline", type: "DATE" } as any);
      if (requiredMissing.length) return setError(`Please complete required fields: ${requiredMissing.map((f) => f.label).join(", ")}.`);
      setStep(4);
      return;
    }
    if (step === 4) {
      const ts = Date.now();
      const id = `r-${ts}`;
      const requestNumber = `RF-${String(1000 + (ts % 9000)).padStart(4, "0")}`;
      actions.addRequest({
        id,
        requestNumber,
        title: values.title || requestType?.name || "New Request",
        department: department ?? "HR",
        requestType: requestType?.name ?? "Request",
        status: "SUBMITTED",
        progress: 0,
        deadline,
        actionNeeded: "Manager review",
      });
      setCreatedId(id);
      setStep(5);
      return;
    }
  }

  function back() {
    setError(null);
    if (step === 1) return;
    setStep((step - 1) as any);
  }

  return (
    <AppShell title="Create Request">
      <PageHeader title="Create Request" description="Create a structured request for HR or Marketing." />
      <Card>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-brand-dark/10 bg-brand-primary/5 p-3">
            <p className="text-sm font-semibold text-brand-dark">
              Step {step} of 5 <span className="font-normal text-slate-600">• Local-only prototype flow</span>
            </p>
            <div className="mt-2 h-2 w-full rounded-full bg-white/70">
              <div className="h-2 rounded-full bg-brand-primary" style={{ width: `${step === 5 ? 100 : (step - 1) * 25}%` }} aria-hidden />
            </div>
          </div>

          {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

          {step === 1 ? (
            <div className="rounded-md border border-brand-dark/10 bg-white p-4">
              <p className="font-semibold text-brand-dark">Choose Department</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Button variant={department === "Marketing" ? "primary" : "outline"} onClick={() => setDepartment("Marketing")}>
                  Marketing
                </Button>
                <Button variant={department === "HR" ? "primary" : "outline"} onClick={() => setDepartment("HR")}>
                  HR
                </Button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="rounded-md border border-brand-dark/10 bg-white p-4">
              <p className="font-semibold text-brand-dark">Choose Request Type</p>
              <p className="mt-1 text-sm text-slate-600">Types are filtered by the selected department.</p>
              <div className="mt-3">
                <Select value={requestTypeId} onChange={(e) => setRequestTypeId(e.target.value)}>
                  <option value="">Select request type...</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          ) : null}

          {step === 3 && requestType ? (
            <div className="rounded-md border border-brand-dark/10 bg-white p-4">
              <p className="font-semibold text-brand-dark">Request Information</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Deadline *</label>
                  <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={priority} onChange={(e) => setPriority(e.target.value as any)}>
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </Select>
                </div>

                {requestType.fields.map((f) => {
                  const v = values[f.key] ?? "";
                  if (f.type === "LONG_TEXT") {
                    return (
                      <div key={f.key} className="md:col-span-2">
                        <label className="text-sm font-medium">
                          {f.label} {f.required ? "*" : ""}
                        </label>
                        <Textarea value={v} placeholder={f.placeholder} onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))} />
                      </div>
                    );
                  }
                  if (f.type === "DROPDOWN") {
                    return (
                      <div key={f.key}>
                        <label className="text-sm font-medium">
                          {f.label} {f.required ? "*" : ""}
                        </label>
                        <Select value={v} onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}>
                          <option value="">Select...</option>
                          {(f.options ?? []).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </Select>
                      </div>
                    );
                  }
                  if (f.type === "DATE") {
                    return (
                      <div key={f.key}>
                        <label className="text-sm font-medium">
                          {f.label} {f.required ? "*" : ""}
                        </label>
                        <Input type="date" value={v} onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))} />
                      </div>
                    );
                  }
                  if (f.type === "FILE") {
                    return (
                      <div key={f.key}>
                        <label className="text-sm font-medium">{f.label}</label>
                        <Input
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            setAttachmentName(file?.name ?? "");
                          }}
                        />
                        {attachmentName ? <p className="mt-1 text-xs text-slate-600">Selected: {attachmentName}</p> : null}
                      </div>
                    );
                  }
                  return (
                    <div key={f.key}>
                      <label className="text-sm font-medium">
                        {f.label} {f.required ? "*" : ""}
                      </label>
                      <Input value={v} placeholder={f.placeholder} onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))} />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {step === 4 && requestType ? (
            <div className="rounded-md border border-brand-dark/10 bg-white p-4">
              <p className="font-semibold text-brand-dark">Review & Submit</p>
              <Alert title="Review Summary">
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Department:</span> {department}
                  </p>
                  <p>
                    <span className="font-medium">Request type:</span> {requestType.name}
                  </p>
                  <p>
                    <span className="font-medium">Deadline:</span> {deadline}
                  </p>
                  <p>
                    <span className="font-medium">Priority:</span> {priority}
                  </p>
                  {Object.entries(values).map(([k, v]) => (
                    <p key={k}>
                      <span className="font-medium">{k}:</span> {v || "-"}
                    </p>
                  ))}
                  {attachmentName ? (
                    <p>
                      <span className="font-medium">Attachment:</span> {attachmentName}
                    </p>
                  ) : null}
                </div>
              </Alert>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="rounded-md border border-brand-lime/50 bg-brand-lime/30 p-4">
              <p className="text-lg font-semibold text-brand-dark">Request submitted (mock)</p>
              <p className="mt-1 text-sm text-brand-dark/80">This is local-only state and resets on refresh.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => router.push("/requests")}>View My Requests</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreatedId(null);
                    setStep(1);
                    setDepartment(presetDepartment);
                    setRequestTypeId("");
                    setDeadline("");
                    setPriority("MEDIUM");
                    setValues({});
                    setAttachmentName("");
                  }}
                >
                  Create Another Request
                </Button>
                {createdId ? (
                  <Button variant="outline" onClick={() => router.push(`/requests/${createdId}`)}>
                    View Details
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={back} disabled={step === 1 || step === 5}>
              Back
            </Button>
            <Button onClick={next} disabled={step === 5}>
              {step === 4 ? "Submit" : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}

