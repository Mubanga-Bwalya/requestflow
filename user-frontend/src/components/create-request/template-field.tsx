"use client";

import { DateInput } from "@/components/ui/date-input";
import { fieldLabelClassName } from "@/components/ui/field-control";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { RequestFieldDef } from "@/lib/request-templates";

type Props = {
  field: RequestFieldDef;
  value: string;
  error?: string;
  allowUploads: boolean;
  fileUploadLimitMb: number;
  attachmentName: string;
  onChange: (key: string, value: string) => void;
  onAttachmentName: (name: string) => void;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

function FieldHelp({ text }: { text?: string }) {
  if (!text) return null;
  return <p className="mt-1 text-xs text-slate-500">{text}</p>;
}

export function TemplateField({
  field: f,
  value: v,
  error,
  allowUploads,
  fileUploadLimitMb,
  attachmentName,
  onChange,
  onAttachmentName,
}: Props) {
  if (f.type === "LONG_TEXT") {
    return (
      <div key={f.key} className="md:col-span-2">
        <label className="text-sm font-medium">
          {f.label} {f.required ? "*" : ""}
        </label>
        <Textarea value={v} placeholder={f.placeholder} onChange={(e) => onChange(f.key, e.target.value)} />
        <FieldError message={error} />
      </div>
    );
  }
  if (f.type === "DROPDOWN") {
    return (
      <div key={f.key}>
        <label className={fieldLabelClassName}>
          {f.label} {f.required ? "*" : ""}
        </label>
        <div className="mt-1">
          <Select value={v} onChange={(e) => onChange(f.key, e.target.value)}>
            <option value="">Select...</option>
            {(f.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
        </div>
        <FieldError message={error} />
      </div>
    );
  }
  if (f.type === "MULTI_SELECT") {
    return (
      <div key={f.key} className="md:col-span-2">
        <label className="text-sm font-medium">
          {f.label} {f.required ? "*" : ""}
        </label>
        <Select
          multiple
          className="min-h-[88px]"
          value={v ? v.split("|||") : []}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
            onChange(f.key, selected.join("|||"));
          }}
        >
          {(f.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </Select>
        <p className="mt-1 text-xs text-slate-500">Hold Ctrl (Windows) to select multiple.</p>
        <FieldError message={error} />
      </div>
    );
  }
  if (f.type === "DATE") {
    return (
      <div key={f.key}>
        <label className="text-sm font-medium">
          {f.label} {f.required ? "*" : ""}
        </label>
        <div className="mt-1">
          <DateInput value={v} onChange={(e) => onChange(f.key, e.target.value)} />
        </div>
        <FieldHelp text={f.placeholder ?? "Use the date this request should be completed or actioned by."} />
        <FieldError message={error} />
      </div>
    );
  }
  if (f.type === "FILE") {
    if (!allowUploads) {
      return (
        <div key={f.key} className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-medium text-slate-700">{f.label}</p>
          <p className="mt-1 text-xs text-slate-500">File uploads are disabled by system settings.</p>
        </div>
      );
    }
    return (
      <div key={f.key}>
        <label className="text-sm font-medium">
          {f.label} {f.required ? "*" : ""}
        </label>
        <p className="text-xs text-slate-500">Filename only (MVP). Max {fileUploadLimitMb} MB per admin settings.</p>
        <Input
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            onAttachmentName(file?.name ?? "");
            onChange(f.key, file?.name ?? "");
          }}
        />
        {attachmentName ? <p className="mt-1 text-xs text-slate-600">Selected: {attachmentName}</p> : null}
        <FieldError message={error} />
      </div>
    );
  }
  if (f.type === "NUMBER") {
    return (
      <div key={f.key}>
        <label className="text-sm font-medium">
          {f.label} {f.required ? "*" : ""}
        </label>
        <Input type="number" value={v} placeholder={f.placeholder} onChange={(e) => onChange(f.key, e.target.value)} />
        <FieldError message={error} />
      </div>
    );
  }
  if (f.type === "CHECKBOX") {
    return (
      <div key={f.key} className="flex items-center gap-2 pt-6">
        <input
          type="checkbox"
          checked={v === "true"}
          onChange={(e) => onChange(f.key, e.target.checked ? "true" : "")}
        />
        <label className="text-sm font-medium">{f.label}</label>
        <FieldError message={error} />
      </div>
    );
  }
  if (f.type === "EMAIL") {
    return (
      <div key={f.key}>
        <label className="text-sm font-medium">
          {f.label} {f.required ? "*" : ""}
        </label>
        <Input type="email" value={v} onChange={(e) => onChange(f.key, e.target.value)} />
        <FieldHelp text={f.placeholder} />
        <FieldError message={error} />
      </div>
    );
  }
  return (
    <div key={f.key}>
      <label className="text-sm font-medium">
        {f.label} {f.required ? "*" : ""}
      </label>
      <Input value={v} placeholder={f.placeholder} onChange={(e) => onChange(f.key, e.target.value)} />
      <FieldError message={error} />
    </div>
  );
}
