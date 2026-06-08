export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export function isPaginated<T>(data: T[] | PaginatedResponse<T>): data is PaginatedResponse<T> {
  return data !== null && typeof data === "object" && "items" in data && Array.isArray((data as PaginatedResponse<T>).items);
}
