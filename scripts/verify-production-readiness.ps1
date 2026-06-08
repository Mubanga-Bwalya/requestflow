# RequestFlow Phase 5 verification (run from repo root)
# Usage: powershell -File scripts/verify-production-readiness.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

function Run-Step($name, $dir, $commands) {
  Write-Host "`n=== $name ===" -ForegroundColor Cyan
  Push-Location (Join-Path $root $dir)
  try {
    foreach ($cmd in $commands) {
      Write-Host ">> $cmd"
      Invoke-Expression $cmd
      if ($LASTEXITCODE -ne 0) { throw "Failed: $cmd in $dir" }
    }
  } finally {
    Pop-Location
  }
}

Run-Step "Backend" "backend" @(
  "npm run typecheck",
  "npm run test",
  "npm run build",
  "npm audit --audit-level=critical"
)

Run-Step "User frontend" "user-frontend" @(
  "npm run typecheck",
  "npm run lint",
  "npm run build",
  "npm audit --audit-level=critical"
)

Run-Step "Admin frontend" "admin-frontend" @(
  "npm run typecheck",
  "npm run lint",
  "npm run build",
  "npm audit --audit-level=critical"
)

Write-Host "`nOptional (requires Postgres + seed): cd backend; npm run test:e2e" -ForegroundColor Yellow
Write-Host "Manual smoke: docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md section 9" -ForegroundColor Yellow
Write-Host "`nAll automated steps passed." -ForegroundColor Green
