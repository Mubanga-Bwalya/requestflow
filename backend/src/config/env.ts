/** True when NODE_ENV is production (case-insensitive). */
export function isProduction(): boolean {
  return process.env.NODE_ENV?.trim().toLowerCase() === 'production';
}
