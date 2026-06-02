"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocalStore } from "@/lib/local-store";

export default function AccountPage() {
  const router = useRouter();
  const { state, actions } = useLocalStore();
  const [saved, setSaved] = useState(false);

  function onAvatarChange(file: File | undefined) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    actions.setAvatar(url);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function logout() {
    actions.logout();
    router.push("/login");
  }

  const initials = state.profile.displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <AppShell title="Account">
      <PageHeader title="Account" description="Manage your profile image, accessibility preferences, and session." />

      {saved ? (
        <div className="mb-4 rounded-md border border-brand-lime/50 bg-brand-lime/30 p-3 text-sm text-brand-dark">Changes saved locally.</div>
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
                  <button type="button" className="mt-2 text-xs text-brand-primary hover:underline" onClick={() => actions.setAvatar(undefined)}>
                    Remove photo
                  </button>
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
            <p className="text-sm text-slate-600">Adjust how RequestFlow looks during this session (saved locally in your browser).</p>

            <label className="flex items-center justify-between gap-3 rounded-md border border-brand-dark/10 p-3">
              <span className="text-sm text-slate-800">Larger text</span>
              <input
                type="checkbox"
                checked={state.accessibility.largeText}
                onChange={(e) => actions.updateAccessibility({ largeText: e.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-md border border-brand-dark/10 p-3">
              <span className="text-sm text-slate-800">High contrast</span>
              <input
                type="checkbox"
                checked={state.accessibility.highContrast}
                onChange={(e) => actions.updateAccessibility({ highContrast: e.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-md border border-brand-dark/10 p-3">
              <span className="text-sm text-slate-800">Reduce motion</span>
              <input
                type="checkbox"
                checked={state.accessibility.reduceMotion}
                onChange={(e) => actions.updateAccessibility({ reduceMotion: e.target.checked })}
              />
            </label>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-brand-dark">Session</p>
              <p className="text-sm text-slate-600">Sign out of RequestFlow on this device.</p>
            </div>
            <Button variant="destructive" onClick={logout}>
              Log out
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
