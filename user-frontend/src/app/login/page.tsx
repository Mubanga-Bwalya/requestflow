"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocalStore } from "@/lib/local-store";

export default function Page() {
  const router = useRouter();
  const { actions } = useLocalStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => email.trim().length > 3 && password.trim().length > 0, [email, password]);

  function onLogin() {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    actions.login(email.trim());
    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-primary/5 p-6">
      <Card className="w-full max-w-md overflow-hidden">
        <div className="border-b border-brand-dark/10 bg-brand-primary/5 p-6">
          <BrandLogo variant="header" />
        </div>

        <CardContent className="space-y-4 p-6">
          <div>
            <h1 className="text-xl font-semibold text-brand-dark">User Login</h1>
            <p className="text-sm text-slate-600">Sign in to submit requests and track progress.</p>
          </div>

          {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input placeholder="name@zamtel.co.zm" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input placeholder="Enter password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button className="w-full" disabled={!canSubmit} onClick={onLogin}>
            Login
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
