#!/usr/bin/env bash
set -euo pipefail

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

# 1) Create DB
echo "📦 Step 1/3: Ensure database exists"
"$ROOT_DIR/scripts/dev-db-create.sh"

# 2) Create admin user  
echo "👤 Step 2/3: Create admin user ($ADMIN_EMAIL)"
"$ROOT_DIR/scripts/dev-user-create.sh" || true

# 3) Setup Medusa data (regions, sales channels, API keys)
echo "🔧 Step 3/3: Setting up Medusa data (regions, sales channels, API keys)"
(
  cd "$ROOT_DIR" && \
  DATABASE_URL="postgres://$DB_USERNAME:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME" \
  node "$ROOT_DIR/scripts/setup-medusa.js"
) || {
  echo "⚠️  Medusa data setup failed, but continuing..."
}

# Setup completed
echo "✅ Setup completed. Migrations will run automatically on server start."
echo "    Run 'yarn dev:start' to start servers."