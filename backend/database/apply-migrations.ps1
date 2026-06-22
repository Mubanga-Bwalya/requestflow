# Apply RequestFlow SQL migrations in canonical order (schema only — no destructive scripts).
# Usage: .\apply-migrations.ps1
$ErrorActionPreference = "Stop"
$Dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$HostName = if ($env:PGHOST) { $env:PGHOST } else { "localhost" }
$User = if ($env:PGUSER) { $env:PGUSER } else { "postgres" }
$Database = if ($env:PGDATABASE) { $env:PGDATABASE } else { "requestflow" }

$Files = @(
  "001_create_schema.sql",
  "004_system_settings.sql",
  "006_performance_indexes.sql",
  "007_request_number_sequences.sql",
  "008_system_events.sql",
  "009_manager_role.sql",
  "010_performance_indexes.sql",
  "013_activity_admin_actions.sql",
  "014_allow_multi_department_manager.sql",
  "015_data_integrity_constraints.sql",
  "016_user_gn.sql",
  "002_seed_core_data.sql"
)

foreach ($f in $Files) {
  Write-Host "Applying $f..."
  & psql -h $HostName -U $User -d $Database -v ON_ERROR_STOP=1 -f (Join-Path $Dir $f)
}

Write-Host "Done. Run: cd backend && npm run db:seed"
