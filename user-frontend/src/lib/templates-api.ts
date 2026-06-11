import { api } from "@/lib/api";
import { type PaginatedResponse } from "@/lib/pagination";
import type { Department, RequestFieldDef, RequestTypeDef } from "@/lib/request-templates";

type ApiField = {
  id: string;
  label: string;
  fieldKey: string;
  fieldType: string;
  isRequired: boolean;
  options: unknown;
  helpText: string | null;
  displayOrder: number;
};

type ApiTemplateSummary = {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  isActive: boolean;
  fieldCount: number;
};

type ApiTemplateDetail = ApiTemplateSummary & {
  description: string | null;
  fields: ApiField[];
};

function parseOptions(options: unknown): string[] | undefined {
  if (Array.isArray(options)) return options.map(String);
  if (typeof options === "string") {
    try {
      const parsed = JSON.parse(options) as unknown;
      return Array.isArray(parsed) ? parsed.map(String) : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function mapField(f: ApiField): RequestFieldDef {
  return {
    key: f.fieldKey,
    label: f.label,
    type: f.fieldType as RequestFieldDef["type"],
    required: f.isRequired,
    options: parseOptions(f.options),
    helpText: f.helpText ?? undefined,
  };
}

export async function fetchTemplatesForDepartment(department: Department): Promise<Pick<RequestTypeDef, "id" | "name" | "department">[]> {
  const { data } = await api.get<PaginatedResponse<ApiTemplateSummary>>("/request-templates", {
    params: { departmentName: department, activeOnly: true, page: 1, limit: 100 },
  });
  return data.items.map((t) => ({
    id: t.id,
    name: t.name,
    department,
  }));
}

type ApiFieldsResponse = { templateId: string; templateName: string; fields: ApiField[] };

export async function fetchTemplateFields(templateId: string): Promise<RequestFieldDef[]> {
  const { data } = await api.get<ApiFieldsResponse>(`/request-templates/${templateId}/fields`, {
    params: { activeOnly: true },
  });
  return data.fields.map(mapField);
}

export async function fetchTemplateDetail(templateId: string, department: Department): Promise<RequestTypeDef> {
  const { data } = await api.get<ApiTemplateDetail>(`/request-templates/${templateId}`);
  return {
    id: data.id,
    name: data.name,
    department,
    fields: data.fields.map(mapField),
  };
}
