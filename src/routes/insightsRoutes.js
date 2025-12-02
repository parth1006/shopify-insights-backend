// src/routes/insightsRoutes.js
const express = require('express');
const router = express.Router();
const insightsController = require('../controllers/insightsController');
const authMiddleware = require('../middleware/auth');
const tenantContextMiddleware = require('../middleware/tenantContext');

/**
 * Insights Routes
 * Base path: /api/insights
 * All routes require authentication
 */

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(tenantContextMiddleware);

// Overview metrics
router.get('/overview', insightsController.getOverview);

// Orders by date with filtering
router.get('/orders-by-date', insightsController.getOrdersByDate);

// Top customers by spend
router.get('/top-customers', insightsController.getTopCustomers);

// Revenue trend
router.get('/revenue-trend', insightsController.getRevenueTrend);

module.exports = router;