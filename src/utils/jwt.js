const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_TOKEN_EXPIRY || '1h';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d';

class JWTUtils {
  /**
   * Generate access token
   * @param {Object} payload - Token payload
   * @returns {string} JWT access token
   */
  static generateAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: 'bitcommerce-oauth-api',
      audience: 'merchant-apps'
    });
  }

  /**
   * Generate refresh token
   * @param {Object} payload - Token payload
   * @returns {string} JWT refresh token
   */
  static generateRefreshToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: 'bitcommerce-oauth-api',
      audience: 'merchant-apps'
    });
  }

  /**
   * Verify and decode JWT token
   * @param {string} token - JWT token to verify
   * @returns {Object|null} Decoded token payload or null if invalid
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'bitcommerce-oauth-api',
        audience: 'merchant-apps'
      });
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate random authorization code
   * @returns {string} Random authorization code
   */
  static generateAuthorizationCode() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate random state parameter
   * @returns {string} Random state parameter
   */
  static generateState() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Generate random token
   * @returns {string} Random token
   */
  static generateRandomToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash client secret for storage
   * @param {string} clientSecret - Plain client secret
   * @returns {string} Hashed client secret
   */
  static hashClientSecret(clientSecret) {
    return crypto.createHash('sha256').update(clientSecret).digest('hex');
  }

  /**
   * Verify client secret
   * @param {string} plainSecret - Plain client secret
   * @param {string} hashedSecret - Hashed client secret
   * @returns {boolean} True if secrets match
   */
  static verifyClientSecret(plainSecret, hashedSecret) {
    const hash = this.hashClientSecret(plainSecret);
    return hash === hashedSecret;
  }

  /**
   * Extract token from Authorization header
   * @param {string} authHeader - Authorization header value
   * @returns {string|null} Token or null if invalid format
   */
  static extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Get token expiration time
   * @param {string} token - JWT token
   * @returns {Date|null} Expiration date or null if invalid
   */
  static getTokenExpiration(token) {
    try {
      const decoded = jwt.decode(token);
      return decoded ? new Date(decoded.exp * 1000) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired
   * @param {string} token - JWT token
   * @returns {boolean} True if token is expired
   */
  static isTokenExpired(token) {
    const expiration = this.getTokenExpiration(token);
    return expiration ? new Date() > expiration : true;
  }
}

module.exports = JWTUtils; 