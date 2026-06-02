import { SelectHTMLAttributes } from "react"; export function Select(props: SelectHTMLAttributes<HTMLSelectElement>){ return <select {...props} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-primary"/>; }

