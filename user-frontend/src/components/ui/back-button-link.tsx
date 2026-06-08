import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { buttonClassName, type ButtonSize, type ButtonVariant } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

/** Outline back navigation — ChevronLeft icon aligned like other app buttons. */
export function BackButtonLink({
  href,
  children,
  className,
  size = "default",
  variant = "outline",
}: Props) {
  return (
    <Link href={href} className={buttonClassName({ variant, size, className: cn("gap-2", className) })}>
      <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </Link>
  );
}
