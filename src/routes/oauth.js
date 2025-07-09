const express = require('express');
const { body, query, validationResult } = require('express-validator');
const JWTUtils = require('../utils/jwt');
const db = require('../config/database');
const { 
  validateClientCredentials, 
  validateRedirectUri 
} = require('../middleware/auth');
const { ValidationError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /oauth/authorize
 * OAuth 2.0 Authorization endpoint
 * Displays login and consent screen for merchants
 */
router.get('/authorize', [
  query('client_id').notEmpty().withMessage('client_id is required'),
  query('redirect_uri').notEmpty().withMessage('redirect_uri is required'),
  query('scope').optional(),
  query('state').optional(),
  query('response_type').equals('code').withMessage('response_type must be "code"'),
  validateRedirectUri
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: errors.array()[0].msg
    });
  }

  const { client_id, redirect_uri, scope, state } = req.query;
  const app = req.clientApp;

  // Generate state parameter if not provided
  const stateParam = state || JWTUtils.generateState();

  // Render authorization page (in production, this would be a proper HTML page)
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>BitCommerce - Authorize Application</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .app-info { background: #e9ecef; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .scopes { background: #fff3cd; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .buttons { display: flex; gap: 10px; }
        .btn { padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
        .btn-primary { background: #007bff; color: white; }
        .btn-secondary { background: #6c757d; color: white; }
        .form { display: none; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔐 Authorize Application</h1>
        <p>An application is requesting access to your BitCommerce account.</p>
      </div>
      
      <div class="app-info">
        <h3>Application Details</h3>
        <p><strong>Name:</strong> ${app.name}</p>
        <p><strong>Client ID:</strong> ${app.client_id}</p>
        <p><strong>Redirect URI:</strong> ${app.redirect_uri}</p>
      </div>
      
      <div class="scopes">
        <h3>Requested Permissions</h3>
        <p>The application is requesting the following permissions:</p>
        <ul>
          ${scope ? scope.split(' ').map(s => `<li>${s}</li>`).join('') : '<li>No specific permissions requested</li>'}
        </ul>
      </div>
      
      <div class="buttons">
        <button class="btn btn-primary" onclick="authorize()">Authorize</button>
        <button class="btn btn-secondary" onclick="deny()">Deny</button>
      </div>
      
      <form id="authorizeForm" class="form" method="POST" action="/oauth/authorize">
        <input type="hidden" name="client_id" value="${client_id}">
        <input type="hidden" name="redirect_uri" value="${redirect_uri}">
        <input type="hidden" name="scope" value="${scope || ''}">
        <input type="hidden" name="state" value="${stateParam}">
        <input type="hidden" name="response_type" value="code">
        <input type="hidden" name="action" value="authorize">
      </form>
      
      <form id="denyForm" class="form" method="POST" action="/oauth/authorize">
        <input type="hidden" name="client_id" value="${client_id}">
        <input type="hidden" name="redirect_uri" value="${redirect_uri}">
        <input type="hidden" name="state" value="${stateParam}">
        <input type="hidden" name="action" value="deny">
      </form>
      
      <script>
        function authorize() {
          document.getElementById('authorizeForm').submit();
        }
        function deny() {
          document.getElementById('denyForm').submit();
        }
      </script>
    </body>
    </html>
  `;

  res.send(html);
});

/**
 * POST /oauth/authorize
 * Handle authorization decision
 */
router.post('/authorize', [
  body('client_id').notEmpty().withMessage('client_id is required'),
  body('redirect_uri').notEmpty().withMessage('redirect_uri is required'),
  body('action').isIn(['authorize', 'deny']).withMessage('action must be authorize or deny'),
  body('scope').optional(),
  body('state').optional(),
  validateRedirectUri
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: errors.array()[0].msg
    });
  }

  const { client_id, redirect_uri, action, scope, state } = req.body;

  if (action === 'deny') {
    // Redirect with access denied error
    const errorParams = new URLSearchParams({
      error: 'access_denied',
      error_description: 'User denied authorization',
      state: state || ''
    });
    return res.redirect(`${redirect_uri}?${errorParams.toString()}`);
  }

  // For POC, we'll simulate merchant login and approval
  // In production, this would require actual merchant authentication
  
  // Generate authorization code
  const authCode = JWTUtils.generateAuthorizationCode();
  
  // Store authorization code
  db.createAuthorizationCode(authCode, {
    client_id,
    redirect_uri,
    scope: scope || '',
    merchant_id: 'merchant_123', // In production, this would be the actual merchant ID
    state: state || ''
  });

  // Redirect with authorization code
  const successParams = new URLSearchParams({
    code: authCode,
    state: state || ''
  });
  
  res.redirect(`${redirect_uri}?${successParams.toString()}`);
});

/**
 * POST /oauth/token
 * OAuth 2.0 Token endpoint
 * Exchange authorization code for access token
 */
router.post('/token', [
  body('grant_type').isIn(['authorization_code', 'refresh_token']).withMessage('Invalid grant_type'),
  body('client_id').notEmpty().withMessage('client_id is required'),
  body('client_secret').notEmpty().withMessage('client_secret is required'),
  validateClientCredentials
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: errors.array()[0].msg
    });
  }

  const { grant_type, code, redirect_uri, refresh_token } = req.body;
  const app = req.clientApp;

  try {
    if (grant_type === 'authorization_code') {
      // Authorization code flow
      if (!code || !redirect_uri) {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'Missing code or redirect_uri'
        });
      }

      // Validate authorization code
      const authCodeData = db.getAuthorizationCode(code);
      if (!authCodeData) {
        return res.status(400).json({
          error: 'invalid_grant',
          error_description: 'Invalid or expired authorization code'
        });
      }

      // Validate redirect URI
      if (authCodeData.redirect_uri !== redirect_uri) {
        return res.status(400).json({
          error: 'invalid_grant',
          error_description: 'Redirect URI mismatch'
        });
      }

      // Validate client
      if (authCodeData.client_id !== app.client_id) {
        return res.status(400).json({
          error: 'invalid_grant',
          error_description: 'Client ID mismatch'
        });
      }

      // Generate tokens
      const accessToken = JWTUtils.generateAccessToken({
        merchant_id: authCodeData.merchant_id,
        app_id: app.app_id,
        scopes: authCodeData.scope.split(' ').filter(s => s),
        client_id: app.client_id
      });

      const refreshToken = JWTUtils.generateRefreshToken({
        merchant_id: authCodeData.merchant_id,
        app_id: app.app_id,
        client_id: app.client_id
      });

      // Store tokens
      db.createAccessToken(accessToken, {
        merchant_id: authCodeData.merchant_id,
        app_id: app.app_id,
        scopes: authCodeData.scope.split(' ').filter(s => s),
        client_id: app.client_id
      });

      db.createRefreshToken(refreshToken, {
        merchant_id: authCodeData.merchant_id,
        app_id: app.app_id,
        client_id: app.client_id
      });

      // Delete authorization code (one-time use)
      db.deleteAuthorizationCode(code);

      // Return tokens
      res.json({
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 3600, // 1 hour
        refresh_token: refreshToken,
        scope: authCodeData.scope,
        merchant_id: authCodeData.merchant_id
      });

    } else if (grant_type === 'refresh_token') {
      // Refresh token flow
      if (!refresh_token) {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'Missing refresh_token'
        });
      }

      // Validate refresh token
      const refreshTokenData = db.getRefreshToken(refresh_token);
      if (!refreshTokenData) {
        return res.status(400).json({
          error: 'invalid_grant',
          error_description: 'Invalid or expired refresh token'
        });
      }

      // Validate client
      if (refreshTokenData.client_id !== app.client_id) {
        return res.status(400).json({
          error: 'invalid_grant',
          error_description: 'Client ID mismatch'
        });
      }

      // Generate new access token
      const newAccessToken = JWTUtils.generateAccessToken({
        merchant_id: refreshTokenData.merchant_id,
        app_id: refreshTokenData.app_id,
        scopes: ['read_products', 'read_orders'], // Default scopes for refresh
        client_id: app.client_id
      });

      // Store new access token
      db.createAccessToken(newAccessToken, {
        merchant_id: refreshTokenData.merchant_id,
        app_id: refreshTokenData.app_id,
        scopes: ['read_products', 'read_orders'],
        client_id: app.client_id
      });

      // Return new access token
      res.json({
        access_token: newAccessToken,
        token_type: 'Bearer',
        expires_in: 3600, // 1 hour
        scope: 'read_products read_orders',
        merchant_id: refreshTokenData.merchant_id
      });
    }
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error during token exchange'
    });
  }
});

/**
 * POST /oauth/apps
 * Register a new OAuth application
 */
router.post('/apps', [
  body('name').notEmpty().withMessage('App name is required'),
  body('redirect_uri').isURL().withMessage('Valid redirect URI is required'),
  body('scopes').isArray().withMessage('Scopes must be an array')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: errors.array()[0].msg
    });
  }

  try {
    const { name, redirect_uri, scopes } = req.body;

    // Validate scopes
    const validScopes = ['read_products', 'read_orders', 'read_profile', 'write_products', 'write_orders'];
    const invalidScopes = scopes.filter(scope => !validScopes.includes(scope));
    
    if (invalidScopes.length > 0) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: `Invalid scopes: ${invalidScopes.join(', ')}`
      });
    }

    // Create app
    const app = db.createApp({
      name,
      redirect_uri,
      scopes
    });

    res.status(201).json({
      message: 'Application registered successfully',
      app: {
        app_id: app.app_id,
        client_id: app.client_id,
        client_secret: app.client_secret,
        name: app.name,
        redirect_uri: app.redirect_uri,
        scopes: app.scopes,
        created_at: app.created_at
      }
    });
  } catch (error) {
    console.error('App registration error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error during app registration'
    });
  }
});

/**
 * GET /oauth/apps
 * List registered applications
 */
router.get('/apps', (req, res) => {
  try {
    const apps = db.getAllApps().map(app => ({
      app_id: app.app_id,
      client_id: app.client_id,
      name: app.name,
      redirect_uri: app.redirect_uri,
      scopes: app.scopes,
      status: app.status,
      created_at: app.created_at
    }));

    res.json({
      apps,
      total: apps.length
    });
  } catch (error) {
    console.error('App listing error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error while listing apps'
    });
  }
});

module.exports = router; 