// src/controllers/insightsController.js
const prisma = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get overview metrics (total customers, orders, revenue)
 * GET /api/insights/overview
 */
const getOverview = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    // Get total customers
    const totalCustomers = await prisma.customer.count({
      where: { tenantId }
    });

    // Get total orders
    const totalOrders = await prisma.order.count({
      where: { tenantId }
    });

    // Get total revenue
    const revenueData = await prisma.order.aggregate({
      where: { tenantId },
      _sum: {
        totalPrice: true
      }
    });

    const totalRevenue = revenueData._sum.totalPrice || 0;

    // Calculate average order value
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    res.json({
      totalCustomers,
      totalOrders,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      avgOrderValue: parseFloat(avgOrderValue.toFixed(2))
    });
  } catch (error) {
    logger.error('Get overview error:', error);
    res.status(500).json({ error: 'Failed to fetch overview data' });
  }
};

/**
 * Get orders by date with filtering
 * GET /api/insights/orders-by-date?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
const getOrdersByDate = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Fetch orders grouped by date
    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        ...(Object.keys(dateFilter).length > 0 && { orderDate: dateFilter })
      },
      select: {
        orderDate: true,
        totalPrice: true,
      },
      orderBy: {
        orderDate: 'asc'
      }
    });

    // Group by date
    const groupedData = {};
    orders.forEach(order => {
      const date = order.orderDate.toISOString().split('T')[0]; // YYYY-MM-DD
      if (!groupedData[date]) {
        groupedData[date] = {
          date,
          orderCount: 0,
          revenue: 0
        };
      }
      groupedData[date].orderCount++;
      groupedData[date].revenue += order.totalPrice;
    });

    // Convert to array and format
    const result = Object.values(groupedData).map(item => ({
      date: item.date,
      orderCount: item.orderCount,
      revenue: parseFloat(item.revenue.toFixed(2))
    }));

    res.json(result);
  } catch (error) {
    logger.error('Get orders by date error:', error);
    res.status(500).json({ error: 'Failed to fetch orders by date' });
  }
};

/**
 * Get top customers by total spend
 * GET /api/insights/top-customers?limit=5
 */
const getTopCustomers = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const limit = parseInt(req.query.limit) || 5;

    const topCustomers = await prisma.customer.findMany({
      where: { tenantId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        totalSpent: true,
        ordersCount: true,
      },
      orderBy: {
        totalSpent: 'desc'
      },
      take: limit
    });

    res.json(topCustomers);
  } catch (error) {
    logger.error('Get top customers error:', error);
    res.status(500).json({ error: 'Failed to fetch top customers' });
  }
};

/**
 * Get revenue trend for a period
 * GET /api/insights/revenue-trend?period=7d|30d|90d
 */
const getRevenueTrend = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const period = req.query.period || '30d';

    // Calculate start date based on period
    const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
    const days = daysMap[period] || 30;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch orders in the period
    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        orderDate: {
          gte: startDate
        }
      },
      select: {
        orderDate: true,
        totalPrice: true,
      },
      orderBy: {
        orderDate: 'asc'
      }
    });

    // Group by date
    const groupedData = {};
    orders.forEach(order => {
      const date = order.orderDate.toISOString().split('T')[0];
      if (!groupedData[date]) {
        groupedData[date] = 0;
      }
      groupedData[date] += order.totalPrice;
    });

    // Convert to array
    const result = Object.entries(groupedData).map(([date, revenue]) => ({
      date,
      revenue: parseFloat(revenue.toFixed(2))
    }));

    res.json(result);
  } catch (error) {
    logger.error('Get revenue trend error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue trend' });
  }
};

module.exports = {
  getOverview,
  getOrdersByDate,
  getTopCustomers,
  getRevenueTrend
};