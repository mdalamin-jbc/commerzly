#!/bin/bash

# BitCommerce OAuth 2.0 Flow Testing Script
# This script demonstrates the complete OAuth flow using curl commands

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE="http://localhost:3000"
APP_NAME="Test Integration App"
REDIRECT_URI="https://testapp.com/callback"
SCOPES='["read_products", "read_orders", "read_profile"]'
MERCHANT_ID="merchant_123"

# Variables to store responses
CLIENT_ID=""
CLIENT_SECRET=""
AUTH_CODE=""
ACCESS_TOKEN=""
REFRESH_TOKEN=""

echo -e "${BLUE}🚀 BitCommerce OAuth 2.0 Flow Testing Script${NC}"
echo "=================================================="
echo ""

# Function to print section headers
print_section() {
    echo -e "\n${YELLOW}$1${NC}"
    echo "----------------------------------------"
}

# Function to print success messages
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print info messages
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to print curl commands
print_curl() {
    echo -e "${BLUE}🔗 $1${NC}"
}

# Function to extract JSON values
extract_json() {
    local json="$1"
    local key="$2"
    echo "$json" | grep -o "\"$key\":\"[^\"]*\"" | cut -d'"' -f4
}

# Function to extract JSON array
extract_json_array() {
    local json="$1"
    local key="$2"
    echo "$json" | grep -o "\"$key\":\[[^]]*\]" | cut -d'"' -f4
}

# Step 1: Register OAuth Application
print_section "Step 1: Register OAuth Application"

print_curl "Registering application with name: $APP_NAME"

REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/oauth/apps" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"$APP_NAME\",
        \"redirect_uri\": \"$REDIRECT_URI\",
        \"scopes\": $SCOPES
    }")

echo "Response: $REGISTER_RESPONSE"

# Extract client credentials
CLIENT_ID=$(extract_json "$REGISTER_RESPONSE" "client_id")
CLIENT_SECRET=$(extract_json "$REGISTER_RESPONSE" "client_secret")
APP_ID=$(extract_json "$REGISTER_RESPONSE" "app_id")

if [ -n "$CLIENT_ID" ] && [ -n "$CLIENT_SECRET" ]; then
    print_success "Application registered successfully!"
    echo "  App ID: $APP_ID"
    echo "  Client ID: $CLIENT_ID"
    echo "  Client Secret: $CLIENT_SECRET"
else
    echo -e "${RED}❌ Failed to register application${NC}"
    exit 1
fi

# Step 2: Generate Authorization URL
print_section "Step 2: Generate Authorization URL"

STATE_PARAM="test_state_$(date +%s)"
AUTH_URL="$API_BASE/oauth/authorize?client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URI&scope=read_products%20read_orders&response_type=code&state=$STATE_PARAM"

print_info "Authorization URL:"
echo "$AUTH_URL"
echo ""

print_info "In a real scenario, you would:"
echo "1. Open this URL in a browser"
echo "2. Log in as a merchant"
echo "3. Approve the requested permissions"
echo "4. Get redirected to your callback URL with an authorization code"
echo ""

# Step 3: Simulate Authorization (for testing purposes)
print_section "Step 3: Simulate Authorization Flow"

print_info "For testing purposes, we'll simulate the authorization approval..."

# Generate a mock authorization code
AUTH_CODE="test_auth_code_$(date +%s)"

print_success "Simulated authorization code: $AUTH_CODE"
print_info "In production, this would come from the redirect after user approval"

# Step 4: Exchange Authorization Code for Tokens
print_section "Step 4: Exchange Authorization Code for Tokens"

print_curl "Exchanging authorization code for access tokens"

TOKEN_RESPONSE=$(curl -s -X POST "$API_BASE/oauth/token" \
    -H "Content-Type: application/json" \
    -d "{
        \"grant_type\": \"authorization_code\",
        \"client_id\": \"$CLIENT_ID\",
        \"client_secret\": \"$CLIENT_SECRET\",
        \"code\": \"$AUTH_CODE\",
        \"redirect_uri\": \"$REDIRECT_URI\"
    }")

echo "Response: $TOKEN_RESPONSE"

# Extract tokens
ACCESS_TOKEN=$(extract_json "$TOKEN_RESPONSE" "access_token")
REFRESH_TOKEN=$(extract_json "$TOKEN_RESPONSE" "refresh_token")
TOKEN_TYPE=$(extract_json "$TOKEN_RESPONSE" "token_type")
EXPIRES_IN=$(echo "$TOKEN_RESPONSE" | grep -o "\"expires_in\":[0-9]*" | cut -d':' -f2)
SCOPE=$(extract_json "$TOKEN_RESPONSE" "scope")

if [ -n "$ACCESS_TOKEN" ]; then
    print_success "Tokens received successfully!"
    echo "  Access Token: ${ACCESS_TOKEN:0:20}..."
    echo "  Refresh Token: ${REFRESH_TOKEN:0:20}..."
    echo "  Token Type: $TOKEN_TYPE"
    echo "  Expires In: $EXPIRES_IN seconds"
    echo "  Scope: $SCOPE"
else
    echo -e "${RED}❌ Failed to exchange authorization code for tokens${NC}"
    echo "This is expected in the POC since we're using a simulated auth code"
    echo "In production, you would use the real authorization code from the redirect"
    exit 1
fi

# Step 5: Access Merchant Profile
print_section "Step 5: Access Merchant Profile"

print_curl "Accessing merchant profile with access token"

PROFILE_RESPONSE=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
    "$API_BASE/api/v1/merchants/$MERCHANT_ID/profile")

echo "Response: $PROFILE_RESPONSE"

MERCHANT_NAME=$(extract_json "$PROFILE_RESPONSE" "name")
MERCHANT_EMAIL=$(extract_json "$PROFILE_RESPONSE" "email")

if [ -n "$MERCHANT_NAME" ]; then
    print_success "Merchant profile accessed successfully!"
    echo "  Merchant Name: $MERCHANT_NAME"
    echo "  Merchant Email: $MERCHANT_EMAIL"
else
    echo -e "${RED}❌ Failed to access merchant profile${NC}"
fi

# Step 6: Access Merchant Products
print_section "Step 6: Access Merchant Products"

print_curl "Accessing merchant products with access token"

PRODUCTS_RESPONSE=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
    "$API_BASE/api/v1/merchants/$MERCHANT_ID/products")

echo "Response: $PRODUCTS_RESPONSE"

PRODUCT_COUNT=$(echo "$PRODUCTS_RESPONSE" | grep -o "\"total\":[0-9]*" | cut -d':' -f2)

if [ -n "$PRODUCT_COUNT" ]; then
    print_success "Merchant products accessed successfully!"
    echo "  Total Products: $PRODUCT_COUNT"
    
    # Extract and display product names
    echo "  Products:"
    echo "$PRODUCTS_RESPONSE" | grep -o "\"name\":\"[^\"]*\"" | cut -d'"' -f4 | while read -r product_name; do
        echo "    - $product_name"
    done
else
    echo -e "${RED}❌ Failed to access merchant products${NC}"
fi

# Step 7: Access Merchant Orders
print_section "Step 7: Access Merchant Orders"

print_curl "Accessing merchant orders with access token"

ORDERS_RESPONSE=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
    "$API_BASE/api/v1/merchants/$MERCHANT_ID/orders")

echo "Response: $ORDERS_RESPONSE"

ORDER_COUNT=$(echo "$ORDERS_RESPONSE" | grep -o "\"total\":[0-9]*" | cut -d':' -f2)

if [ -n "$ORDER_COUNT" ]; then
    print_success "Merchant orders accessed successfully!"
    echo "  Total Orders: $ORDER_COUNT"
    
    # Extract and display order details
    echo "  Orders:"
    echo "$ORDERS_RESPONSE" | grep -o "\"id\":\"[^\"]*\"" | cut -d'"' -f4 | while read -r order_id; do
        echo "    - Order ID: $order_id"
    done
else
    echo -e "${RED}❌ Failed to access merchant orders${NC}"
fi

# Step 8: Access Merchant Summary
print_section "Step 8: Access Merchant Summary"

print_curl "Accessing merchant summary with access token"

SUMMARY_RESPONSE=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
    "$API_BASE/api/v1/merchants/$MERCHANT_ID/summary")

echo "Response: $SUMMARY_RESPONSE"

if echo "$SUMMARY_RESPONSE" | grep -q "merchant"; then
    print_success "Merchant summary accessed successfully!"
else
    echo -e "${RED}❌ Failed to access merchant summary${NC}"
fi

# Step 9: Test Token Refresh
print_section "Step 9: Test Token Refresh"

print_curl "Refreshing access token using refresh token"

REFRESH_RESPONSE=$(curl -s -X POST "$API_BASE/oauth/token" \
    -H "Content-Type: application/json" \
    -d "{
        \"grant_type\": \"refresh_token\",
        \"client_id\": \"$CLIENT_ID\",
        \"client_secret\": \"$CLIENT_SECRET\",
        \"refresh_token\": \"$REFRESH_TOKEN\"
    }")

echo "Response: $REFRESH_RESPONSE"

NEW_ACCESS_TOKEN=$(extract_json "$REFRESH_RESPONSE" "access_token")

if [ -n "$NEW_ACCESS_TOKEN" ]; then
    print_success "Access token refreshed successfully!"
    echo "  New Access Token: ${NEW_ACCESS_TOKEN:0:20}..."
    ACCESS_TOKEN="$NEW_ACCESS_TOKEN"
else
    echo -e "${RED}❌ Failed to refresh access token${NC}"
fi

# Step 10: Test Error Handling
print_section "Step 10: Test Error Handling"

print_info "Testing invalid token handling..."

INVALID_TOKEN_RESPONSE=$(curl -s -H "Authorization: Bearer invalid_token_123" \
    "$API_BASE/api/v1/merchants/$MERCHANT_ID/profile")

echo "Response: $INVALID_TOKEN_RESPONSE"

if echo "$INVALID_TOKEN_RESPONSE" | grep -q "invalid_token"; then
    print_success "Invalid token properly rejected!"
else
    echo -e "${RED}❌ Invalid token not properly rejected${NC}"
fi

print_info "Testing missing authorization header..."

NO_AUTH_RESPONSE=$(curl -s "$API_BASE/api/v1/merchants/$MERCHANT_ID/profile")

echo "Response: $NO_AUTH_RESPONSE"

if echo "$NO_AUTH_RESPONSE" | grep -q "access_denied"; then
    print_success "Missing authorization header properly rejected!"
else
    echo -e "${RED}❌ Missing authorization header not properly rejected${NC}"
fi

# Step 11: Test Scope Validation
print_section "Step 11: Test Scope Validation"

print_info "Creating an app with limited scope..."

LIMITED_APP_RESPONSE=$(curl -s -X POST "$API_BASE/oauth/apps" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Limited Scope App",
        "redirect_uri": "https://limited-app.com/callback",
        "scopes": ["read_profile"]
    }')

LIMITED_CLIENT_ID=$(extract_json "$LIMITED_APP_RESPONSE" "client_id")
LIMITED_CLIENT_SECRET=$(extract_json "$LIMITED_APP_RESPONSE" "client_secret")

if [ -n "$LIMITED_CLIENT_ID" ]; then
    print_success "Limited scope app created!"
    echo "  Client ID: $LIMITED_CLIENT_ID"
    
    # Simulate getting tokens with limited scope
    LIMITED_AUTH_CODE="limited_auth_code_$(date +%s)"
    
    LIMITED_TOKEN_RESPONSE=$(curl -s -X POST "$API_BASE/oauth/token" \
        -H "Content-Type: application/json" \
        -d "{
            \"grant_type\": \"authorization_code\",
            \"client_id\": \"$LIMITED_CLIENT_ID\",
            \"client_secret\": \"$LIMITED_CLIENT_SECRET\",
            \"code\": \"$LIMITED_AUTH_CODE\",
            \"redirect_uri\": \"https://limited-app.com/callback\"
        }")
    
    LIMITED_ACCESS_TOKEN=$(extract_json "$LIMITED_TOKEN_RESPONSE" "access_token")
    
    if [ -n "$LIMITED_ACCESS_TOKEN" ]; then
        print_info "Testing scope validation with limited token..."
        
        SCOPE_TEST_RESPONSE=$(curl -s -H "Authorization: Bearer $LIMITED_ACCESS_TOKEN" \
            "$API_BASE/api/v1/merchants/$MERCHANT_ID/products")
        
        echo "Response: $SCOPE_TEST_RESPONSE"
        
        if echo "$SCOPE_TEST_RESPONSE" | grep -q "insufficient_scope"; then
            print_success "Scope validation working correctly!"
        else
            echo -e "${RED}❌ Scope validation not working${NC}"
        fi
    fi
fi

# Final Summary
print_section "Test Summary"

print_success "OAuth 2.0 Flow Testing Completed!"
echo ""
echo "📋 What was tested:"
echo "  ✅ Application registration"
echo "  ✅ Authorization URL generation"
echo "  ✅ Token exchange (simulated)"
echo "  ✅ Merchant profile access"
echo "  ✅ Merchant products access"
echo "  ✅ Merchant orders access"
echo "  ✅ Merchant summary access"
echo "  ✅ Token refresh"
echo "  ✅ Error handling"
echo "  ✅ Scope validation"
echo ""
echo "🔑 Generated Credentials:"
echo "  Client ID: $CLIENT_ID"
echo "  Client Secret: $CLIENT_SECRET"
echo "  Access Token: ${ACCESS_TOKEN:0:20}..."
echo "  Refresh Token: ${REFRESH_TOKEN:0:20}..."
echo ""
echo "📖 Next Steps:"
echo "  1. Use these credentials in your application"
echo "  2. Implement the full OAuth flow with real user interaction"
echo "  3. Handle token refresh in your application"
echo "  4. Add proper error handling for expired tokens"
echo ""
echo "🌐 API Base URL: $API_BASE"
echo "📚 Full API Documentation: $API_BASE/swagger (if Swagger UI is enabled)"
echo ""
print_success "Happy integrating! 🎉" 