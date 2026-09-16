#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "[entrypoint] Applying database schema..."
  npx drizzle-kit push --config=drizzle.config.ts
fi

exec "$@"
