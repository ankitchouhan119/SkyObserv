#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "[entrypoint] Applying database schema..."
  # RDS and some managed Postgres present cert chains Node does not trust by default.
  NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma db push --skip-generate --accept-data-loss
fi

exec "$@"
