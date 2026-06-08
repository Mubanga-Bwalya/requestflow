"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { fieldLabelClassName } from "@/components/ui/field-control";
import { apiErrorMessage } from "@/lib/api-error";
import { peekApiCache } from "@/lib/query-cache";
import { fetchSettings, updateSettings, type SystemSettings } from "@/lib/settings-api";
import { useAuth } from "@/lib/auth-context";

export default function Page() {
  const { state, actions } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<SystemSettings>({
    id: "default",
    systemName: "RequestFlow",
    defaultPriority: "MEDIUM",
    allowUploads: true,
    notifyOnStatusChange: true,
    fileUploadLimitMb: 25,
  });

  useEffect(() => {
    const cached = peekApiCache<SystemSettings>("settings:system");
    if (cached) {
      setForm(cached);
      setLoading(false);
    }
    fetchSettings()
      .then(setForm)
      .catch(() => {
        if (!cached) setError("Could not load settings. Run database/004_system_settings.sql if needed.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setError(null);
    setSaving(true);
    try {
      const updated = await updateSettings({
        systemName: form.systemName,
        defaultPriority: form.defaultPriority,
        allowUploads: form.allowUploads,
        notifyOnStatusChange: form.notifyOnStatusChange,
        fileUploadLimitMb: form.fileUploadLimitMb,
      });
      setForm(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(apiErrorMessage(e, "Failed to save settings. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="System Settings" description="Global defaults stored in PostgreSQL." />
      {saved ? (
        <div className="mb-4 rounded-md border border-brand-lime/50 bg-brand-lime/30 p-3 text-sm text-brand-dark">Settings saved.</div>
      ) : null}
      {error ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {loading ? (
            <p className="text-sm text-muted md:col-span-2">Loading settings…</p>
          ) : (
            <>
              <div>
                <label className={fieldLabelClassName}>System Name</label>
                <Input className="mt-1" value={form.systemName} onChange={(e) => setForm((p) => ({ ...p, systemName: e.target.value }))} />
              </div>
              <div>
                <label className={fieldLabelClassName}>Default Priority</label>
                <Select
                  className="mt-1"
                  value={form.defaultPriority}
                  onChange={(e) => setForm((p) => ({ ...p, defaultPriority: e.target.value as SystemSettings["defaultPriority"] }))}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </Select>
              </div>
              <div>
                <label className={fieldLabelClassName}>File Upload Limit (MB)</label>
                <Input
                  className="mt-1"
                  type="number"
                  min={1}
                  value={String(form.fileUploadLimitMb)}
                  onChange={(e) => setForm((p) => ({ ...p, fileUploadLimitMb: Number(e.target.value || 25) }))}
                />
              </div>
              <div>
                <label className={fieldLabelClassName}>Allow uploads</label>
                <Select
                  className="mt-1"
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
                  Notify users on status change
                </label>
              </div>
              <div className="md:col-span-2">
                <Button disabled={saving} onClick={save}>
                  {saving ? "Saving…" : "Save Settings"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <p className="font-semibold text-brand-dark">Accessibility</p>
          <p className="text-sm text-zamtel-muted">Adjust how the admin portal looks during this session.</p>

          <label className="rf-settings-row">
            <span className="text-sm text-brand-dark">Larger text</span>
            <input
              type="checkbox"
              checked={state.accessibility.largeText}
              onChange={(e) => actions.updateAccessibility({ largeText: e.target.checked })}
            />
          </label>
          <label className="rf-settings-row">
            <span className="text-sm text-brand-dark">High contrast</span>
            <input
              type="checkbox"
              checked={state.accessibility.highContrast}
              onChange={(e) => actions.updateAccessibility({ highContrast: e.target.checked })}
            />
          </label>
          <label className="rf-settings-row">
            <span className="text-sm text-brand-dark">Reduce motion</span>
            <input
              type="checkbox"
              checked={state.accessibility.reduceMotion}
              onChange={(e) => actions.updateAccessibility({ reduceMotion: e.target.checked })}
            />
          </label>
        </CardContent>
      </Card>
      </div>
    </>
  );
}
