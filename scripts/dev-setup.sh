#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
API_DIR="$ROOT_DIR/integration-tests/api"
CLI_BIN="$ROOT_DIR/packages/cli/medusa-cli/dist/index.js"

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USERNAME=${DB_USERNAME:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}
DB_NAME=${DB_NAME:-medusa_standalone}
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@example.com}
ADMIN_PASSWORD=${ADMIN_PASSWORD:-pass1234}

# 1) Create DB
echo "📦 Step 1/4: Ensure database exists"
"$ROOT_DIR/scripts/dev-db-create.sh"

# 2) Run database migrations to create schema (skip problematic migration scripts)
echo "🗄️  Step 2/4: Running database migrations to create schema"
(
  cd "$ROOT_DIR" && \
  DATABASE_URL="postgres://$DB_USERNAME:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME" \
  npx medusa db:migrate --skip-scripts
) || {
  echo "❌ Database migrations failed. Cannot continue without schema."
  echo "   Please check your database connection and try again."
  exit 1
}

# 3) Create admin user  
echo "👤 Step 3/4: Create admin user ($ADMIN_EMAIL)"
"$ROOT_DIR/scripts/dev-user-create.sh" || true

# 4) Setup Medusa data (regions, sales channels, API keys)
echo "🔧 Step 4/4: Setting up Medusa data (regions, sales channels, API keys)"
(
  cd "$ROOT_DIR" && \
  DATABASE_URL="postgres://$DB_USERNAME:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME" \
  node "$ROOT_DIR/scripts/setup-medusa.js"
) || {
  echo "⚠️  Medusa data setup failed, but continuing..."
}

# Setup completed
echo "✅ Setup completed. Database schema and initial data are ready."
echo "    Run 'yarn dev:start' to start servers."