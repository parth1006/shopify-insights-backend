# Shopify Insights Backend API

Multi-tenant Shopify data ingestion and insights service backend.

## Tech Stack
- Node.js + Express.js
- PostgreSQL + Prisma ORM
- JWT Authentication
- Shopify Admin REST API

## Features
- Multi-tenant architecture
- Data ingestion from Shopify (Customers, Products, Orders)
- Analytics & Insights endpoints
- Secure authentication

## Environment Variables
- PORT=5000
- NODE_ENV=production
- DATABASE_URL=postgresql://...
- JWT_SECRET=...
- SHOPIFY_SHOP_DOMAIN=...
- SHOPIFY_ACCESS_TOKEN=...
- SHOPIFY_API_VERSION=2024-10
- FRONTEND_URL=...
## Deployment
Deployed on Render.com

## API Endpoints
- `GET /health` - Health check
- `POST /api/auth/register` - Register tenant
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/shopify/sync` - Sync Shopify data
- `GET /api/insights/overview` - Get metrics overview
- `GET /api/insights/revenue-trend` - Get revenue trends
- `GET /api/insights/orders-by-date` - Get orders analytics
- `GET /api/insights/top-customers` - Get top customers