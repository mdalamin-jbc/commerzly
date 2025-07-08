// In-memory database for POC
// In production, replace with MongoDB, PostgreSQL, or Redis

class InMemoryDB {
  constructor() {
    this.apps = new Map();
    this.merchants = new Map();
    this.authorizationCodes = new Map();
    this.accessTokens = new Map();
    this.refreshTokens = new Map();
    this.products = new Map();
    this.orders = new Map();
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  initializeSampleData() {
    // Sample merchant
    this.merchants.set('merchant_123', {
      id: 'merchant_123',
      name: 'Sample Store',
      email: 'merchant@samplestore.com',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Sample products
    this.products.set('product_1', {
      id: 'product_1',
      merchant_id: 'merchant_123',
      name: 'Sample Product 1',
      price: 29.99,
      description: 'A sample product for testing',
      status: 'active',
      created_at: new Date().toISOString()
    });

    this.products.set('product_2', {
      id: 'product_2',
      merchant_id: 'merchant_123',
      name: 'Sample Product 2',
      price: 49.99,
      description: 'Another sample product',
      status: 'active',
      created_at: new Date().toISOString()
    });

    // Sample orders
    this.orders.set('order_1', {
      id: 'order_1',
      merchant_id: 'merchant_123',
      customer_email: 'customer@example.com',
      total: 79.98,
      status: 'completed',
      items: [
        { product_id: 'product_1', quantity: 1, price: 29.99 },
        { product_id: 'product_2', quantity: 1, price: 49.99 }
      ],
      created_at: new Date().toISOString()
    });

    // Sample registered app
    this.apps.set('app_123', {
      app_id: 'app_123',
      client_id: 'client_xyz123',
      client_secret: 'secret_abc456',
      name: 'Sample App',
      redirect_uri: 'https://sampleapp.com/callback',
      scopes: ['read_products', 'read_orders'],
      status: 'active',
      created_at: new Date().toISOString()
    });
  }

  // App management
  createApp(appData) {
    const app_id = `app_${Date.now()}`;
    const client_id = `client_${Math.random().toString(36).substr(2, 9)}`;
    const client_secret = `secret_${Math.random().toString(36).substr(2, 15)}`;
    
    const app = {
      app_id,
      client_id,
      client_secret,
      ...appData,
      status: 'active',
      created_at: new Date().toISOString()
    };
    
    this.apps.set(app_id, app);
    return app;
  }

  getAppByClientId(client_id) {
    for (const app of this.apps.values()) {
      if (app.client_id === client_id) {
        return app;
      }
    }
    return null;
  }

  getApp(app_id) {
    return this.apps.get(app_id);
  }

  getAllApps() {
    return Array.from(this.apps.values());
  }

  // Authorization code management
  createAuthorizationCode(code, data) {
    this.authorizationCodes.set(code, {
      ...data,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
    });
  }

  getAuthorizationCode(code) {
    const authCode = this.authorizationCodes.get(code);
    if (!authCode) return null;
    
    // Check if expired
    if (new Date() > new Date(authCode.expires_at)) {
      this.authorizationCodes.delete(code);
      return null;
    }
    
    return authCode;
  }

  deleteAuthorizationCode(code) {
    this.authorizationCodes.delete(code);
  }

  // Token management
  createAccessToken(token, data) {
    this.accessTokens.set(token, {
      ...data,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
    });
  }

  getAccessToken(token) {
    const accessToken = this.accessTokens.get(token);
    if (!accessToken) return null;
    
    // Check if expired
    if (new Date() > new Date(accessToken.expires_at)) {
      this.accessTokens.delete(token);
      return null;
    }
    
    return accessToken;
  }

  createRefreshToken(token, data) {
    this.refreshTokens.set(token, {
      ...data,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    });
  }

  getRefreshToken(token) {
    const refreshToken = this.refreshTokens.get(token);
    if (!refreshToken) return null;
    
    // Check if expired
    if (new Date() > new Date(refreshToken.expires_at)) {
      this.refreshTokens.delete(token);
      return null;
    }
    
    return refreshToken;
  }

  deleteRefreshToken(token) {
    this.refreshTokens.delete(token);
  }

  // Merchant data
  getMerchant(merchant_id) {
    return this.merchants.get(merchant_id);
  }

  getMerchantProducts(merchant_id) {
    return Array.from(this.products.values())
      .filter(product => product.merchant_id === merchant_id);
  }

  getMerchantOrders(merchant_id) {
    return Array.from(this.orders.values())
      .filter(order => order.merchant_id === merchant_id);
  }

  // Utility methods
  clear() {
    this.apps.clear();
    this.authorizationCodes.clear();
    this.accessTokens.clear();
    this.refreshTokens.clear();
    this.initializeSampleData();
  }
}

// Export singleton instance
const db = new InMemoryDB();
module.exports = db; 