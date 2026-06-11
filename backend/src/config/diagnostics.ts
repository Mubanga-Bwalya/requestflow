export type DiagnosticsConfig = {
  ingestSecret: string;
};

export function resolveDiagnosticsConfig(): DiagnosticsConfig {
  return {
    ingestSecret: process.env.DIAGNOSTICS_INGEST_SECRET?.trim() ?? '',
  };
}
