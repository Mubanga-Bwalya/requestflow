import { api } from "@/lib/api";
import { cachedApi } from "@/lib/query-cache";

export type SystemSettings = {
  id: string;
  systemName: string;
  defaultPriority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  allowUploads: boolean;
  notifyOnStatusChange: boolean;
  fileUploadLimitMb: number;
};

export async function fetchSettings(): Promise<SystemSettings> {
  return cachedApi("settings:system", async () => {
    const { data } = await api.get<SystemSettings>("/system-settings");
    return data;
  });
}
