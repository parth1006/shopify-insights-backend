// src/controllers/shopifyController.js
const prisma = require('../config/database');
const logger = require('../utils/logger');

/**
 * Helper function to fetch from Shopify API
 */
const fetchFromShopify = async (shopDomain, accessToken, endpoint) => {
  const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-10';
  const url = `https://${shopDomain}/admin/api/${apiVersion}/${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Update tenant's Shopify credentials
 * POST /api/shopify/connect
 */
const connectShopify = async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    // Update tenant with new access token
    await prisma.tenant.update({
      where: { id: req.tenantId },
      data: { accessToken }
    });

    logger.info(`Shopify credentials updated for tenant: ${req.tenant.email}`);

    res.json({ message: 'Shopify connected successfully' });
  } catch (error) {
    logger.error('Connect Shopify error:', error);
    res.status(500).json({ error: 'Failed to connect Shopify' });
  }
};

/**
 * Sync all data from Shopify (customers, products, orders)
 * POST /api/shopify/sync
 */
const syncAllData = async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId }
    });

    if (!tenant.accessToken) {
      return res.status(400).json({ 
        error: 'Shopify access token not configured. Please connect your store first.' 
      });
    }

    const shopDomain = tenant.shopDomain;
    const accessToken = tenant.accessToken;
    const counts = {
      customers: 0,
      products: 0,
      orders: 0
    };

    // Sync Customers
    logger.info(`Syncing customers for tenant: ${tenant.email}`);
    const customersData = await fetchFromShopify(shopDomain, accessToken, 'customers.json?limit=250');
    
    for (const customer of customersData.customers) {
      await prisma.customer.upsert({
        where: {
          tenantId_shopifyId: {
            tenantId: req.tenantId,
            shopifyId: String(customer.id)
          }
        },
        update: {
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
          phone: customer.phone,
          totalSpent: parseFloat(customer.total_spent || 0),
          ordersCount: customer.orders_count || 0,
        },
        create: {
          tenantId: req.tenantId,
          shopifyId: String(customer.id),
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
          phone: customer.phone,
          totalSpent: parseFloat(customer.total_spent || 0),
          ordersCount: customer.orders_count || 0,
        }
      });
      counts.customers++;
    }

    // Sync Products
    logger.info(`Syncing products for tenant: ${tenant.email}`);
    const productsData = await fetchFromShopify(shopDomain, accessToken, 'products.json?limit=250');
    
    for (const product of productsData.products) {
      const variant = product.variants[0]; // Use first variant
      const image = product.images && product.images[0] ? product.images[0].src : null;

      await prisma.product.upsert({
        where: {
          tenantId_shopifyId: {
            tenantId: req.tenantId,
            shopifyId: String(product.id)
          }
        },
        update: {
          title: product.title,
          description: product.body_html,
          price: parseFloat(variant.price),
          compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
          inventoryQty: variant.inventory_quantity || 0,
          imageUrl: image,
        },
        create: {
          tenantId: req.tenantId,
          shopifyId: String(product.id),
          title: product.title,
          description: product.body_html,
          price: parseFloat(variant.price),
          compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
          inventoryQty: variant.inventory_quantity || 0,
          imageUrl: image,
        }
      });
      counts.products++;
    }

    // Sync Orders
    logger.info(`Syncing orders for tenant: ${tenant.email}`);
    const ordersData = await fetchFromShopify(shopDomain, accessToken, 'orders.json?limit=250&status=any');
    
    for (const order of ordersData.orders) {
      // Find customer in our DB
      let customerId = null;
      if (order.customer) {
        const customer = await prisma.customer.findFirst({
          where: {
            tenantId: req.tenantId,
            shopifyId: String(order.customer.id)
          }
        });
        if (customer) customerId = customer.id;
      }

      // Upsert order
      const dbOrder = await prisma.order.upsert({
        where: {
          tenantId_shopifyId: {
            tenantId: req.tenantId,
            shopifyId: String(order.id)
          }
        },
        update: {
          customerId,
          orderNumber: order.order_number,
          totalPrice: parseFloat(order.total_price),
          subtotalPrice: parseFloat(order.subtotal_price || 0),
          totalTax: parseFloat(order.total_tax || 0),
          financialStatus: order.financial_status,
          fulfillmentStatus: order.fulfillment_status,
          orderDate: new Date(order.created_at),
        },
        create: {
          tenantId: req.tenantId,
          shopifyId: String(order.id),
          customerId,
          orderNumber: order.order_number,
          totalPrice: parseFloat(order.total_price),
          subtotalPrice: parseFloat(order.subtotal_price || 0),
          totalTax: parseFloat(order.total_tax || 0),
          financialStatus: order.financial_status,
          fulfillmentStatus: order.fulfillment_status,
          orderDate: new Date(order.created_at),
        }
      });

      // Sync order line items
      for (const lineItem of order.line_items) {
        // Find product in our DB
        let productId = null;
        if (lineItem.product_id) {
          const product = await prisma.product.findFirst({
            where: {
              tenantId: req.tenantId,
              shopifyId: String(lineItem.product_id)
            }
          });
          if (product) productId = product.id;
        }

        await prisma.orderItem.create({
          data: {
            tenantId: req.tenantId,
            orderId: dbOrder.id,
            productId,
            title: lineItem.title,
            quantity: lineItem.quantity,
            price: parseFloat(lineItem.price),
          }
        });
      }

      counts.orders++;
    }

    logger.info(`Sync completed for tenant ${tenant.email}: ${JSON.stringify(counts)}`);

    res.json({
      message: 'Data synced successfully',
      counts
    });
  } catch (error) {
    logger.error('Sync error:', error);
    res.status(500).json({ error: 'Failed to sync data from Shopify', details: error.message });
  }
};

module.exports = {
  connectShopify,
  syncAllData
};