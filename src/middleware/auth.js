const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required. Please provide a valid token.' 
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const tenant = await prisma.tenant.findUnique({
      where: { id: decoded.tenantId },
      select: {
        id: true,
        email: true,
        shopDomain: true,
        isActive: true,
      }
    });

    if (!tenant) {
      return res.status(401).json({ error: 'User not found.' });
    }

    if (!tenant.isActive) {
      return res.status(403).json({ error: 'Account is inactive.' });
    }

    req.tenant = tenant;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication failed.' });
  }
};

module.exports = authMiddleware;