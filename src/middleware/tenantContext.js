// src/middleware/tenantContext.js

/**
 * Middleware to inject tenant ID into all database queries
 * This ensures data isolation in multi-tenant architecture
 * 
 * NOTE: This middleware must be used AFTER authMiddleware
 * because it depends on req.tenant being set
 */
const tenantContextMiddleware = (req, res, next) => {
  if (!req.tenant) {
    return res.status(401).json({ 
      error: 'Tenant context not found. Auth middleware must run first.' 
    });
  }

  // Attach tenantId to request for easy access in controllers
  req.tenantId = req.tenant.id;
  
  next();
};

module.exports = tenantContextMiddleware;