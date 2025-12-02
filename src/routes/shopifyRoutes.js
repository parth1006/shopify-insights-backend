// src/routes/shopifyRoutes.js
const express = require('express');
const router = express.Router();
const shopifyController = require('../controllers/shopifyController');
const authMiddleware = require('../middleware/auth');
const tenantContextMiddleware = require('../middleware/tenantContext');

/**
 * Shopify Routes
 * Base path: /api/shopify
 * All routes require authentication
 */

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(tenantContextMiddleware);

// Connect Shopify store
router.post('/connect', shopifyController.connectShopify);

// Sync all data from Shopify
router.post('/sync', shopifyController.syncAllData);

module.exports = router;