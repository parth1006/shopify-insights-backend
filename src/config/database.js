// src/config/database.js
const { PrismaClient } = require('@prisma/client');

// Create a singleton instance of Prisma Client
// This ensures we don't create multiple connections
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'], // Log database queries in development
});

// Handle cleanup on app shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;