#!/usr/bin/env node

// Quick start using integration-tests setup
const path = require("path")

// Set required environment variables
process.env.DB_HOST = process.env.DB_HOST || "localhost"
process.env.DB_USERNAME = process.env.DB_USERNAME || "postgres"
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "postgres"
process.env.DB_TEMP_NAME = process.env.DB_TEMP_NAME || "medusa_test"

// Allow local frontend origins (CORS)
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173"
process.env.STORE_CORS = process.env.STORE_CORS || FRONTEND_ORIGIN
process.env.ADMIN_CORS = process.env.ADMIN_CORS || FRONTEND_ORIGIN
process.env.AUTH_CORS = process.env.AUTH_CORS || FRONTEND_ORIGIN

// Import the start command directly
const start = require("../packages/medusa/dist/commands/start").default

// Use the integration-tests configuration
const integrationTestsDir = path.join(__dirname, "..", "integration-tests/api")

console.log("🚀 Quick Start Medusa Server")
console.log("============================")
console.log("📁 Directory:", integrationTestsDir)
console.log("🗄️  Database: medusa_test")
console.log("🌐 Server: http://localhost:9000")
console.log("👤 Admin: http://localhost:3000")
console.log("🛍️  Store: http://localhost:8000")
console.log("")

// Start the server
start({
  directory: integrationTestsDir,
  port: 9000,
  host: "localhost",
  types: false, // Skip type generation for faster startup
}).catch((err) => {
  console.error("❌ Failed to start server:")
  console.error(err.message)
  console.log("")
  console.log("💡 Make sure:")
  console.log("   1. PostgreSQL is running")
  console.log("   2. Database 'medusa_test' exists")
  console.log('   3. Run: psql -U postgres -c "CREATE DATABASE medusa_test;"')
  process.exit(1)
})
