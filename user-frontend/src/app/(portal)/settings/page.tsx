"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
  const { state, actions } = useAuth();
  const [saved, setSaved] = useState(false);

  function onAvatarChange(file: File | undefined) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    actions.setAvatar(url);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const initials = state.profile.displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <PageHeader title="Settings" description="Profile photo and accessibility preferences (saved locally in your browser)." />

      {saved ? (
        <div className="mb-4 rounded-md border border-brand-lime/50 bg-brand-lime/30 p-3 text-sm text-brand-dark">Changes saved.</div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4">
            <p className="font-semibold text-brand-dark">Profile</p>
            <p className="text-sm text-slate-600">
              Your name and role are managed by your organisation. Contact IT or HR to update company account details.
            </p>

            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-brand-primary/30 bg-brand-primary/10 text-lg font-semibold text-brand-dark">
                {state.profile.avatarDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={state.profile.avatarDataUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Profile photo (local only)</label>
                <Input type="file" accept="image/*" className="mt-1" onChange={(e) => onAvatarChange(e.target.files?.[0])} />
                {state.profile.avatarDataUrl ? (
                  <Button type="button" size="compact" className="mt-2" onClick={() => actions.setAvatar(undefined)}>
                    Remove photo
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Display name</label>
                <Input value={state.profile.displayName} disabled className="mt-1 bg-slate-50" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Role</label>
                <Input value={state.profile.role} disabled className="mt-1 bg-slate-50" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">Work email</label>
                <Input value={state.profile.email ?? state.auth.email ?? "—"} disabled className="mt-1 bg-slate-50" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <p className="font-semibold text-brand-dark">Accessibility</p>
            <p className="text-sm text-slate-600">Adjust how RequestFlow looks during this session.</p>

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
