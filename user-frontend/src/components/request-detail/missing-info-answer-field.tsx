"use client";

import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  fieldKey: string;
  label: string;
  fieldType?: string;
  value: string;
  onChange: (value: string) => void;
};

export function MissingInfoAnswerField({ fieldKey, label, fieldType, value, onChange }: Props) {
  const inputId = `missing-${fieldKey}`;
  const type = (fieldType ?? "SHORT_TEXT").toUpperCase();

  const labelEl = (
    <label htmlFor={inputId} className="text-sm font-medium">
      {label}
    </label>
  );

  if (type === "LONG_TEXT") {
    return (
      <div className="space-y-2">
        {labelEl}
        <Textarea
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter: ${label}`}
        />
      </div>
    );
  }

  if (type === "DATE") {
    return (
      <div className="space-y-2">
        {labelEl}
        <DateInput id={inputId} value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }

  if (type === "NUMBER") {
    return (
      <div className="space-y-2">
        {labelEl}
        <Input
          id={inputId}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter: ${label}`}
        />
      </div>
    );
  }

  if (type === "EMAIL") {
    return (
      <div className="space-y-2">
        {labelEl}
        <Input
          id={inputId}
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter: ${label}`}
        />
      </div>
    );
  }

  if (type === "CHECKBOX") {
    return (
      <div className="flex items-center gap-2">
        <input
          id={inputId}
          type="checkbox"
          checked={value === "true"}
          onChange={(e) => onChange(e.target.checked ? "true" : "")}
        />
        {labelEl}
      </div>
    );
  }

  if (type === "DROPDOWN") {
    return (
      <div className="space-y-2">
        {labelEl}
        <Input
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter: ${label}`}
        />
        <p className="text-xs text-slate-500">Enter the option value for this field.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {labelEl}
      <Input
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter: ${label}`}
      />
    </div>
  );
}
