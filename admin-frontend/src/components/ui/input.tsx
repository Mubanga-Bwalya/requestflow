import { InputHTMLAttributes } from "react"; export function Input(props: InputHTMLAttributes<HTMLInputElement>){ return <input {...props} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-primary"/>; }

