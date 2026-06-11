/** Whether a non-5xx HTTP response should be stored for the admin problems log. */
export function shouldRecordHttpWarning(status: number, path: string): boolean {
  if (status === 429 || status === 401 || status === 403) return true;
  const route = path.split('?')[0] ?? path;
  if (route.startsWith('/admin') && status === 404) return true;
  return false;
}
