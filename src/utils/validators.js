// src/utils/validators.js

/**
 * Email validation
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Password validation
 * At least 6 characters
 */
const isValidPassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Shopify domain validation
 * Must end with .myshopify.com
 */
const isValidShopifyDomain = (domain) => {
  const domainRegex = /^[a-zA-Z0-9-]+\.myshopify\.com$/;
  return domainRegex.test(domain);
};

/**
 * Validate registration data
 */
const validateRegistration = (data) => {
  const errors = [];

  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Valid email is required');
  }

  if (!data.password || !isValidPassword(data.password)) {
    errors.push('Password must be at least 6 characters');
  }

  if (!data.shopDomain || !isValidShopifyDomain(data.shopDomain)) {
    errors.push('Valid Shopify domain is required (e.g., your-store.myshopify.com)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate login data
 */
const validateLogin = (data) => {
  const errors = [];

  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Valid email is required');
  }

  if (!data.password) {
    errors.push('Password is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidShopifyDomain,
  validateRegistration,
  validateLogin
};