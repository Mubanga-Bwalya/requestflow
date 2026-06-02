"use client";

import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocalStore } from "@/lib/local-store";

export function AdminDashboardClient() {
  const { state } = useLocalStore();

  return (
    <AdminShell title="Admin Dashboard">
      <PageHeader
        title="Admin Dashboard"
        description="System-level overview of RequestFlow configuration and request health."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/users">
              <Button variant="outline">Users</Button>
            </Link>
            <Link href="/templates">
              <Button variant="outline">Templates</Button>
            </Link>
          </div>
        }
      />
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {state.dashboard.map((item) => (
            <Card key={item.label} className="relative overflow-hidden">
              <div className="absolute left-0 top-0 h-1 w-full bg-brand-primary" aria-hidden />
              <CardContent>
                <p className="text-sm text-slate-600">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-brand-dark">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent>
            <p className="mb-3 text-sm font-semibold text-brand-dark">Quick Links</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/users">
                <Button>Manage Users</Button>
              </Link>
              <Link href="/departments">
                <Button variant="outline">Departments</Button>
              </Link>
              <Link href="/roles">
                <Button variant="outline">Roles</Button>
              </Link>
              <Link href="/templates">
                <Button variant="outline">Templates</Button>
              </Link>
              <Link href="/reports">
                <Button variant="outline">Reports</Button>
              </Link>
              <Link href="/settings">
                <Button variant="outline">Settings</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="mb-2 text-sm font-semibold text-brand-dark">Recent Activity (mock)</p>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>Template &quot;Graphic Design Request&quot; active — Marketing</li>
              <li>User &quot;Martha N.&quot; updated — HR Manager</li>
              <li>Department HR manager set to Martha N.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
