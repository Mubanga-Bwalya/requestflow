import { api } from "@/lib/api";
import { type PaginatedResponse } from "@/lib/pagination";
import { LIST_PAGE_SIZE } from "@/lib/page-size";
import { cachedApi, invalidateApiCache } from "@/lib/query-cache";

export type ApiTemplateSummary = {
  id: string;
  name: string;
  departmentName: string;
  fieldCount: number;
  isActive: boolean;
};

export type ApiTemplateField = {
  id: string;
  label: string;
  fieldKey: string;
  fieldType: string;
  isRequired: boolean;
  displayOrder: number;
  isActive: boolean;
  helpText?: string | null;
  options?: unknown;
};

export type ApiTemplateDetail = ApiTemplateSummary & {
  departmentId: string;
  description: string | null;
  fields: ApiTemplateField[];
};

export async function fetchTemplates(params?: {
  activeOnly?: boolean;
  isActive?: boolean;
  departmentId?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<ApiTemplateSummary>> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? LIST_PAGE_SIZE;
  const tabKey =
    params?.isActive === true ? "active" : params?.isActive === false ? "inactive" : params?.activeOnly ? "activeOnly" : "all";
  const key = `templates:page:${page}:${limit}:${tabKey}:${params?.departmentId ?? "ALL"}`;
  return cachedApi(key, async () => {
    const { data } = await api.get<PaginatedResponse<ApiTemplateSummary>>("/request-templates", {
      params: {
        page,
        limit,
        ...(params?.isActive !== undefined
          ? { isActive: params.isActive, activeOnly: false }
          : { activeOnly: params?.activeOnly ?? false }),
        ...(params?.departmentId && params.departmentId !== "ALL" ? { departmentId: params.departmentId } : {}),
      },
    });
    return data;
  }, 15_000);
}

export async function createTemplate(payload: {
  departmentId: string;
  name: string;
  description?: string;
  isActive?: boolean;
}): Promise<ApiTemplateDetail> {
  const { data } = await api.post<ApiTemplateDetail>("/request-templates", payload);
  invalidateTemplateCaches();
  return data;
}

export async function fetchTemplateDetail(id: string): Promise<ApiTemplateDetail> {
  return cachedApi(`template:${id}`, async () => {
    const { data } = await api.get<ApiTemplateDetail>(`/request-templates/${id}`, {
      params: { activeOnly: false },
    });
    return data;
  });
}

function invalidateTemplateCaches(templateId?: string) {
  invalidateApiCache("templates:");
  if (templateId) invalidateApiCache(`template:${templateId}`);
}

export async function updateTemplateActive(id: string, isActive: boolean): Promise<ApiTemplateDetail> {
  const { data } = await api.patch<ApiTemplateDetail>(`/request-templates/${id}`, { isActive });
  invalidateTemplateCaches(id);
  return data;
}

export async function createTemplateField(
  templateId: string,
  payload: {
    label: string;
    fieldType: string;
    isRequired?: boolean;
    helpText?: string;
    fieldKey?: string;
    options?: unknown;
  },
): Promise<ApiTemplateDetail> {
  const { data } = await api.post<ApiTemplateDetail>(`/request-templates/${templateId}/fields`, payload);
  invalidateTemplateCaches(templateId);
  return data;
}

export async function updateTemplateField(
  templateId: string,
  fieldId: string,
  payload: Partial<{
    label: string;
    fieldType: string;
    isRequired: boolean;
    helpText?: string;
    options?: unknown;
  }>,
): Promise<ApiTemplateDetail> {
  const { data } = await api.patch<ApiTemplateDetail>(
    `/request-templates/${templateId}/fields/${fieldId}`,
    payload,
  );
  invalidateTemplateCaches(templateId);
  return data;
}

export async function deactivateTemplateField(templateId: string, fieldId: string): Promise<ApiTemplateDetail> {
  const { data } = await api.patch<ApiTemplateDetail>(
    `/request-templates/${templateId}/fields/${fieldId}/deactivate`,
    {},
  );
  invalidateTemplateCaches(templateId);
  return data;
}
