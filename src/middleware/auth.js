const JWTUtils = require('../utils/jwt');
const db = require('../config/database');

/**
 * Middleware to validate access token
 */
const validateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTUtils.extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        error: 'access_denied',
        error_description: 'Missing or invalid authorization header'
      });
    }

    // Verify JWT token
    const decoded = JWTUtils.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        error: 'invalid_token',
        error_description: 'Invalid or expired access token'
      });
    }

    // Check if token exists in database (for additional security)
    const storedToken = db.getAccessToken(token);
    if (!storedToken) {
      return res.status(401).json({
        error: 'invalid_token',
        error_description: 'Access token not found or revoked'
      });
    }

    // Add token info to request
    req.token = {
      token,
      decoded,
      scopes: decoded.scopes || [],
      merchant_id: decoded.merchant_id,
      app_id: decoded.app_id
    };

    next();
  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error during token validation'
    });
  }
};

/**
 * Middleware to check if user has required scopes
 * @param {string|Array} requiredScopes - Required scope(s)
 */
const requireScope = (requiredScopes) => {
  return (req, res, next) => {
    if (!req.token) {
      return res.status(401).json({
        error: 'access_denied',
        error_description: 'Authentication required'
      });
    }

    const userScopes = req.token.scopes || [];
    const scopes = Array.isArray(requiredScopes) ? requiredScopes : [requiredScopes];

    // Check if user has all required scopes
    const hasAllScopes = scopes.every(scope => userScopes.includes(scope));
    
    if (!hasAllScopes) {
      return res.status(403).json({
        error: 'insufficient_scope',
        error_description: `Required scopes: ${scopes.join(', ')}. Available scopes: ${userScopes.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Middleware to check if user has any of the required scopes
 * @param {string|Array} requiredScopes - Required scope(s)
 */
const requireAnyScope = (requiredScopes) => {
  return (req, res, next) => {
    if (!req.token) {
      return res.status(401).json({
        error: 'access_denied',
        error_description: 'Authentication required'
      });
    }

    const userScopes = req.token.scopes || [];
    const scopes = Array.isArray(requiredScopes) ? requiredScopes : [requiredScopes];

    // Check if user has any of the required scopes
    const hasAnyScope = scopes.some(scope => userScopes.includes(scope));
    
    if (!hasAnyScope) {
      return res.status(403).json({
        error: 'insufficient_scope',
        error_description: `Required one of: ${scopes.join(', ')}. Available scopes: ${userScopes.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Middleware to validate merchant access
 * Checks if the authenticated user can access the requested merchant data
 */
const validateMerchantAccess = (req, res, next) => {
  if (!req.token) {
    return res.status(401).json({
      error: 'access_denied',
      error_description: 'Authentication required'
    });
  }

  const requestedMerchantId = req.params.merchant_id || req.params.id;
  const tokenMerchantId = req.token.merchant_id;

  if (requestedMerchantId && tokenMerchantId && requestedMerchantId !== tokenMerchantId) {
    return res.status(403).json({
      error: 'access_denied',
      error_description: 'Access denied to this merchant data'
    });
  }

  next();
};

/**
 * Middleware to extract and validate client credentials
 * Used for OAuth token exchange
 */
const validateClientCredentials = (req, res, next) => {
  try {
    const { client_id, client_secret } = req.body;

    if (!client_id || !client_secret) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing client_id or client_secret'
      });
    }

    // Find app by client_id
    const app = db.getAppByClientId(client_id);
    if (!app) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Invalid client_id'
      });
    }

    // Verify client_secret
    if (app.client_secret !== client_secret) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Invalid client_secret'
      });
    }

    // Add app info to request
    req.clientApp = app;
    next();
  } catch (error) {
    console.error('Client credentials validation error:', error);
    return res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error during client validation'
    });
  }
};

/**
 * Middleware to validate redirect URI
 */
const validateRedirectUri = (req, res, next) => {
  // Handle both GET (query params) and POST (body params) requests
  const redirect_uri = req.query.redirect_uri || req.body.redirect_uri;
  const client_id = req.query.client_id || req.body.client_id;

  if (!redirect_uri || !client_id) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'Missing redirect_uri or client_id'
    });
  }

  const app = db.getAppByClientId(client_id);
  if (!app) {
    return res.status(400).json({
      error: 'invalid_client',
      error_description: 'Invalid client_id'
    });
  }

  if (app.redirect_uri !== redirect_uri) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'Redirect URI mismatch'
    });
  }

  req.clientApp = app;
  next();
};

module.exports = {
  validateToken,
  requireScope,
  requireAnyScope,
  validateMerchantAccess,
  validateClientCredentials,
  validateRedirectUri
}; 