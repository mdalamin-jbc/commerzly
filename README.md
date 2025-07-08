# BitCommerce Merchant API POC

A proof-of-concept implementation of the BitCommerce Merchant API with OAuth 2.0 Authorization Code Flow for secure third-party application access.

## Features

- ✅ OAuth 2.0 Authorization Code Flow
- ✅ App registration and management
- ✅ Access token & refresh token support
- ✅ Scope-based authorization
- ✅ Merchant-specific API access
- ✅ Token validation middleware
- ✅ Rate limiting and security headers

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start the server:**
   ```bash
   npm run dev
   ```

4. **Access the API:**
   - API Base URL: `http://localhost:3000`
   - OAuth Endpoints: `/oauth/*`
   - Merchant APIs: `/api/v1/merchants/*`

## OAuth Flow

### 1. App Registration
Register your application to get `client_id` and `client_secret`:

```bash
curl -X POST http://localhost:3000/oauth/apps \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My App",
    "redirect_uri": "https://myapp.com/callback",
    "scopes": ["read_products", "read_orders"]
  }'
```

### 2. Authorization Flow
1. Redirect merchant to: `GET /oauth/authorize?client_id=xxx&scope=read_products&redirect_uri=https://myapp.com/callback`
2. Merchant logs in and approves
3. Redirect to app with authorization code
4. Exchange code for tokens: `POST /oauth/token`

### 3. API Access
Use access token in Authorization header:
```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:3000/api/v1/merchants/123/products
```

## API Endpoints

### OAuth Endpoints
- `GET /oauth/authorize` - Authorization page
- `POST /oauth/token` - Token exchange
- `POST /oauth/apps` - App registration
- `GET /oauth/apps` - List registered apps

### Merchant APIs
- `GET /api/v1/merchants/:id/products` - Get merchant products
- `GET /api/v1/merchants/:id/orders` - Get merchant orders
- `GET /api/v1/merchants/:id/profile` - Get merchant profile

## Scopes

- `read_products` - Read merchant products
- `read_orders` - Read merchant orders
- `read_profile` - Read merchant profile
- `write_products` - Create/update products
- `write_orders` - Create/update orders

## Security Features

- JWT-based tokens with configurable expiration
- Scope-based authorization
- Rate limiting
- CORS protection
- Security headers (Helmet)
- State parameter validation
- PKCE support (planned)

## Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Production build
npm start
```

## Project Structure

```
src/
├── config/          # Configuration files
├── middleware/      # Express middleware
├── models/          # Data models
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utility functions
└── server.js        # Main server file
```

## Next Steps

- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] PKCE support for enhanced security
- [ ] Token introspection endpoint
- [ ] App marketplace UI
- [ ] Webhook support
- [ ] Analytics and monitoring # commerzly
