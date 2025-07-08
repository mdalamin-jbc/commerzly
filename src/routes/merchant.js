const express = require('express');
const { param, validationResult } = require('express-validator');
const db = require('../config/database');
const { 
  validateToken, 
  requireScope, 
  requireAnyScope, 
  validateMerchantAccess 
} = require('../middleware/auth');
const { NotFoundError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /api/v1/merchants
 * List all merchants
 * Requires: valid access token
 */
router.get('/', [
  require('../middleware/auth').validateToken
], (req, res) => {
  try {
    // Get all merchants from the in-memory DB
    const merchants = Array.from(require('../config/database').merchants.values()).map(merchant => ({
      id: merchant.id,
      name: merchant.name,
      email: merchant.email,
      status: merchant.status,
      created_at: merchant.created_at,
      updated_at: merchant.updated_at
    }));
    res.json({ merchants, total: merchants.length });
  } catch (error) {
    console.error('List merchants error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error while listing merchants'
    });
  }
});

/**
 * GET /api/v1/merchants/:id/profile
 * Get merchant profile information
 * Requires: read_profile scope
 */
router.get('/:id/profile', [
  param('id').notEmpty().withMessage('Merchant ID is required'),
  validateToken,
  requireScope('read_profile'),
  validateMerchantAccess
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: errors.array()[0].msg
    });
  }

  try {
    const merchantId = req.params.id;
    const merchant = db.getMerchant(merchantId);

    if (!merchant) {
      throw new NotFoundError('Merchant not found');
    }

    // Return merchant profile (excluding sensitive information)
    res.json({
      id: merchant.id,
      name: merchant.name,
      email: merchant.email,
      status: merchant.status,
      created_at: merchant.created_at,
      updated_at: merchant.updated_at
    });
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        error: 'not_found',
        error_description: error.message
      });
    }
    
    console.error('Merchant profile error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error while fetching merchant profile'
    });
  }
});

/**
 * GET /api/v1/merchants/:id/products
 * Get merchant products
 * Requires: read_products scope
 */
router.get('/:id/products', [
  param('id').notEmpty().withMessage('Merchant ID is required'),
  validateToken,
  requireScope('read_products'),
  validateMerchantAccess
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: errors.array()[0].msg
    });
  }

  try {
    const merchantId = req.params.id;
    const merchant = db.getMerchant(merchantId);

    if (!merchant) {
      throw new NotFoundError('Merchant not found');
    }

    const products = db.getMerchantProducts(merchantId);

    res.json({
      merchant: {
        id: merchant.id,
        name: merchant.name
      },
      products,
      total: products.length
    });
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        error: 'not_found',
        error_description: error.message
      });
    }
    
    console.error('Merchant products error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error while fetching merchant products'
    });
  }
});

/**
 * GET /api/v1/merchants/:id/products/:productId
 * Get specific merchant product
 * Requires: read_products scope
 */
router.get('/:id/products/:productId', [
  param('id').notEmpty().withMessage('Merchant ID is required'),
  param('productId').notEmpty().withMessage('Product ID is required'),
  validateToken,
  requireScope('read_products'),
  validateMerchantAccess
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: errors.array()[0].msg
    });
  }

  try {
    const { id: merchantId, productId } = req.params;
    const merchant = db.getMerchant(merchantId);

    if (!merchant) {
      throw new NotFoundError('Merchant not found');
    }

    const products = db.getMerchantProducts(merchantId);
    const product = products.find(p => p.id === productId);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    res.json({
      merchant: {
        id: merchant.id,
        name: merchant.name
      },
      product
    });
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        error: 'not_found',
        error_description: error.message
      });
    }
    
    console.error('Merchant product error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error while fetching product'
    });
  }
});

/**
 * GET /api/v1/merchants/:id/orders
 * Get merchant orders
 * Requires: read_orders scope
 */
router.get('/:id/orders', [
  param('id').notEmpty().withMessage('Merchant ID is required'),
  validateToken,
  requireScope('read_orders'),
  validateMerchantAccess
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: errors.array()[0].msg
    });
  }

  try {
    const merchantId = req.params.id;
    const merchant = db.getMerchant(merchantId);

    if (!merchant) {
      throw new NotFoundError('Merchant not found');
    }

    const orders = db.getMerchantOrders(merchantId);

    res.json({
      merchant: {
        id: merchant.id,
        name: merchant.name
      },
      orders,
      total: orders.length
    });
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        error: 'not_found',
        error_description: error.message
      });
    }
    
    console.error('Merchant orders error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error while fetching merchant orders'
    });
  }
});

/**
 * GET /api/v1/merchants/:id/orders/:orderId
 * Get specific merchant order
 * Requires: read_orders scope
 */
router.get('/:id/orders/:orderId', [
  param('id').notEmpty().withMessage('Merchant ID is required'),
  param('orderId').notEmpty().withMessage('Order ID is required'),
  validateToken,
  requireScope('read_orders'),
  validateMerchantAccess
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: errors.array()[0].msg
    });
  }

  try {
    const { id: merchantId, orderId } = req.params;
    const merchant = db.getMerchant(merchantId);

    if (!merchant) {
      throw new NotFoundError('Merchant not found');
    }

    const orders = db.getMerchantOrders(merchantId);
    const order = orders.find(o => o.id === orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    res.json({
      merchant: {
        id: merchant.id,
        name: merchant.name
      },
      order
    });
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        error: 'not_found',
        error_description: error.message
      });
    }
    
    console.error('Merchant order error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error while fetching order'
    });
  }
});

/**
 * GET /api/v1/merchants/:id/summary
 * Get merchant summary (requires multiple scopes)
 * Requires: read_products OR read_orders scope
 */
router.get('/:id/summary', [
  param('id').notEmpty().withMessage('Merchant ID is required'),
  validateToken,
  requireAnyScope(['read_products', 'read_orders']),
  validateMerchantAccess
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: errors.array()[0].msg
    });
  }

  try {
    const merchantId = req.params.id;
    const merchant = db.getMerchant(merchantId);

    if (!merchant) {
      throw new NotFoundError('Merchant not found');
    }

    const userScopes = req.token.scopes || [];
    const summary = {
      merchant: {
        id: merchant.id,
        name: merchant.name,
        status: merchant.status
      }
    };

    // Include products if user has read_products scope
    if (userScopes.includes('read_products')) {
      const products = db.getMerchantProducts(merchantId);
      summary.products = {
        count: products.length,
        total_value: products.reduce((sum, p) => sum + p.price, 0)
      };
    }

    // Include orders if user has read_orders scope
    if (userScopes.includes('read_orders')) {
      const orders = db.getMerchantOrders(merchantId);
      summary.orders = {
        count: orders.length,
        total_revenue: orders.reduce((sum, o) => sum + o.total, 0)
      };
    }

    res.json(summary);
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        error: 'not_found',
        error_description: error.message
      });
    }
    
    console.error('Merchant summary error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error while fetching merchant summary'
    });
  }
});

/**
 * GET /api/v1/merchants/:id
 * Get merchant information (alias for profile)
 * Requires: read_profile scope
 */
router.get('/:id', [
  param('id').notEmpty().withMessage('Merchant ID is required'),
  validateToken,
  requireScope('read_profile'),
  validateMerchantAccess
], (req, res) => {
  // Redirect to profile endpoint
  req.params.id = req.params.id;
  req.url = `/${req.params.id}/profile`;
  return require('./merchant').get('/:id/profile')(req, res);
});

module.exports = router; 