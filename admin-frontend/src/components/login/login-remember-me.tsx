"use client";

import { useState } from "react";

export function LoginRememberMe() {
  const [remember, setRemember] = useState(false);

  return (
    <label className="rf-settings-row-inline text-sm font-medium text-brand-dark">
      <input
        type="checkbox"
        checked={remember}
        onChange={(e) => setRemember(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-2 focus:ring-brand-primary/40"
      />
      Remember me
    </label>
  );
}
