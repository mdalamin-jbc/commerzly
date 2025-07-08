#!/usr/bin/env node

/**
 * BitCommerce OAuth 2.0 Flow Demo
 * 
 * This script demonstrates the complete OAuth 2.0 Authorization Code Flow:
 * 1. Register a new OAuth application
 * 2. Start authorization flow
 * 3. Exchange authorization code for tokens
 * 4. Use access token to access merchant APIs
 * 5. Refresh access token
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000';
const DEMO_APP = {
  name: 'Demo Integration App',
  redirect_uri: 'https://demo-app.com/callback',
  scopes: ['read_products', 'read_orders', 'read_profile']
};

class OAuthDemo {
  constructor() {
    this.clientId = null;
    this.clientSecret = null;
    this.accessToken = null;
    this.refreshToken = null;
  }

  async run() {
    console.log('🚀 Starting BitCommerce OAuth 2.0 Flow Demo\n');
    
    try {
      // Step 1: Register OAuth application
      await this.registerApp();
      
      // Step 2: Simulate authorization flow
      await this.simulateAuthorization();
      
      // Step 3: Exchange code for tokens
      await this.exchangeCodeForTokens();
      
      // Step 4: Access merchant APIs
      await this.accessMerchantAPIs();
      
      // Step 5: Refresh token
      await this.refreshAccessToken();
      
      console.log('\n✅ OAuth Flow Demo Completed Successfully!');
      
    } catch (error) {
      console.error('\n❌ Demo failed:', error.message);
      if (error.response) {
        console.error('Response:', error.response.data);
      }
    }
  }

  async registerApp() {
    console.log('📝 Step 1: Registering OAuth Application...');
    
    const response = await axios.post(`${API_BASE}/oauth/apps`, DEMO_APP);
    
    this.clientId = response.data.app.client_id;
    this.clientSecret = response.data.app.client_secret;
    
    console.log('✅ Application registered successfully!');
    console.log(`   Client ID: ${this.clientId}`);
    console.log(`   Client Secret: ${this.clientSecret}`);
    console.log(`   App ID: ${response.data.app.app_id}\n`);
  }

  async simulateAuthorization() {
    console.log('🔐 Step 2: Simulating Authorization Flow...');
    
    // In a real scenario, this would redirect the user to the authorization page
    // For demo purposes, we'll simulate the authorization code generation
    
    const authUrl = `${API_BASE}/oauth/authorize?` + new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: DEMO_APP.redirect_uri,
      scope: DEMO_APP.scopes.join(' '),
      response_type: 'code',
      state: 'demo-state-123'
    });
    
    console.log(`   Authorization URL: ${authUrl}`);
    console.log('   (In real scenario, user would be redirected here to login and approve)');
    
    // For demo, we'll simulate getting an authorization code
    // In production, this would come from the redirect after user approval
    this.authCode = 'demo-auth-code-' + Date.now();
    
    console.log(`   Simulated Auth Code: ${this.authCode}\n`);
  }

  async exchangeCodeForTokens() {
    console.log('🔄 Step 3: Exchanging Authorization Code for Tokens...');
    
    const tokenData = {
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code: this.authCode,
      redirect_uri: DEMO_APP.redirect_uri
    };
    
    const response = await axios.post(`${API_BASE}/oauth/token`, tokenData);
    
    this.accessToken = response.data.access_token;
    this.refreshToken = response.data.refresh_token;
    
    console.log('✅ Tokens received successfully!');
    console.log(`   Access Token: ${this.accessToken.substring(0, 20)}...`);
    console.log(`   Refresh Token: ${this.refreshToken.substring(0, 20)}...`);
    console.log(`   Expires In: ${response.data.expires_in} seconds`);
    console.log(`   Scope: ${response.data.scope}\n`);
  }

  async accessMerchantAPIs() {
    console.log('🏪 Step 4: Accessing Merchant APIs...');
    
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`
    };
    
    // Test merchant profile
    console.log('   📋 Fetching merchant profile...');
    try {
      const profileResponse = await axios.get(
        `${API_BASE}/api/v1/merchants/merchant_123/profile`,
        { headers }
      );
      console.log('   ✅ Profile:', profileResponse.data.name);
    } catch (error) {
      console.log('   ❌ Profile access failed:', error.response?.data?.error_description);
    }
    
    // Test merchant products
    console.log('   📦 Fetching merchant products...');
    try {
      const productsResponse = await axios.get(
        `${API_BASE}/api/v1/merchants/merchant_123/products`,
        { headers }
      );
      console.log(`   ✅ Products: ${productsResponse.data.total} found`);
      productsResponse.data.products.forEach(product => {
        console.log(`      - ${product.name}: $${product.price}`);
      });
    } catch (error) {
      console.log('   ❌ Products access failed:', error.response?.data?.error_description);
    }
    
    // Test merchant orders
    console.log('   📋 Fetching merchant orders...');
    try {
      const ordersResponse = await axios.get(
        `${API_BASE}/api/v1/merchants/merchant_123/orders`,
        { headers }
      );
      console.log(`   ✅ Orders: ${ordersResponse.data.total} found`);
      ordersResponse.data.orders.forEach(order => {
        console.log(`      - Order ${order.id}: $${order.total} (${order.status})`);
      });
    } catch (error) {
      console.log('   ❌ Orders access failed:', error.response?.data?.error_description);
    }
    
    // Test merchant summary
    console.log('   📊 Fetching merchant summary...');
    try {
      const summaryResponse = await axios.get(
        `${API_BASE}/api/v1/merchants/merchant_123/summary`,
        { headers }
      );
      console.log('   ✅ Summary:', summaryResponse.data);
    } catch (error) {
      console.log('   ❌ Summary access failed:', error.response?.data?.error_description);
    }
    
    console.log('');
  }

  async refreshAccessToken() {
    console.log('🔄 Step 5: Refreshing Access Token...');
    
    const refreshData = {
      grant_type: 'refresh_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: this.refreshToken
    };
    
    const response = await axios.post(`${API_BASE}/oauth/token`, refreshData);
    
    this.accessToken = response.data.access_token;
    
    console.log('✅ Access token refreshed successfully!');
    console.log(`   New Access Token: ${this.accessToken.substring(0, 20)}...`);
    console.log(`   Expires In: ${response.data.expires_in} seconds\n`);
  }

  async testInvalidToken() {
    console.log('🧪 Testing Invalid Token Handling...');
    
    const invalidToken = 'invalid-token-123';
    const headers = {
      'Authorization': `Bearer ${invalidToken}`
    };
    
    try {
      await axios.get(`${API_BASE}/api/v1/merchants/merchant_123/profile`, { headers });
    } catch (error) {
      console.log('   ✅ Invalid token properly rejected:', error.response.data.error);
    }
    
    console.log('');
  }

  async testInsufficientScope() {
    console.log('🧪 Testing Scope Validation...');
    
    // Create an app with limited scope
    const limitedApp = {
      name: 'Limited Scope App',
      redirect_uri: 'https://limited-app.com/callback',
      scopes: ['read_profile'] // Only profile access, no products/orders
    };
    
    const appResponse = await axios.post(`${API_BASE}/oauth/apps`, limitedApp);
    const limitedClientId = appResponse.data.app.client_id;
    const limitedClientSecret = appResponse.data.app.client_secret;
    
    // Simulate getting tokens with limited scope
    const limitedAuthCode = 'limited-auth-code-' + Date.now();
    
    const tokenData = {
      grant_type: 'authorization_code',
      client_id: limitedClientId,
      client_secret: limitedClientSecret,
      code: limitedAuthCode,
      redirect_uri: limitedApp.redirect_uri
    };
    
    const tokenResponse = await axios.post(`${API_BASE}/oauth/token`, tokenData);
    const limitedAccessToken = tokenResponse.data.access_token;
    
    // Try to access products with limited scope
    const headers = {
      'Authorization': `Bearer ${limitedAccessToken}`
    };
    
    try {
      await axios.get(`${API_BASE}/api/v1/merchants/merchant_123/products`, { headers });
    } catch (error) {
      console.log('   ✅ Scope validation working:', error.response.data.error);
      console.log('   ✅ Error description:', error.response.data.error_description);
    }
    
    console.log('');
  }
}

// Run the demo
if (require.main === module) {
  const demo = new OAuthDemo();
  demo.run().catch(console.error);
}

module.exports = OAuthDemo; 