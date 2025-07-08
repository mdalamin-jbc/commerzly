const db = require('./src/config/database');

console.log('=== GETTING ACCESS TOKEN ===');

// Get the app
const app = db.getAppByClientId('client_4pe2lbkpb');
if (app) {
  console.log('App found:', app.client_id);
  
  // Get all access tokens for this app
  console.log('\nAccess tokens in database:');
  // Note: In a real implementation, we'd need to iterate through tokens
  // For now, let's create a fresh token and test it
  
  const JWTUtils = require('./src/utils/jwt');
  const accessToken = JWTUtils.generateAccessToken({
    merchant_id: 'merchant_123',
    app_id: app.app_id,
    scopes: ['read_products'],
    client_id: app.client_id
  });
  
  // Store it
  db.createAccessToken(accessToken, {
    merchant_id: 'merchant_123',
    app_id: app.app_id,
    scopes: ['read_products'],
    client_id: app.client_id
  });
  
  console.log('Fresh access token:', accessToken);
  console.log('\nUse this token to test the API:');
  console.log(`curl -H "Authorization: Bearer ${accessToken}" http://localhost:3000/api/v1/merchants/merchant_123/products`);
} else {
  console.log('App not found');
} 