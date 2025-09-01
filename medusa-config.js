const { Modules } = require("@medusajs/utils")

// 환경 변수 설정
process.env.POSTGRES_URL =
  process.env.POSTGRES_URL || "postgres://localhost/medusa"
process.env.LOG_LEVEL = process.env.LOG_LEVEL || "info"

module.exports = {
  admin: {
    disable: true,
  },
  plugins: [],
  projectConfig: {
    databaseUrl: process.env.POSTGRES_URL,
    databaseType: "postgres",
    http: {
      jwtSecret: "test-secret-key",
      cookieSecret: "test-cookie-secret",
      adminCors: "http://localhost:3000,http://localhost:8000",
      storeCors: "http://localhost:3000,http://localhost:8000",
      authCors: "http://localhost:3000,http://localhost:8000",
    },
  },
  featureFlags: {
    medusa_v2: true,
  },
  modules: {
    [Modules.AUTH]: {
      resolve: "@medusajs/auth",
      options: {
        providers: [
          {
            resolve: "@medusajs/auth-emailpass",
            id: "emailpass",
          },
        ],
      },
    },
    [Modules.USER]: {
      scope: "internal",
      resolve: "@medusajs/user",
      options: {
        jwt_secret: "test-secret-key",
      },
    },
    [Modules.CACHE]: {
      resolve: "@medusajs/cache-inmemory",
      options: { ttl: 0 },
    },
    [Modules.STOCK_LOCATION]: {
      resolve: "@medusajs/stock-location",
      options: {},
    },
    [Modules.INVENTORY]: {
      resolve: "@medusajs/inventory",
      options: {},
    },
    [Modules.FILE]: {
      resolve: "@medusajs/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/file-local",
            id: "local",
          },
        ],
      },
    },
    [Modules.PRODUCT]: true,
    [Modules.PRICING]: true,
    [Modules.PROMOTION]: true,
    [Modules.REGION]: true,
    [Modules.CUSTOMER]: true,
    [Modules.SALES_CHANNEL]: true,
    [Modules.CART]: true,
    [Modules.WORKFLOW_ENGINE]: true,
    [Modules.API_KEY]: true,
    [Modules.STORE]: true,
    [Modules.TAX]: true,
    [Modules.CURRENCY]: true,
    [Modules.ORDER]: true,
    [Modules.PAYMENT]: {
      resolve: "@medusajs/payment",
      options: {
        providers: [
          {
            resolve: {
              services: [
                require("@medusajs/payment/dist/providers/system").default,
              ],
            },
            id: "default",
          },
        ],
      },
    },
    [Modules.FULFILLMENT]: {
      options: {
        providers: [
          {
            resolve: "@medusajs/fulfillment-manual",
            id: "manual",
          },
        ],
      },
    },
    [Modules.NOTIFICATION]: {
      options: {
        providers: [
          {
            resolve: "@medusajs/notification-local",
            id: "local",
            options: {
              name: "Local Notification Provider",
              channels: ["log", "email"],
            },
          },
        ],
      },
    },
  },
}
