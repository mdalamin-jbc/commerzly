# BitCommerce OAuth API Documentation

## Overview

The BitCommerce OAuth API provides secure access to merchant data through OAuth 2.0 Authorization Code Flow. This API allows third-party applications to integrate with BitCommerce while maintaining security and user privacy.

## Base URL

```
http://localhost:3000
```

## Authentication

All API requests (except OAuth endpoints) require a valid Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## OAuth 2.0 Flow

### 1. App Registration

Before using the API, applications must be registered to obtain `client_id` and `client_secret`.

**Endpoint:** `POST /oauth/apps`

**Request Body:**
```json
{
  "name": "My Integration App",
  "redirect_uri": "https://myapp.com/callback",
  "scopes": ["read_products", "read_orders", "read_profile"]
}
```

**Response:**
```json
{
  "message": "Application registered successfully",
  "app": {
    "app_id": "app_1234567890",
    "client_id": "client_abc123",
    "client_secret": "secret_xyz789",
    "name": "My Integration App",
    "redirect_uri": "https://myapp.com/callback",
    "scopes": ["read_products", "read_orders", "read_profile"],
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Authorization Flow

**Step 1:** Redirect user to authorization endpoint

```
GET /oauth/authorize?client_id=client_abc123&redirect_uri=https://myapp.com/callback&scope=read_products&response_type=code&state=random_state
```

**Step 2:** User logs in and approves the application

**Step 3:** User is redirected back with authorization code

```
https://myapp.com/callback?code=auth_code_123&state=random_state
```

### 3. Token Exchange

**Endpoint:** `POST /oauth/token`

**Request Body:**
```json
{
  "grant_type": "authorization_code",
  "client_id": "client_abc123",
  "client_secret": "secret_xyz789",
  "code": "auth_code_123",
  "redirect_uri": "https://myapp.com/callback"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token_456",
  "scope": "read_products read_orders"
}
```

### 4. Token Refresh

**Endpoint:** `POST /oauth/token`

**Request Body:**
```json
{
  "grant_type": "refresh_token",
  "client_id": "client_abc123",
  "client_secret": "secret_xyz789",
  "refresh_token": "refresh_token_456"
}
```

## Available Scopes

| Scope | Description |
|-------|-------------|
| `read_products` | Read merchant products |
| `read_orders` | Read merchant orders |
| `read_profile` | Read merchant profile |
| `write_products` | Create/update products |
| `write_orders` | Create/update orders |

## Merchant API Endpoints

### Get Merchant Profile

**Endpoint:** `GET /api/v1/merchants/{merchant_id}/profile`

**Required Scope:** `read_profile`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": "merchant_123",
  "name": "Sample Store",
  "email": "merchant@samplestore.com",
  "status": "active",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

### Get Merchant Products

**Endpoint:** `GET /api/v1/merchants/{merchant_id}/products`

**Required Scope:** `read_products`

**Response:**
```json
{
  "merchant": {
    "id": "merchant_123",
    "name": "Sample Store"
  },
  "products": [
    {
      "id": "product_1",
      "merchant_id": "merchant_123",
      "name": "Sample Product 1",
      "price": 29.99,
      "description": "A sample product for testing",
      "status": "active",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

### Get Specific Product

**Endpoint:** `GET /api/v1/merchants/{merchant_id}/products/{product_id}`

**Required Scope:** `read_products`

**Response:**
```json
{
  "merchant": {
    "id": "merchant_123",
    "name": "Sample Store"
  },
  "product": {
    "id": "product_1",
    "merchant_id": "merchant_123",
    "name": "Sample Product 1",
    "price": 29.99,
    "description": "A sample product for testing",
    "status": "active",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Merchant Orders

**Endpoint:** `GET /api/v1/merchants/{merchant_id}/orders`

**Required Scope:** `read_orders`

**Response:**
```json
{
  "merchant": {
    "id": "merchant_123",
    "name": "Sample Store"
  },
  "orders": [
    {
      "id": "order_1",
      "merchant_id": "merchant_123",
      "customer_email": "customer@example.com",
      "total": 79.98,
      "status": "completed",
      "items": [
        {
          "product_id": "product_1",
          "quantity": 1,
          "price": 29.99
        }
      ],
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 1
}
```

### Get Specific Order

**Endpoint:** `GET /api/v1/merchants/{merchant_id}/orders/{order_id}`

**Required Scope:** `read_orders`

### Get Merchant Summary

**Endpoint:** `GET /api/v1/merchants/{merchant_id}/summary`

**Required Scope:** `read_products` OR `read_orders`

**Response:**
```json
{
  "merchant": {
    "id": "merchant_123",
    "name": "Sample Store",
    "status": "active"
  },
  "products": {
    "count": 2,
    "total_value": 79.98
  },
  "orders": {
    "count": 1,
    "total_revenue": 79.98
  }
}
```

## Error Responses

All errors follow the OAuth 2.0 error format:

```json
{
  "error": "error_code",
  "error_description": "Human readable error description"
}
```

### Common Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `invalid_request` | 400 | Missing or invalid parameters |
| `invalid_client` | 401 | Invalid client credentials |
| `invalid_grant` | 400 | Invalid authorization code or refresh token |
| `access_denied` | 401 | Missing or invalid authorization header |
| `invalid_token` | 401 | Invalid or expired access token |
| `insufficient_scope` | 403 | Token lacks required scopes |
| `not_found` | 404 | Resource not found |
| `server_error` | 500 | Internal server error |

## Rate Limiting

- **Limit:** 100 requests per 15 minutes per IP
- **Headers:** Rate limit information is included in response headers
- **Error:** `429 Too Many Requests` when limit exceeded

## Security Features

- **JWT Tokens:** Secure token-based authentication
- **Scope Validation:** Fine-grained access control
- **Token Expiration:** Access tokens expire after 1 hour
- **Refresh Tokens:** Long-lived refresh tokens (7 days)
- **CORS Protection:** Cross-origin request protection
- **Rate Limiting:** Protection against abuse
- **Security Headers:** Helmet.js security headers

## Example Integration

### Complete OAuth Flow Example

```javascript
const axios = require('axios');

class BitCommerceClient {
  constructor(clientId, clientSecret, redirectUri) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.baseUrl = 'http://localhost:3000';
  }

  // Step 1: Get authorization URL
  getAuthorizationUrl(scope = 'read_products', state = null) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope,
      response_type: 'code',
      state: state || Math.random().toString(36).substr(2, 9)
    });
    
    return `${this.baseUrl}/oauth/authorize?${params.toString()}`;
  }

  // Step 2: Exchange code for tokens
  async exchangeCodeForTokens(code) {
    const response = await axios.post(`${this.baseUrl}/oauth/token`, {
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      redirect_uri: this.redirectUri
    });
    
    return response.data;
  }

  // Step 3: Refresh access token
  async refreshToken(refreshToken) {
    const response = await axios.post(`${this.baseUrl}/oauth/token`, {
      grant_type: 'refresh_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken
    });
    
    return response.data;
  }

  // Step 4: Make API calls
  async getMerchantProducts(merchantId, accessToken) {
    const response = await axios.get(
      `${this.baseUrl}/api/v1/merchants/${merchantId}/products`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    return response.data;
  }
}

// Usage example
const client = new BitCommerceClient(
  'client_abc123',
  'secret_xyz789',
  'https://myapp.com/callback'
);

// 1. Redirect user to this URL
const authUrl = client.getAuthorizationUrl('read_products read_orders');
console.log('Redirect user to:', authUrl);

// 2. After user approves, exchange code for tokens
const tokens = await client.exchangeCodeForTokens('auth_code_from_redirect');

// 3. Use access token to make API calls
const products = await client.getMerchantProducts('merchant_123', tokens.access_token);
console.log('Products:', products);
```

## Testing

### Run Tests
```bash
npm test
```

### Run Demo
```bash
npm run demo
```

### Manual Testing with curl

1. **Register an app:**
```bash
curl -X POST http://localhost:3000/oauth/apps \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test App",
    "redirect_uri": "https://testapp.com/callback",
    "scopes": ["read_products", "read_orders"]
  }'
```

2. **Get authorization URL:**
```bash
curl "http://localhost:3000/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=https://testapp.com/callback&scope=read_products&response_type=code"
```

3. **Exchange code for tokens:**
```bash
curl -X POST http://localhost:3000/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "code": "AUTH_CODE",
    "redirect_uri": "https://testapp.com/callback"
  }'
```

4. **Access protected API:**
```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:3000/api/v1/merchants/merchant_123/products
```

## Next Steps

- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] PKCE support for enhanced security
- [ ] Token introspection endpoint
- [ ] App marketplace UI
- [ ] Webhook support
- [ ] Analytics and monitoring 