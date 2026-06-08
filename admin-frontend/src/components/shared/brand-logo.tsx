import { cn } from "@/lib/utils";

type Props = {
  subtitle?: string;
  variant?: "sidebar" | "header";
  className?: string;
};

const LOGO_ON_GREEN = "/brand/zamtel-logo-on-green.svg";
const LOGO_ON_WHITE = "/brand/zamtel-logo-on-white.svg";

export function BrandLogo({ subtitle = "Admin Portal", variant = "sidebar", className }: Props) {
  const isSidebar = variant === "sidebar";
  const logoSrc = isSidebar ? LOGO_ON_GREEN : LOGO_ON_WHITE;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img
        src={logoSrc}
        alt="Zamtel"
        width={isSidebar ? 44 : 40}
        height={isSidebar ? 44 : 40}
        className={cn("shrink-0 object-contain", isSidebar ? "h-11 w-11" : "h-10 w-10")}
      />
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-bold leading-tight", isSidebar ? "text-white" : "text-brand-dark")}>
          RequestFlow
        </p>
        <p className={cn("text-[11px] leading-snug", isSidebar ? "text-white/75" : "text-zamtel-muted")}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}
