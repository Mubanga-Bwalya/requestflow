/** Instant shell feedback while a portal page compiles or loads (dev-friendly). */
export default function PortalLoading() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading page">
      <div className="space-y-2">
        <div className="h-2 w-14 rounded-full bg-brand-primary/20" />
        <div className="h-7 w-56 max-w-full rounded bg-brand-primary/10" />
        <div className="h-4 w-80 max-w-full rounded bg-brand-primary/5" />
      </div>
      <div className="h-52 rounded-card border border-brand-dark/10 bg-white shadow-card" />
    </div>
  );
}
