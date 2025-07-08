const db = require('./src/config/database');
const JWTUtils = require('./src/utils/jwt');

console.log('=== COMPLETE OAUTH FLOW TEST ===');

// Step 1: Register app
console.log('\n1. Registering app...');
const app = db.createApp({
  name: 'Product Access App',
  redirect_uri: 'https://productaccess.com/callback',
  scopes: ['read_products']
});
console.log('App created:', {
  client_id: app.client_id,
  client_secret: app.client_secret,
  name: app.name
});

// Step 2: Create authorization code
console.log('\n2. Creating authorization code...');
const authCode = JWTUtils.generateAuthorizationCode();
db.createAuthorizationCode(authCode, {
  client_id: app.client_id,
  redirect_uri: app.redirect_uri,
  scope: 'read_products',
  merchant_id: 'merchant_123',
  state: 'test_state'
});
console.log('Auth code created:', authCode);

// Step 3: Verify auth code exists
console.log('\n3. Verifying auth code...');
const storedAuthCode = db.getAuthorizationCode(authCode);
console.log('Auth code exists:', !!storedAuthCode);
if (storedAuthCode) {
  console.log('Auth code data:', {
    client_id: storedAuthCode.client_id,
    redirect_uri: storedAuthCode.redirect_uri,
    scope: storedAuthCode.scope
  });
}

// Step 4: Simulate token exchange (direct database access)
console.log('\n4. Simulating token exchange...');
if (storedAuthCode) {
  // Generate access token
  const accessToken = JWTUtils.generateAccessToken({
    merchant_id: storedAuthCode.merchant_id,
    app_id: app.app_id,
    scopes: storedAuthCode.scope.split(' ').filter(s => s),
    client_id: app.client_id
  });

  // Store access token
  db.createAccessToken(accessToken, {
    merchant_id: storedAuthCode.merchant_id,
    app_id: app.app_id,
    scopes: storedAuthCode.scope.split(' ').filter(s => s),
    client_id: app.client_id
  });

  console.log('Access token generated:', accessToken.substring(0, 20) + '...');
  console.log('Token stored in database');

  // Step 5: Test accessing products with the token
  console.log('\n5. Testing product access...');
  const tokenData = db.getAccessToken(accessToken);
  if (tokenData) {
    console.log('✅ Token is valid!');
    console.log('Token scopes:', tokenData.scopes);
    console.log('Merchant ID:', tokenData.merchant_id);
    
    // Get merchant products
    const products = db.getMerchantProducts(tokenData.merchant_id);
    console.log('\n📦 MERCHANT PRODUCTS:');
    products.forEach(product => {
      console.log(`- ${product.name}: $${product.price} (${product.description})`);
    });
    
    console.log('\n🎉 SUCCESS! App can now access merchant products!');
  } else {
    console.log('❌ Token not found in database');
  }
} else {
  console.log('❌ Auth code not found');
}

console.log('\n=== END TEST ==='); 