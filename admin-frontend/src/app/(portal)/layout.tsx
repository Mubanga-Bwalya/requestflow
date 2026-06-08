import { AdminShellLayout } from "@/components/layout/admin-shell";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <AdminShellLayout>{children}</AdminShellLayout>;
}
