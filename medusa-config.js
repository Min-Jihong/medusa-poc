module.exports = {
  "admin": {
    "disable": false
  },
  "plugins": [],
  "projectConfig": {
    "databaseUrl": "postgres://postgres:postgres@localhost:5432/medusa_standalone",
    "databaseType": "postgres",
    "http": {
      "jwtSecret": "supersecret",
      "cookieSecret": "supersecret",
      "storeCors": "*",
      "adminCors": "*",
      "authCors": "*"
    }
  },
  "modules": {
    "auth": true,
    "user": {
      "scope": "internal",
      "resolve": "@medusajs/user",
      "options": {
        "jwt_secret": "supersecret"
      }
    },
    "cache": {
      "resolve": "@medusajs/cache-inmemory",
      "options": {
        "ttl": 0
      }
    },
    "stock_location": true,
    "inventory": true,
    "file": {
      "resolve": "@medusajs/file",
      "options": {
        "providers": [
          {
            "resolve": "@medusajs/file-local",
            "id": "local"
          }
        ]
      }
    },
    "product": true,
    "pricing": true,
    "promotion": true,
    "region": true,
    "customer": true,
    "sales_channel": true,
    "cart": true,
    "workflows": true,
    "api_key": true,
    "store": true,
    "tax": true,
    "currency": true,
    "order": true,
    "payment": {
      "resolve": "@medusajs/payment",
      "options": {
        "providers": [
          {
            "resolve": "@medusajs/payment-stripe",
            "id": "stripe",
            "options": {
              "apiKey": "dummy_key_for_testing"
            }
          }
        ]
      }
    },
    "fulfillment": {
      "options": {
        "providers": [
          {
            "resolve": "@medusajs/fulfillment-manual",
            "id": "manual"
          }
        ]
      }
    },
    "notification": {
      "options": {
        "providers": [
          {
            "resolve": "@medusajs/notification-local",
            "id": "local-notification-provider",
            "options": {
              "name": "Local Notification Provider",
              "channels": [
                "log"
              ]
            }
          }
        ]
      }
    }
  }
}