#!/usr/bin/env bash
# Apply RequestFlow SQL migrations in canonical order (schema only — no destructive scripts).
# Usage (local): PGHOST=localhost PGUSER=postgres PGPASSWORD=postgres PGDATABASE=requestflow ./apply-migrations.sh
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
PGHOST="${PGHOST:-localhost}"
PGUSER="${PGUSER:-postgres}"
PGDATABASE="${PGDATABASE:-requestflow}"

FILES=(
  001_create_schema.sql
  004_system_settings.sql
  006_performance_indexes.sql
  007_request_number_sequences.sql
  008_system_events.sql
  009_manager_role.sql
  010_performance_indexes.sql
  013_activity_admin_actions.sql
  014_allow_multi_department_manager.sql
  015_data_integrity_constraints.sql
  016_user_gn.sql
  002_seed_core_data.sql
)

for f in "${FILES[@]}"; do
  echo "Applying ${f}..."
  psql -h "${PGHOST}" -U "${PGUSER}" -d "${PGDATABASE}" -v ON_ERROR_STOP=1 -f "${DIR}/${f}"
done

echo "Done. Run: cd backend && npm run db:seed"
