import { AppShellLayout } from "@/components/layout/app-shell";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <AppShellLayout>{children}</AppShellLayout>;
}
