"use client";

import { useState } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useLocalStore } from "@/lib/local-store";

export default function Page() {
  const { state, actions } = useLocalStore();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState(state.settings);

  function save() {
    actions.updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <AdminShell title="System Settings">
      <PageHeader title="System Settings" description="Configure defaults and notification placeholders (local-only)." />
      {saved ? (
        <div className="mb-4 rounded-md border border-brand-lime/50 bg-brand-lime/30 p-3 text-sm text-brand-dark">Settings saved locally.</div>
      ) : null}
      <Card>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">System Name</label>
            <Input value={form.systemName} onChange={(e) => setForm((p) => ({ ...p, systemName: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium">Default Priority</label>
            <Select value={form.defaultPriority} onChange={(e) => setForm((p) => ({ ...p, defaultPriority: e.target.value as typeof form.defaultPriority }))}>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">File Upload Limit (placeholder)</label>
            <Input defaultValue="25MB" disabled />
          </div>
          <div>
            <label className="text-sm font-medium">Allow uploads</label>
            <Select
              value={form.allowUploads ? "yes" : "no"}
              onChange={(e) => setForm((p) => ({ ...p, allowUploads: e.target.value === "yes" }))}
            >
              <option value="yes">Enabled</option>
              <option value="no">Disabled</option>
            </Select>
          </div>
          <div className="md:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.notifyOnStatusChange}
                onChange={(e) => setForm((p) => ({ ...p, notifyOnStatusChange: e.target.checked }))}
              />
              Notify users on status changes (placeholder)
            </label>
          </div>
          <div className="md:col-span-2">
            <Button onClick={save}>Save Settings</Button>
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
