# Deprecated SQL scripts

Scripts in this folder are **not** part of the canonical migration path. They are kept for audit history only.

| File | Reason |
|------|--------|
| `005_auth_passwords.sql` | Previously wrote plaintext passwords — disabled |

Do not run files from this folder in CI, production, or routine local setup.
