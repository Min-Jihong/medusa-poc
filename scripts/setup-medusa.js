#!/usr/bin/env node

const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

console.log("🚀 Medusa Storefront & Admin Setup Script")
console.log("==========================================\n")

// PostgreSQL 연결 정보
const DATABASE_URL = process.env.DATABASE_URL || "postgres://localhost/medusa"

// 색상 출력 함수
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
}

// PostgreSQL 쿼리 실행 함수
function runQuery(query) {
  try {
    return execSync(`psql ${DATABASE_URL} -c "${query}"`, {
      encoding: "utf8",
      stdio: "pipe",
    })
  } catch (error) {
    // 에러가 있지만 결과가 있는 경우 (예: 이미 존재하는 경우)
    if (error.stdout) {
      return error.stdout
    }
    console.log(colors.yellow(`⚠️  Query warning: ${error.message}`))
    return null
  }
}

// 환경 변수 업데이트 함수
function updateEnvFile(filePath, key, value) {
  try {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, "utf8")

      // 기존 키가 있으면 업데이트, 없으면 추가
      if (content.includes(`${key}=`)) {
        content = content.replace(new RegExp(`${key}=.*`), `${key}=${value}`)
      } else {
        content += `\n${key}=${value}`
      }

      fs.writeFileSync(filePath, content)
      console.log(colors.green(`✅ Updated ${filePath}`))
    } else {
      console.log(colors.yellow(`⚠️  File not found: ${filePath}`))
    }
  } catch (error) {
    console.log(colors.red(`❌ Error updating ${filePath}: ${error.message}`))
  }
}

async function setupMedusa() {
  try {
    console.log(colors.blue("1. Checking database connection..."))
    const dbCheck = runQuery("SELECT version();")
    if (dbCheck) {
      console.log(colors.green("✅ Database connection successful"))
    } else {
      console.log(colors.red("❌ Database connection failed"))
      return
    }

    console.log(colors.blue("\n2. Creating Region..."))
    const regionExists = runQuery(
      "SELECT id FROM region WHERE id = 'reg_default';"
    )
    if (!regionExists || regionExists.includes("0 rows")) {
      runQuery(
        "INSERT INTO region (id, name, currency_code, automatic_taxes) VALUES ('reg_default', 'Default Region', 'usd', false);"
      )
      console.log(colors.green("✅ Region created"))
    } else {
      console.log(colors.yellow("⚠️  Region already exists"))
    }

    console.log(colors.blue("\n3. Connecting Region to Country..."))
    const countryExists = runQuery(
      "SELECT region_id FROM region_country WHERE region_id = 'reg_default';"
    )
    if (!countryExists || countryExists.includes("0 rows")) {
      runQuery(
        "UPDATE region_country SET region_id = 'reg_default' WHERE iso_2 = 'us';"
      )
      console.log(colors.green("✅ Region connected to US country"))
    } else {
      console.log(colors.yellow("⚠️  Region already connected to country"))
    }

    console.log(colors.blue("\n4. Creating Sales Channel..."))
    const salesChannelExists = runQuery(
      "SELECT id FROM sales_channel WHERE id = 'sc_default';"
    )
    if (!salesChannelExists || salesChannelExists.includes("0 rows")) {
      runQuery(
        "INSERT INTO sales_channel (id, name, description, is_disabled, created_at, updated_at, deleted_at) VALUES ('sc_default', 'Default Sales Channel', 'Default sales channel for the storefront', false, NOW(), NOW(), NULL);"
      )
      console.log(colors.green("✅ Sales Channel created"))
    } else {
      console.log(colors.yellow("⚠️  Sales Channel already exists"))
    }

    console.log(colors.blue("\n5. Getting Publishable API Key..."))
    const apiKeyResult = runQuery(
      "SELECT id, token FROM api_key WHERE type = 'publishable' LIMIT 1;"
    )
    let apiKeyId = null
    let apiKeyToken = null

    if (apiKeyResult && !apiKeyResult.includes("0 rows")) {
      const lines = apiKeyResult.split("\n")
      for (const line of lines) {
        if (
          line.includes("|") &&
          !line.includes("id") &&
          !line.includes("---")
        ) {
          const parts = line.split("|").map((p) => p.trim())
          if (parts.length >= 2) {
            apiKeyId = parts[0]
            apiKeyToken = parts[1]
            break
          }
        }
      }
    }

    if (!apiKeyId || !apiKeyToken) {
      console.log(colors.red("❌ No publishable API key found"))
      return
    }

    console.log(colors.green(`✅ Found API Key: ${apiKeyId}`))

    console.log(colors.blue("\n6. Connecting API Key to Sales Channel..."))
    const connectionExists = runQuery(
      `SELECT id FROM publishable_api_key_sales_channel WHERE publishable_key_id = '${apiKeyId}' AND sales_channel_id = 'sc_default';`
    )
    if (!connectionExists || connectionExists.includes("0 rows")) {
      runQuery(
        `INSERT INTO publishable_api_key_sales_channel (publishable_key_id, sales_channel_id, id) VALUES ('${apiKeyId}', 'sc_default', 'rel_setup_script');`
      )
      console.log(colors.green("✅ API Key connected to Sales Channel"))
    } else {
      console.log(
        colors.yellow("⚠️  API Key already connected to Sales Channel")
      )
    }

    console.log(colors.blue("\n7. Updating Storefront environment..."))
    const storefrontEnvPath = path.join(
      __dirname,
      "..",
      "packages",
      "storefront",
      ".env"
    )
    updateEnvFile(
      storefrontEnvPath,
      "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY",
      apiKeyToken
    )

    console.log(colors.blue("\n8. Verifying setup..."))
    const verification = runQuery(`
      SELECT 
        r.name as region_name,
        sc.name as sales_channel_name,
        pak.title as api_key_title
      FROM region r
      LEFT JOIN region_country rc ON r.id = rc.region_id
      LEFT JOIN sales_channel sc ON sc.id = 'sc_default'
      LEFT JOIN api_key pak ON pak.id = '${apiKeyId}'
      WHERE r.id = 'reg_default' AND rc.iso_2 = 'us';
    `)

    if (verification && !verification.includes("0 rows")) {
      console.log(colors.green("✅ Setup verification successful"))
      console.log(colors.blue("\n📋 Setup Summary:"))
      console.log(colors.green("   • Region: Default Region (USD)"))
      console.log(colors.green("   • Country: United States (US)"))
      console.log(colors.green("   • Sales Channel: Default Sales Channel"))
      console.log(colors.green("   • API Key: Connected and configured"))
      console.log(colors.green("   • Storefront: Environment updated"))
    } else {
      console.log(colors.red("❌ Setup verification failed"))
    }

    console.log(colors.blue("\n🎉 Setup completed!"))
    console.log(colors.yellow("\n📝 Next steps:"))
    console.log(colors.yellow("   1. Restart your development servers:"))
    console.log(colors.yellow("      yarn dev"))
    console.log(colors.yellow("   2. Access your applications:"))
    console.log(colors.yellow("      • Storefront: http://localhost:8000"))
    console.log(colors.yellow("      • Admin: http://localhost:5173"))
    console.log(colors.yellow("      • API: http://localhost:9000"))
  } catch (error) {
    console.log(colors.red(`❌ Setup failed: ${error.message}`))
    process.exit(1)
  }
}

// 스크립트 실행
if (require.main === module) {
  setupMedusa()
}

module.exports = { setupMedusa }
