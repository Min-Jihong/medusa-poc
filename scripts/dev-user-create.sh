#!/usr/bin/env bash
set -euo pipefail

# Create an admin user using medusa CLI
# Env with defaults: DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME, ADMIN_EMAIL, ADMIN_PASSWORD

ROOT_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
API_DIR="$ROOT_DIR/integration-tests/api"
CLI_BIN="$ROOT_DIR/packages/cli/medusa-cli/dist/index.js"

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USERNAME=${DB_USERNAME:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}
DB_NAME=${DB_NAME:-medusa_test}
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@example.com}
ADMIN_PASSWORD=${ADMIN_PASSWORD:-pass1234}

echo "👤 Creating admin user ($ADMIN_EMAIL) ..."
(
  cd "$API_DIR" && \
  DB_HOST="$DB_HOST" \
  DB_USERNAME="$DB_USERNAME" \
  DB_PASSWORD="$DB_PASSWORD" \
  DB_TEMP_NAME="$DB_NAME" \
  node "$CLI_BIN" user -e "$ADMIN_EMAIL" -p "$ADMIN_PASSWORD"
)
