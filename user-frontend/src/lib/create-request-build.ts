import type { RequestTypeDef } from "@/lib/request-templates";

export type CreateRequestTemplateOption = {
  id: string;
  name: string;
  department: string;
};

export function buildCreateRequestFieldAnswers(
  requestTypeDef: RequestTypeDef,
  trimmed: Record<string, string>,
) {
  return requestTypeDef.fields.map((f) => {
    const raw = trimmed[f.key] ?? "";
    if (f.type === "MULTI_SELECT") {
      return { fieldKey: f.key, answerJson: raw ? raw.split("|||") : [] };
    }
    if (f.type === "CHECKBOX") {
      return { fieldKey: f.key, answerText: raw === "true" ? "Yes" : "No" };
    }
    if (f.type === "FILE") {
      return {
        fieldKey: f.key,
        answerText: raw || undefined,
        fileUrl: raw || undefined,
      };
    }
    return { fieldKey: f.key, answerText: raw || undefined };
  });
}
