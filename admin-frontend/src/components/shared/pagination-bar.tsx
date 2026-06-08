import { Button } from "@/components/ui/button";

export function PaginationBar({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-brand-dark/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-center text-sm text-muted sm:text-left">
        Page {page} of {totalPages} · {total} total
      </p>
      <div className="flex w-full gap-2 sm:w-auto">
        <Button className="flex-1 sm:flex-initial" size="compact" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <Button
          className="flex-1 sm:flex-initial"
          size="compact"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
