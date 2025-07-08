# BitCommerce OAuth API - Curl Testing Guide

This guide provides step-by-step curl commands to test the complete OAuth 2.0 flow and API endpoints.

## 🚀 Quick Start

### Prerequisites
1. Start the BitCommerce OAuth API server:
   ```bash
   npm run dev
   ```

2. The server should be running at `http://localhost:3000`

### Automated Testing
Run the complete test script:
```bash
./test-oauth-flow.sh
```

## 📋 Manual Testing Steps

### Step 1: Register OAuth Application

```bash
curl -X POST http://localhost:3000/oauth/apps \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Integration App",
    "redirect_uri": "https://myapp.com/callback",
    "scopes": ["read_products", "read_orders", "read_profile"]
  }'
```

**Expected Response:**
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

**Save the `client_id` and `client_secret` for the next steps.**

### Step 2: Generate Authorization URL

Construct the authorization URL with your client credentials:

```bash
# Replace YOUR_CLIENT_ID with the actual client_id from Step 1
CLIENT_ID="client_abc123"
REDIRECT_URI="https://myapp.com/callback"
SCOPE="read_products read_orders"
STATE="random_state_123"

AUTH_URL="http://localhost:3000/oauth/authorize?client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URI&scope=$SCOPE&response_type=code&state=$STATE"

echo "Authorization URL: $AUTH_URL"
```

**Open this URL in a browser to see the authorization page.**

### Step 3: Simulate Authorization (for testing)

For testing purposes, we'll simulate the authorization approval:

```bash
# Generate a mock authorization code
AUTH_CODE="test_auth_code_$(date +%s)"
echo "Simulated auth code: $AUTH_CODE"
```

**In production, you would get the real authorization code from the redirect URL after user approval.**

### Step 4: Exchange Authorization Code for Tokens

```bash
# Replace with your actual credentials
CLIENT_ID="client_abc123"
CLIENT_SECRET="secret_xyz789"
AUTH_CODE="test_auth_code_1234567890"
REDIRECT_URI="https://myapp.com/callback"

curl -X POST http://localhost:3000/oauth/token \
  -H "Content-Type: application/json" \
  -d "{
    \"grant_type\": \"authorization_code\",
    \"client_id\": \"$CLIENT_ID\",
    \"client_secret\": \"$CLIENT_SECRET\",
    \"code\": \"$AUTH_CODE\",
    \"redirect_uri\": \"$REDIRECT_URI\"
  }"
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token_456",
  "scope": "read_products read_orders"
}
```

**Save the `access_token` and `refresh_token` for API access.**

### Step 5: Access Merchant Profile

```bash
# Replace with your actual access token
ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:3000/api/v1/merchants/merchant_123/profile
```

**Expected Response:**
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

### Step 6: Access Merchant Products

```bash
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:3000/api/v1/merchants/merchant_123/products
```

**Expected Response:**
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

### Step 7: Access Merchant Orders

```bash
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:3000/api/v1/merchants/merchant_123/orders
```

**Expected Response:**
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

### Step 8: Access Merchant Summary

```bash
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:3000/api/v1/merchants/merchant_123/summary
```

**Expected Response:**
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

### Step 9: Refresh Access Token

```bash
# Replace with your actual refresh token
REFRESH_TOKEN="refresh_token_456"

curl -X POST http://localhost:3000/oauth/token \
  -H "Content-Type: application/json" \
  -d "{
    \"grant_type\": \"refresh_token\",
    \"client_id\": \"$CLIENT_ID\",
    \"client_secret\": \"$CLIENT_SECRET\",
    \"refresh_token\": \"$REFRESH_TOKEN\"
  }"
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "read_products read_orders"
}
```

## 🧪 Error Testing

### Test Invalid Token

```bash
curl -H "Authorization: Bearer invalid_token_123" \
  http://localhost:3000/api/v1/merchants/merchant_123/profile
```

**Expected Response:**
```json
{
  "error": "invalid_token",
  "error_description": "Invalid or expired access token"
}
```

### Test Missing Authorization Header

```bash
curl http://localhost:3000/api/v1/merchants/merchant_123/profile
```

**Expected Response:**
```json
{
  "error": "access_denied",
  "error_description": "Missing or invalid authorization header"
}
```

### Test Insufficient Scope

First, create an app with limited scope:

```bash
curl -X POST http://localhost:3000/oauth/apps \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Limited Scope App",
    "redirect_uri": "https://limited-app.com/callback",
    "scopes": ["read_profile"]
  }'
```

Then try to access products with the limited scope token:

```bash
# Use the access token from the limited scope app
LIMITED_ACCESS_TOKEN="limited_scope_token_here"

curl -H "Authorization: Bearer $LIMITED_ACCESS_TOKEN" \
  http://localhost:3000/api/v1/merchants/merchant_123/products
```

**Expected Response:**
```json
{
  "error": "insufficient_scope",
  "error_description": "Required scopes: read_products. Available scopes: read_profile"
}
```

### Test Invalid Client Credentials

```bash
curl -X POST http://localhost:3000/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "client_id": "invalid_client_id",
    "client_secret": "invalid_secret",
    "code": "test_code",
    "redirect_uri": "https://myapp.com/callback"
  }'
```

**Expected Response:**
```json
{
  "error": "invalid_client",
  "error_description": "Invalid client_secret"
}
```

## 📊 Complete Test Script

For convenience, you can use the provided test script:

```bash
# Make sure the script is executable
chmod +x test-oauth-flow.sh

# Run the complete test
./test-oauth-flow.sh
```

This script will:
1. Register a test application
2. Generate authorization URLs
3. Simulate the OAuth flow
4. Test all API endpoints
5. Test error conditions
6. Test scope validation
7. Provide a summary of results

## 🔧 Troubleshooting

### Common Issues

1. **Server not running**
   ```bash
   # Check if server is running
   curl http://localhost:3000/health
   ```

2. **Invalid JSON in request body**
   - Make sure to properly escape quotes in bash
   - Use single quotes around the entire JSON object

3. **Token expired**
   - Use the refresh token to get a new access token
   - Check the `expires_in` field in the token response

4. **CORS issues**
   - The API includes CORS headers for development
   - For production, configure allowed origins

### Debug Mode

Enable debug logging by setting the environment variable:

```bash
export DEBUG=bitcommerce:*
npm run dev
```

### Rate Limiting

If you hit rate limits (100 requests per 15 minutes), wait and try again:

```bash
# Check rate limit headers
curl -I http://localhost:3000/api/v1/merchants/merchant_123/profile
```

## 📚 Additional Resources

- **Swagger Documentation**: `swagger.yaml` (can be viewed with Swagger UI)
- **API Documentation**: `API_DOCUMENTATION.md`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`
- **Demo Script**: `demo/oauth-flow.js`

## 🎯 Next Steps

After testing with curl:

1. **Implement in your application** using the same flow
2. **Handle token refresh** automatically
3. **Add proper error handling** for expired tokens
4. **Implement secure storage** for client credentials
5. **Add PKCE support** for enhanced security (production)

Happy testing! 🚀 