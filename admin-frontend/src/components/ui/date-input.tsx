import { Calendar } from "lucide-react";
import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { fieldControlClassName } from "@/components/ui/field-control";

export function DateInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <input
        type="date"
        {...props}
        className={cn(fieldControlClassName, "rf-date-input py-0 pl-4 pr-10", className)}
      />
      <Calendar
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-primary"
        aria-hidden
      />
    </div>
  );
}
