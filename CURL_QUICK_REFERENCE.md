# BitCommerce OAuth API - Curl Quick Reference

## 🚀 Essential Commands

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Register App
```bash
curl -X POST http://localhost:3000/oauth/apps \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test App",
    "redirect_uri": "https://testapp.com/callback",
    "scopes": ["read_products", "read_orders"]
  }'
```

### 3. Get Authorization URL
```bash
# Replace CLIENT_ID with your actual client_id
echo "http://localhost:3000/oauth/authorize?client_id=CLIENT_ID&redirect_uri=https://testapp.com/callback&scope=read_products&response_type=code"
```

### 4. Exchange Code for Tokens
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

### 5. Access Merchant Data
```bash
# Profile
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:3000/api/v1/merchants/merchant_123/profile

# Products
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:3000/api/v1/merchants/merchant_123/products

# Orders
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:3000/api/v1/merchants/merchant_123/orders

# Summary
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:3000/api/v1/merchants/merchant_123/summary
```

### 6. Refresh Token
```bash
curl -X POST http://localhost:3000/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "refresh_token",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

## 🧪 Error Testing

### Invalid Token
```bash
curl -H "Authorization: Bearer invalid_token" \
  http://localhost:3000/api/v1/merchants/merchant_123/profile
```

### Missing Authorization
```bash
curl http://localhost:3000/api/v1/merchants/merchant_123/profile
```

### Invalid Client Credentials
```bash
curl -X POST http://localhost:3000/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "client_id": "invalid",
    "client_secret": "invalid",
    "code": "invalid",
    "redirect_uri": "https://testapp.com/callback"
  }'
```

## 📋 Complete Flow Example

```bash
# 1. Register app
RESPONSE=$(curl -s -X POST http://localhost:3000/oauth/apps \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Quick Test App",
    "redirect_uri": "https://testapp.com/callback",
    "scopes": ["read_products", "read_orders"]
  }')

# 2. Extract client_id (requires jq or manual extraction)
CLIENT_ID=$(echo $RESPONSE | grep -o '"client_id":"[^"]*"' | cut -d'"' -f4)
echo "Client ID: $CLIENT_ID"

# 3. Generate auth URL
echo "Auth URL: http://localhost:3000/oauth/authorize?client_id=$CLIENT_ID&redirect_uri=https://testapp.com/callback&scope=read_products&response_type=code"

# 4. Simulate auth code (for testing)
AUTH_CODE="test_code_$(date +%s)"

# 5. Exchange for tokens
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3000/oauth/token \
  -H "Content-Type: application/json" \
  -d "{
    \"grant_type\": \"authorization_code\",
    \"client_id\": \"$CLIENT_ID\",
    \"client_secret\": \"$(echo $RESPONSE | grep -o '"client_secret":"[^"]*"' | cut -d'"' -f4)\",
    \"code\": \"$AUTH_CODE\",
    \"redirect_uri\": \"https://testapp.com/callback\"
  }")

# 6. Extract access token
ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

# 7. Access merchant data
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:3000/api/v1/merchants/merchant_123/products
```

## 🔧 Useful Options

### Pretty Print JSON
```bash
curl -s http://localhost:3000/health | python -m json.tool
# or with jq
curl -s http://localhost:3000/health | jq .
```

### Show Headers
```bash
curl -I http://localhost:3000/health
```

### Verbose Output
```bash
curl -v http://localhost:3000/health
```

### Save Response to File
```bash
curl -s http://localhost:3000/health > response.json
```

## 📊 Environment Variables

Set these for easier testing:

```bash
export API_BASE="http://localhost:3000"
export CLIENT_ID="your_client_id"
export CLIENT_SECRET="your_client_secret"
export ACCESS_TOKEN="your_access_token"

# Then use them in commands:
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  $API_BASE/api/v1/merchants/merchant_123/products
```

## 🎯 Quick Test Commands

### Test All Endpoints
```bash
# Health
curl $API_BASE/health

# Register app
curl -X POST $API_BASE/oauth/apps -H "Content-Type: application/json" -d '{"name":"Test","redirect_uri":"https://test.com/callback","scopes":["read_products"]}'

# List apps
curl $API_BASE/oauth/apps

# Test protected endpoint (will fail without token)
curl $API_BASE/api/v1/merchants/merchant_123/profile
```

### Test Error Handling
```bash
# 404
curl $API_BASE/nonexistent

# Invalid token
curl -H "Authorization: Bearer invalid" $API_BASE/api/v1/merchants/merchant_123/profile

# Rate limiting (make 100+ requests quickly)
for i in {1..105}; do curl -s $API_BASE/health > /dev/null; done
curl $API_BASE/health
```

## 📚 Full Documentation

- **Complete Guide**: `CURL_TESTING_GUIDE.md`
- **Swagger Spec**: `swagger.yaml`
- **API Docs**: `API_DOCUMENTATION.md`
- **Test Script**: `./test-oauth-flow.sh`

## 🚀 Quick Start

```bash
# 1. Start server
npm run dev

# 2. Run automated tests
npm run test:curl

# 3. Or test manually with the commands above
``` 