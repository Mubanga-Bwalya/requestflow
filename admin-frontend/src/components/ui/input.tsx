import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { fieldControlClassName } from "@/components/ui/field-control";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(fieldControlClassName, "px-4 py-3", props.type === "file" && "py-2", className)}
    />
  );
}
