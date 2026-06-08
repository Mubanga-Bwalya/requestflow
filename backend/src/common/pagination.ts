export type PaginationParams = {
  page: number;
  limit: number;
  skip: number;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parsePagination(
  pageRaw?: string,
  limitRaw?: string,
): PaginationParams {
  const page = Math.max(1, parseInt(pageRaw ?? '1', 10) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(
      1,
      parseInt(limitRaw ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
    ),
  );
  return { page, limit, skip: (page - 1) * limit };
}

export function paginatedResult<T>(
  items: T[],
  total: number,
  { page, limit }: PaginationParams,
): PaginatedResult<T> {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export function wantsPagination(pageRaw?: string, limitRaw?: string): boolean {
  return pageRaw !== undefined || limitRaw !== undefined;
}

/** Always paginate list endpoints — defaults page=1, limit=20, max 100. */
export function resolveListPagination(
  page?: number,
  limit?: number,
): PaginationParams {
  return parsePagination(
    page !== undefined ? String(page) : undefined,
    limit !== undefined ? String(limit) : undefined,
  );
}
