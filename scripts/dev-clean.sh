#!/usr/bin/env bash
set -euo pipefail

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USERNAME=${DB_USERNAME:-postgres}

# Databases we created during dev
DBS=("medusa_standalone" "medusa_standalone")

echo "🧹 Cleaning local Medusa environment"

# Kill server on 9000 if running
if lsof -nP -iTCP:9000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "🛑 Stopping server on port 9000"
  lsof -nP -iTCP:9000 -sTCP:LISTEN | awk 'NR>1{print $2}' | xargs -r kill -9 || true
fi

# Drop databases
for db in "${DBS[@]}"; do
  echo "📉 Dropping database if exists: $db"
  psql -U "$DB_USERNAME" -h "$DB_HOST" -p "$DB_PORT" -c "DROP DATABASE IF EXISTS $db;" || true
done

echo "✅ Cleanup completed"
