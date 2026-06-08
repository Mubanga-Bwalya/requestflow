import { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { fieldControlClassName } from "@/components/ui/field-control";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        fieldControlClassName,
        "min-h-[110px] resize-y px-4 py-3",
        className,
      )}
    />
  );
}
