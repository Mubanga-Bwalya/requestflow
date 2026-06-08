import Link from "next/link";
import { buttonClassName, type ButtonSize, type ButtonVariant } from "@/components/ui/button";

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

export function ButtonLink({
  href,
  children,
  className,
  size = "default",
  variant = "primary",
}: Props) {
  return (
    <Link href={href} className={buttonClassName({ variant, size, className })}>
      {children}
    </Link>
  );
}
