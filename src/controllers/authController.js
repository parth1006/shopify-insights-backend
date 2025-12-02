// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { validateRegistration, validateLogin } = require('../utils/validators');
const logger = require('../utils/logger');

/**
 * Register a new tenant (Shopify store owner)
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { email, password, shopDomain, accessToken } = req.body;

    // Validate input
    const validation = validateRegistration({ email, password, shopDomain });
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }

    // Check if email already exists
    const existingUser = await prisma.tenant.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Check if shop domain already exists
    const existingShop = await prisma.tenant.findUnique({
      where: { shopDomain }
    });

    if (existingShop) {
      return res.status(409).json({ error: 'Shop domain already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        email,
        password: hashedPassword,
        shopDomain,
        accessToken: accessToken || null,
      },
      select: {
        id: true,
        email: true,
        shopDomain: true,
        createdAt: true,
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { tenantId: tenant.id, email: tenant.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info(`New tenant registered: ${email}`);

    res.status(201).json({
      message: 'Registration successful',
      token,
      tenant
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

/**
 * Login existing tenant
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    const validation = validateLogin({ email, password });
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }

    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { email }
    });

    if (!tenant) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, tenant.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if account is active
    if (!tenant.isActive) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { tenantId: tenant.id, email: tenant.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info(`Tenant logged in: ${email}`);

    res.json({
      message: 'Login successful',
      token,
      tenant: {
        id: tenant.id,
        email: tenant.email,
        shopDomain: tenant.shopDomain,
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

/**
 * Get current tenant info
 * GET /api/auth/me
 */
const getCurrentTenant = async (req, res) => {
  try {
    // req.tenant is set by authMiddleware
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenant.id },
      select: {
        id: true,
        email: true,
        shopDomain: true,
        isActive: true,
        createdAt: true,
      }
    });

    res.json({ tenant });
  } catch (error) {
    logger.error('Get current tenant error:', error);
    res.status(500).json({ error: 'Failed to fetch tenant info' });
  }
};

module.exports = {
  register,
  login,
  getCurrentTenant
};