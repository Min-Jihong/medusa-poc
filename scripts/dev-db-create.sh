#!/usr/bin/env bash
set -euo pipefail

# Create Postgres database if it doesn't exist
# Env (with defaults): DB_HOST, DB_PORT, DB_USERNAME, DB_NAME

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USERNAME=${DB_USERNAME:-postgres}
DB_NAME=${DB_NAME:-medusa_standalone}

echo "🔍 Checking database '$DB_NAME' on $DB_HOST:$DB_PORT..."
if psql -U "$DB_USERNAME" -h "$DB_HOST" -p "$DB_PORT" -lqt | cut -d '|' -f1 | grep -qw "$DB_NAME"; then
  echo "✅ Database exists"
else
  echo "📦 Creating database '$DB_NAME'..."
  createdb -U "$DB_USERNAME" -h "$DB_HOST" -p "$DB_PORT" "$DB_NAME"
  echo "✅ Database created"
fi
