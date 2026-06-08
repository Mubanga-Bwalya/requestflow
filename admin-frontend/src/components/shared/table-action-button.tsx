import { ButtonHTMLAttributes } from "react";
import { buttonClassName } from "@/components/ui/button";

/** Compact outline button for in-table actions (Manage, Update, etc.). */
export function TableActionButton({ className, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={buttonClassName({ variant: "outline", size: "compact", className })} {...props} />
  );
}
