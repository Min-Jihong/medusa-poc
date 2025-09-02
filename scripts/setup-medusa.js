#!/usr/bin/env node

const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

console.log("🚀 Medusa Storefront & Admin Setup Script")
console.log("==========================================\n")

// PostgreSQL 연결 정보
const DATABASE_URL =
  process.env.DATABASE_URL || "postgres://localhost/medusa_standalone"

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

    console.log(colors.blue("\n5. Getting or Creating Publishable API Key..."))
    let apiKeyResult = runQuery(
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

    // API Key가 없으면 생성
    if (!apiKeyId || !apiKeyToken) {
      console.log(
        colors.yellow("⚠️  No publishable API key found, creating one...")
      )

      // Admin 사용자 ID 가져오기
      const adminResult = runQuery(
        "SELECT id FROM public.user WHERE email = 'admin@example.com' LIMIT 1;"
      )
      let adminId = null
      if (adminResult && !adminResult.includes("0 rows")) {
        const lines = adminResult.split("\n")
        for (const line of lines) {
          if (
            line.trim() &&
            !line.includes("id") &&
            !line.includes("-") &&
            line.trim().startsWith("user_")
          ) {
            adminId = line.trim()
            break
          }
        }
      }

      console.log(colors.blue(`Admin ID found: ${adminId}`))

      // UUID와 토큰 생성
      const crypto = require("crypto")
      apiKeyId = `pk_${crypto.randomBytes(16).toString("hex")}`
      apiKeyToken = `pk_${crypto.randomBytes(32).toString("hex")}`

      // Salt 생성 (bcrypt용)
      const salt = crypto.randomBytes(16).toString("hex")

      const createResult = runQuery(
        `INSERT INTO api_key (id, token, redacted, title, type, salt, created_by, created_at, updated_at) 
         VALUES ('${apiKeyId}', '${apiKeyToken}', '${apiKeyToken.substring(
          0,
          7
        )}****', 'Default Publishable Key', 'publishable', '${salt}', ${
          adminId ? `'${adminId}'` : "NULL"
        }, NOW(), NOW());`
      )

      if (createResult !== null) {
        console.log(colors.green("✅ Publishable API key created"))
      } else {
        console.log(colors.red("❌ Failed to create API key"))
        return
      }
    } else {
      console.log(colors.green("✅ Found existing API key"))
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

    // Storefront .env 템플릿 생성
    const envTemplate = `# Your Medusa backend, should be updated to where you are hosting your server. Remember to update CORS settings for your server. See – https://docs.medusajs.com/learn/configurations/medusa-config#httpstorecors
MEDUSA_BACKEND_URL=http://localhost:9000

# Your publishable key that can be attached to sales channels. See - https://docs.medusajs.com/resources/storefront-development/publishable-api-keys
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${apiKeyToken}

# Your store URL, should be updated to where you are hosting your storefront.
NEXT_PUBLIC_BASE_URL=http://localhost:8000

# Your preferred default region. When middleware cannot determine the user region from the "x-vercel-country" header, the default region will be used. ISO-2 lowercase format. 
NEXT_PUBLIC_DEFAULT_REGION=us

# Your Stripe public key. See – https://docs.medusajs.com/resources/commerce-modules/payment/payment-provider/stripe
NEXT_PUBLIC_STRIPE_KEY=

# Your Next.js revalidation secret. See – https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#on-demand-revalidation
REVALIDATE_SECRET=supersecret
`

    try {
      fs.writeFileSync(storefrontEnvPath, envTemplate)
      console.log(colors.green("✅ Storefront .env file created with template"))
    } catch (error) {
      console.log(colors.red(`❌ Error creating .env file: ${error.message}`))
    }

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

    console.log(colors.blue("\n🎉 Medusa data setup completed!"))
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
