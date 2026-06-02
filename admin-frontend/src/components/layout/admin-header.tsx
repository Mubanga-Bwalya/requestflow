export function AdminHeader({title}:{title:string}){
  return (
    <header className="relative flex items-center justify-between border-b border-brand-dark/10 bg-white/80 px-6 py-4 backdrop-blur">
      <div className="absolute left-0 top-0 h-full w-1 bg-brand-primary" aria-hidden />
      <div className="pl-2">
        <p className="text-lg font-semibold text-brand-dark">{title}</p>
        <p className="text-xs text-slate-600">RequestFlow Admin</p>
      </div>
      <div className="text-right text-sm">
        <p className="font-medium text-slate-900">System Admin</p>
        <p className="text-xs text-slate-600">Admin</p>
      </div>
    </header>
  );
}
