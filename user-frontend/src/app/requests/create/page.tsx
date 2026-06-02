import { CreateRequestClient } from "./create-request-client";
import type { Department } from "@/lib/request-templates";

export default function Page({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const raw = typeof searchParams?.department === "string" ? searchParams.department : null;
  const preset: Department | null = raw === "HR" || raw === "Marketing" ? raw : null;
  return <CreateRequestClient presetDepartment={preset} />;
}
