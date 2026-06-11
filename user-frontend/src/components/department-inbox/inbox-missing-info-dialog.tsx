"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { apiErrorMessage } from "@/lib/api-error";
import { fetchRequestDetail, requestMissingInformation } from "@/lib/requests-api";
import { fetchTemplateFields } from "@/lib/templates-api";
import type { InboxRequestRef } from "@/lib/inbox-request-ref";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: InboxRequestRef | null;
  userId: string | undefined;
  onReload: () => Promise<void>;
};

export function InboxMissingInfoDialog({ open, onOpenChange, selected, userId, onReload }: Props) {
  const [missingFieldKeys, setMissingFieldKeys] = useState<string[]>([]);
  const [templateFieldOptions, setTemplateFieldOptions] = useState<{ key: string; label: string }[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open || !selected) {
      setTemplateFieldOptions([]);
      setInfoError(null);
      return;
    }
    let cancelled = false;
    setFieldsLoading(true);
    setMissingFieldKeys([]);
    setInfoError(null);
    (async () => {
      try {
        const detail = await fetchRequestDetail(selected.id);
        if (cancelled) return;
        if (detail.templateId) {
          const fields = await fetchTemplateFields(detail.templateId);
          if (!cancelled) {
            setTemplateFieldOptions(fields.map((f) => ({ key: f.key, label: f.label })));
          }
        } else if (!cancelled) {
          setTemplateFieldOptions(detail.fieldAnswers.map((a) => ({ key: a.fieldKey, label: a.label })));
        }
      } catch {
        if (!cancelled) {
          setTemplateFieldOptions([]);
          setInfoError("Could not load form fields for this request. Try again or contact support.");
        }
      } finally {
        if (!cancelled) setFieldsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, selected]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={selected ? `Ask ${selected.requestedBy ?? "the requester"} for more details` : "Ask for more details"}
      description="Select which parts of the form need answers. The request will pause until they respond."
    >
      {!selected ? (
        <p className="text-sm text-slate-600">No request selected.</p>
      ) : (
        <div className="space-y-4">
          {infoError ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{infoError}</p>
          ) : null}
          {fieldsLoading ? (
            <p className="text-sm text-slate-600">Loading template fields…</p>
          ) : templateFieldOptions.length === 0 ? (
            <p className="text-sm text-slate-600">No fields available for this request type.</p>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-2">
            {templateFieldOptions.map((m) => {
              const checked = missingFieldKeys.includes(m.key);
              return (
                <button
                  key={m.key}
                  type="button"
                  className={
                    checked
                      ? "rf-clickable-tile border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 hover:border-amber-400"
                      : "rf-clickable-tile border-brand-dark/15 bg-white px-3 py-2 text-sm text-zamtel-text hover:bg-amber-50/80"
                  }
                  onClick={() => setMissingFieldKeys((p) => (checked ? p.filter((x) => x !== m.key) : [...p, m.key]))}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
          <div className="rf-dialog-footer mt-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="warning"
              loading={sending}
              disabled={sending || fieldsLoading}
              onClick={async () => {
                if (sending || !userId || !selected) return;
                if (!missingFieldKeys.length) {
                  setInfoError("Select at least one field.");
                  return;
                }
                setInfoError(null);
                setSending(true);
                const labelByKey = new Map(templateFieldOptions.map((f) => [f.key, f.label]));
                try {
                  await requestMissingInformation(
                    selected.id,
                    missingFieldKeys.map((key) => ({
                      fieldKey: key,
                      reasonLabel: `Please provide: ${labelByKey.get(key) ?? key}`,
                    })),
                  );
                  await onReload();
                  onOpenChange(false);
                } catch (e) {
                  setInfoError(apiErrorMessage(e, "Could not send the information request."));
                } finally {
                  setSending(false);
                }
              }}
            >
              Send questions to requester
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
