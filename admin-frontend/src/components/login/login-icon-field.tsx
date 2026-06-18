"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import { fieldErrorClassName, loginFieldClassName } from "@/components/ui/field-control";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  label: string;
  icon: LucideIcon;
  type?: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  showPasswordToggle?: boolean;
  error?: string | null;
  required?: boolean;
};

export function LoginIconField({
  id,
  label,
  icon: Icon,
  type = "text",
  value,
  placeholder,
  onChange,
  autoComplete,
  showPasswordToggle = false,
  error,
  required,
}: Props) {
  const [visible, setVisible] = useState(false);
  const inputType = showPasswordToggle ? (visible ? "text" : "password") : type;
  const invalid = Boolean(error);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-bold text-brand-dark">
        {label}
        {required ? <span className="text-brand-magenta"> *</span> : null}
      </label>
      <div className="relative">
        <Icon
          className={cn(
            "pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2",
            invalid ? "text-red-500" : "text-zamtel-muted",
          )}
          aria-hidden
        />
        <input
          id={id}
          type={inputType}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${id}-error` : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            loginFieldClassName,
            "h-12 pl-11 text-sm",
            showPasswordToggle && "pr-11",
            invalid && "border-red-500 bg-red-50/40",
          )}
        />
        {showPasswordToggle ? (
          <button
            type="button"
            className="rf-clickable-icon absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-control text-zamtel-muted hover:text-brand-dark"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className={fieldErrorClassName} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
