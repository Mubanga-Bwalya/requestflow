import { api } from "@/lib/api";
import { cachedApi } from "@/lib/query-cache";

export type ApiRole = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
};

export async function fetchRoles(options?: { assignableOnly?: boolean }): Promise<ApiRole[]> {
  const assignableOnly = options?.assignableOnly ?? false;
  const cacheKey = assignableOnly ? "roles:assignable" : "roles:all";
  return cachedApi(cacheKey, async () => {
    const { data } = await api.get<ApiRole[]>("/roles", {
      params: assignableOnly ? { assignableOnly: true } : undefined,
    });
    return data;
  });
}
