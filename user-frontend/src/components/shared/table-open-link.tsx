import { ButtonLink } from "@/components/ui/button-link";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  className?: string;
};

export function TableOpenLink({ href, className }: Props) {
  return (
    <ButtonLink
      href={href}
      size="compact"
      variant="outline"
      className={cn("min-h-11 w-full justify-center sm:min-h-9 sm:w-auto sm:min-w-[4.5rem]", className)}
    >
      Open
    </ButtonLink>
  );
}
