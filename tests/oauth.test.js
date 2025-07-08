const request = require('supertest');
const app = require('../src/server');
const db = require('../src/config/database');

describe('BitCommerce OAuth API', () => {
  beforeEach(() => {
    // Clear database before each test
    db.clear();
  });

  describe('App Registration', () => {
    it('should register a new OAuth application', async () => {
      const appData = {
        name: 'Test App',
        redirect_uri: 'https://testapp.com/callback',
        scopes: ['read_products', 'read_orders']
      };

      const response = await request(app)
        .post('/oauth/apps')
        .send(appData)
        .expect(201);

      expect(response.body.message).toBe('Application registered successfully');
      expect(response.body.app).toHaveProperty('app_id');
      expect(response.body.app).toHaveProperty('client_id');
      expect(response.body.app).toHaveProperty('client_secret');
      expect(response.body.app.name).toBe(appData.name);
      expect(response.body.app.redirect_uri).toBe(appData.redirect_uri);
      expect(response.body.app.scopes).toEqual(appData.scopes);
    });

    it('should reject app with invalid scopes', async () => {
      const appData = {
        name: 'Test App',
        redirect_uri: 'https://testapp.com/callback',
        scopes: ['invalid_scope', 'read_products']
      };

      const response = await request(app)
        .post('/oauth/apps')
        .send(appData)
        .expect(400);

      expect(response.body.error).toBe('invalid_request');
      expect(response.body.error_description).toContain('Invalid scopes');
    });

    it('should reject app with invalid redirect URI', async () => {
      const appData = {
        name: 'Test App',
        redirect_uri: 'not-a-valid-url',
        scopes: ['read_products']
      };

      const response = await request(app)
        .post('/oauth/apps')
        .send(appData)
        .expect(400);

      expect(response.body.error).toBe('invalid_request');
    });
  });

  describe('OAuth Authorization Flow', () => {
    let testApp;

    beforeEach(async () => {
      // Register a test app
      const appData = {
        name: 'Test App',
        redirect_uri: 'https://testapp.com/callback',
        scopes: ['read_products', 'read_orders']
      };

      const response = await request(app)
        .post('/oauth/apps')
        .send(appData);

      testApp = response.body.app;
    });

    it('should display authorization page', async () => {
      const response = await request(app)
        .get('/oauth/authorize')
        .query({
          client_id: testApp.client_id,
          redirect_uri: testApp.redirect_uri,
          scope: 'read_products',
          response_type: 'code'
        })
        .expect(200);

      expect(response.text).toContain('Authorize Application');
      expect(response.text).toContain(testApp.name);
      expect(response.text).toContain('read_products');
    });

    it('should reject authorization with invalid client_id', async () => {
      const response = await request(app)
        .get('/oauth/authorize')
        .query({
          client_id: 'invalid-client-id',
          redirect_uri: testApp.redirect_uri,
          response_type: 'code'
        })
        .expect(400);

      expect(response.body.error).toBe('invalid_client');
    });

    it('should reject authorization with mismatched redirect_uri', async () => {
      const response = await request(app)
        .get('/oauth/authorize')
        .query({
          client_id: testApp.client_id,
          redirect_uri: 'https://different-app.com/callback',
          response_type: 'code'
        })
        .expect(400);

      expect(response.body.error).toBe('invalid_request');
      expect(response.body.error_description).toContain('Redirect URI mismatch');
    });
  });

  describe('Token Exchange', () => {
    let testApp;
    let authCode;

    beforeEach(async () => {
      // Register a test app
      const appData = {
        name: 'Test App',
        redirect_uri: 'https://testapp.com/callback',
        scopes: ['read_products', 'read_orders']
      };

      const response = await request(app)
        .post('/oauth/apps')
        .send(appData);

      testApp = response.body.app;

      // Create a test authorization code
      authCode = 'test-auth-code-' + Date.now();
      db.createAuthorizationCode(authCode, {
        client_id: testApp.client_id,
        redirect_uri: testApp.redirect_uri,
        scope: 'read_products read_orders',
        merchant_id: 'merchant_123',
        state: 'test-state'
      });
    });

    it('should exchange authorization code for tokens', async () => {
      const tokenData = {
        grant_type: 'authorization_code',
        client_id: testApp.client_id,
        client_secret: testApp.client_secret,
        code: authCode,
        redirect_uri: testApp.redirect_uri
      };

      const response = await request(app)
        .post('/oauth/token')
        .send(tokenData)
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(response.body.token_type).toBe('Bearer');
      expect(response.body.expires_in).toBe(3600);
      expect(response.body.scope).toBe('read_products read_orders');
    });

    it('should reject invalid authorization code', async () => {
      const tokenData = {
        grant_type: 'authorization_code',
        client_id: testApp.client_id,
        client_secret: testApp.client_secret,
        code: 'invalid-code',
        redirect_uri: testApp.redirect_uri
      };

      const response = await request(app)
        .post('/oauth/token')
        .send(tokenData)
        .expect(400);

      expect(response.body.error).toBe('invalid_grant');
    });

    it('should reject invalid client credentials', async () => {
      const tokenData = {
        grant_type: 'authorization_code',
        client_id: testApp.client_id,
        client_secret: 'wrong-secret',
        code: authCode,
        redirect_uri: testApp.redirect_uri
      };

      const response = await request(app)
        .post('/oauth/token')
        .send(tokenData)
        .expect(401);

      expect(response.body.error).toBe('invalid_client');
    });

    it('should refresh access token', async () => {
      // First get tokens
      const tokenData = {
        grant_type: 'authorization_code',
        client_id: testApp.client_id,
        client_secret: testApp.client_secret,
        code: authCode,
        redirect_uri: testApp.redirect_uri
      };

      const tokenResponse = await request(app)
        .post('/oauth/token')
        .send(tokenData);

      const refreshToken = tokenResponse.body.refresh_token;

      // Then refresh
      const refreshData = {
        grant_type: 'refresh_token',
        client_id: testApp.client_id,
        client_secret: testApp.client_secret,
        refresh_token: refreshToken
      };

      const response = await request(app)
        .post('/oauth/token')
        .send(refreshData)
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.token_type).toBe('Bearer');
      expect(response.body.expires_in).toBe(3600);
    });
  });

  describe('Protected API Access', () => {
    let accessToken;

    beforeEach(async () => {
      // Create a test access token
      const JWTUtils = require('../src/utils/jwt');
      accessToken = JWTUtils.generateAccessToken({
        merchant_id: 'merchant_123',
        app_id: 'app_123',
        scopes: ['read_products', 'read_orders', 'read_profile'],
        client_id: 'client_123'
      });

      // Store token in database
      db.createAccessToken(accessToken, {
        merchant_id: 'merchant_123',
        app_id: 'app_123',
        scopes: ['read_products', 'read_orders', 'read_profile'],
        client_id: 'client_123'
      });
    });

    it('should access merchant profile with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/merchants/merchant_123/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', 'merchant_123');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('email');
    });

    it('should access merchant products with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/merchants/merchant_123/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('merchant');
      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('total');
    });

    it('should access merchant orders with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/merchants/merchant_123/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('merchant');
      expect(response.body).toHaveProperty('orders');
      expect(response.body).toHaveProperty('total');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/v1/merchants/merchant_123/profile')
        .expect(401);

      expect(response.body.error).toBe('access_denied');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/merchants/merchant_123/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('invalid_token');
    });

    it('should reject request with insufficient scope', async () => {
      // Create token with limited scope
      const JWTUtils = require('../src/utils/jwt');
      const limitedToken = JWTUtils.generateAccessToken({
        merchant_id: 'merchant_123',
        app_id: 'app_123',
        scopes: ['read_profile'], // No products scope
        client_id: 'client_123'
      });

      db.createAccessToken(limitedToken, {
        merchant_id: 'merchant_123',
        app_id: 'app_123',
        scopes: ['read_profile'],
        client_id: 'client_123'
      });

      const response = await request(app)
        .get('/api/v1/merchants/merchant_123/products')
        .set('Authorization', `Bearer ${limitedToken}`)
        .expect(403);

      expect(response.body.error).toBe('insufficient_scope');
    });

    it('should reject access to different merchant', async () => {
      const response = await request(app)
        .get('/api/v1/merchants/merchant_456/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);

      expect(response.body.error).toBe('access_denied');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('Endpoint not found');
    });

    it('should handle rate limiting', async () => {
      // Make multiple requests to trigger rate limiting
      for (let i = 0; i < 105; i++) {
        await request(app).get('/health');
      }

      const response = await request(app)
        .get('/health')
        .expect(429);

      expect(response.body.error).toBe('Too many requests from this IP, please try again later.');
    });
  });
}); 