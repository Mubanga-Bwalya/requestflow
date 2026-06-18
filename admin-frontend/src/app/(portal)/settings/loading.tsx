import { AdminSettingsSkeleton } from "@/components/shared/skeleton";
import { PageHeader } from "@/components/shared/page-header";

export default function SettingsLoading() {
  return (
    <>
      <PageHeader title="System Settings" description="Global defaults stored in PostgreSQL." />
      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <div className="rounded-card border border-zamtel-border bg-surface p-5 shadow-card md:p-6">
          <AdminSettingsSkeleton />
        </div>
      </div>
    </>
  );
}
