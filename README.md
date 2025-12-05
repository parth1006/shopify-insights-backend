# 🔧 Shopify Insights Service - Backend API

A multi-tenant Node.js backend service that ingests data from Shopify stores and provides analytics through a RESTful API.

## 🔗 Live Demo

**API Endpoint**: https://shopify-insights-api-a7yt.onrender.com

**Frontend Dashboard**: https://shopify-insights-frontend.vercel.app/

**Frontend Repository**: https://github.com/parth1006/shopify-insights-frontend

**Health Check**: https://shopify-insights-api-a7yt.onrender.com/health

---

## 🛠️ Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js 4.18** - Web application framework
- **Prisma ORM 5.7** - Type-safe database toolkit
- **PostgreSQL 18** - Relational database
- **JWT** - Stateless authentication
- **bcryptjs 2.4** - Password hashing
- **Shopify Admin REST API 2024-10** - E-commerce data source

---

## 🏗️ Architecture

### High-Level System Architecture
```
┌──────────────────────────────────────────────────────────┐
│                  SHOPIFY INSIGHTS SERVICE                 │
└──────────────────────────────────────────────────────────┘

                    EXTERNAL SYSTEMS
                          │
                    ┌─────┴─────┐
                    │           │
              ┌─────▼─────┐   ┌─▼───────┐
              │  Shopify  │   │  React  │
              │    API    │   │Frontend │
              └─────┬─────┘   └─┬───────┘
                    │           │
                    └─────┬─────┘
                          │
                    ┌─────▼─────────┐
                    │  Express.js   │
                    │  REST API     │
                    └─────┬─────────┘
                          │
              ┌───────────┼───────────┐
              │           │           │
        ┌─────▼─────┐ ┌──▼───┐ ┌────▼─────┐
        │   Auth    │ │ Sync │ │ Insights │
        │Middleware │ │ ETL  │ │Analytics │
        └─────┬─────┘ └──┬───┘ └────┬─────┘
              │          │          │
              └──────────┼──────────┘
                         │
                  ┌──────▼──────┐
                  │   Prisma    │
                  │     ORM     │
                  └──────┬──────┘
                         │
                  ┌──────▼──────┐
                  │ PostgreSQL  │
                  │  Database   │
                  └─────────────┘
```

### Data Flow Diagram
```
1. DATA INGESTION FLOW:
   Shopify API → syncAllData() → Transform → Prisma Upsert → PostgreSQL

2. AUTHENTICATION FLOW:
   Client → Login/Register → bcrypt → JWT → LocalStorage → API Calls

3. ANALYTICS FLOW:
   Client Request → Auth Middleware → Tenant Context → Prisma Aggregations → JSON Response
```

### Multi-Tenant Architecture
```
DATABASE STRUCTURE (Row-Level Multi-Tenancy):

┌─────────────────────────────────────────┐
│            Tenant Table                  │
│  - id (PK)                               │
│  - email                                 │
│  - shopDomain                            │
│  - accessToken                           │
└─────────────────────────────────────────┘
         │
         ├──────────────┬──────────────┬───────────────┐
         │              │              │               │
    ┌────▼───┐    ┌────▼───┐    ┌────▼───┐     ┌────▼───┐
    │Customer│    │Product │    │ Order  │     │OrderItem│
    │tenantId│    │tenantId│    │tenantId│     │tenantId│
    └────────┘    └────────┘    └────────┘     └────────┘

ISOLATION: Every table has tenantId foreign key
SECURITY: All queries automatically filtered by tenant
SCALABILITY: Single database serves multiple clients
```

---

## 🚀 Features

### Data Ingestion (ETL Pipeline)
- Extract data from Shopify Admin API (REST)
- Transform Shopify format to normalized schema
- Load data with upsert (idempotent sync)
- Support for customers, products, orders, order items
- Batch processing (up to 250 records per entity)
- Error handling and rollback on failure

### Multi-Tenant Architecture
- Row-level data isolation per tenant
- Secure data boundaries between clients
- Tenant-scoped queries automatically
- Unique constraints per tenant (tenantId + shopifyId)

### Authentication & Authorization
- JWT-based stateless authentication
- Password hashing with bcrypt (10 salt rounds)
- Token expiration (7 days)
- Protected routes with middleware
- Tenant context injection

### Analytics & Insights
- Real-time aggregations from PostgreSQL
- Revenue trends with period filtering (7d/30d/90d)
- Customer ranking by total spend
- Order volume analysis by date
- Average order value calculations

---

## 📋 API Documentation

### Base URL
```
Production: https://shopify-insights-api-a7yt.onrender.com
Local: http://localhost:5000
```

### Authentication
All protected endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

---

### 📌 Health & Status

#### `GET /health`
Check API health status

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-04T06:47:28.125Z",
  "service": "Shopify Insights Backend"
}
```

---

### 🔐 Authentication Endpoints

#### `POST /api/auth/register`
Register new tenant

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "shopDomain": "mystore.myshopify.com",
  "accessToken": "shpat_xxxxxxxxxxxxx"
}
```

**Validation:**
- Email: Valid email format, unique
- Password: Minimum 6 characters
- shopDomain: Format `*.myshopify.com`, unique
- accessToken: Required, starts with `shpat_`

**Response (201):**
```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tenant": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "shopDomain": "mystore.myshopify.com",
    "isActive": true,
    "createdAt": "2025-12-04T06:47:28.125Z"
  }
}
```

**Error (400):**
```json
{
  "error": "Email already registered"
}
```

---

#### `POST /api/auth/login`
Authenticate tenant

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tenant": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "shopDomain": "mystore.myshopify.com"
  }
}
```

**Error (401):**
```json
{
  "error": "Invalid credentials"
}
```

---

#### `GET /api/auth/me`
Get current authenticated tenant

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "tenant": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "shopDomain": "mystore.myshopify.com",
    "isActive": true,
    "createdAt": "2025-12-04T06:47:28.125Z"
  }
}
```

---

### 🛍️ Shopify Integration Endpoints

#### `POST /api/shopify/connect`
Update Shopify access token

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "accessToken": "shpat_new_token_xxxxx"
}
```

**Response (200):**
```json
{
  "message": "Shopify connection updated successfully"
}
```

---

#### `POST /api/shopify/sync`
Trigger full data sync from Shopify

**Headers:**
```
Authorization: Bearer <token>
```

**Process:**
1. Fetch customers from Shopify (limit 250)
2. Fetch products from Shopify (limit 250)
3. Fetch orders from Shopify (limit 250)
4. Upsert all data to PostgreSQL
5. Return sync counts

**Response (200):**
```json
{
  "message": "Data synced successfully",
  "counts": {
    "customers": 45,
    "products": 120,
    "orders": 230
  }
}
```

**Error (500):**
```json
{
  "error": "Shopify API connection failed"
}
```

---

### 📊 Analytics Endpoints

#### `GET /api/insights/overview`
Get dashboard overview metrics

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "totalCustomers": 45,
  "totalOrders": 230,
  "totalRevenue": 15420.50,
  "avgOrderValue": 67.05
}
```

---

#### `GET /api/insights/revenue-trend?period=30d`
Get revenue trend over time

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `period`: `7d` | `30d` | `90d` (default: `30d`)

**Response (200):**
```json
[
  {
    "date": "2025-11-05",
    "revenue": 1250.00
  },
  {
    "date": "2025-11-06",
    "revenue": 1450.50
  }
]
```

---

#### `GET /api/insights/orders-by-date?startDate=2024-01-01&endDate=2025-12-31`
Get orders grouped by date

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate`: ISO date string (optional)
- `endDate`: ISO date string (optional)

**Response (200):**
```json
[
  {
    "date": "2025-11-05",
    "orderCount": 12,
    "revenue": 1250.00
  },
  {
    "date": "2025-11-06",
    "orderCount": 15,
    "revenue": 1450.50
  }
]
```

---

#### `GET /api/insights/top-customers?limit=5`
Get top customers by total spend

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit`: Number of customers to return (default: 5, max: 50)

**Response (200):**
```json
[
  {
    "id": "cust-001",
    "firstName": "John",
    "lastName": "Smith",
    "email": "john@example.com",
    "totalSpent": 2500.00,
    "ordersCount": 8
  },
  {
    "id": "cust-002",
    "firstName": "Sarah",
    "lastName": "Johnson",
    "email": "sarah@example.com",
    "totalSpent": 1800.00,
    "ordersCount": 5
  }
]
```

---

## 🗄️ Database Schema

### Entity Relationship Diagram
```
┌─────────────────────┐
│      Tenant         │
│─────────────────────│
│ id (PK)             │
│ email (UQ)          │
│ password            │
│ shopDomain (UQ)     │
│ accessToken         │
│ isActive            │
│ createdAt           │
│ updatedAt           │
└──────────┬──────────┘
           │
           │ 1:N
           │
    ┌──────┴──────────────────┬──────────────────┬────────────────┐
    │                         │                  │                │
┌───▼──────────────┐  ┌───────▼────────┐  ┌─────▼────────┐  ┌──▼──────────┐
│    Customer      │  │    Product     │  │    Order     │  │  OrderItem  │
│──────────────────│  │────────────────│  │──────────────│  │─────────────│
│ id (PK)          │  │ id (PK)        │  │ id (PK)      │  │ id (PK)     │
│ tenantId (FK)    │  │ tenantId (FK)  │  │ tenantId(FK) │  │ tenantId(FK)│
│ shopifyId        │  │ shopifyId      │  │ shopifyId    │  │ orderId(FK) │
│ email            │  │ title          │  │ customerId   │  │ productId   │
│ firstName        │  │ description    │  │ orderNumber  │  │ title       │
│ lastName         │  │ price          │  │ totalPrice   │  │ quantity    │
│ phone            │  │ compareAtPrice │  │ subtotalPrice│  │ price       │
│ totalSpent       │  │ inventoryQty   │  │ totalTax     │  │ createdAt   │
│ ordersCount      │  │ imageUrl       │  │ financial    │  └─────────────┘
│ createdAt        │  │ createdAt      │  │ fulfillment  │
│ updatedAt        │  │ updatedAt      │  │ orderDate    │
└──────────────────┘  └────────────────┘  │ createdAt    │
                                          │ updatedAt    │
                                          └──────────────┘

UNIQUE CONSTRAINTS:
- (tenantId, shopifyId) on Customer, Product, Order
  → Prevents duplicates within tenant
  → Allows same Shopify ID across different tenants

INDEXES:
- tenantId on all tables (for fast tenant filtering)
- email on Customer (for lookups)
- orderDate on Order (for analytics)
```

### Prisma Schema
```prisma
model Tenant {
  id           String    @id @default(uuid())
  email        String    @unique
  password     String
  shopDomain   String    @unique
  accessToken  String
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  customers    Customer[]
  products     Product[]
  orders       Order[]
  orderItems   OrderItem[]
}

model Customer {
  id          String   @id @default(uuid())
  tenantId    String
  shopifyId   String
  email       String?
  firstName   String?
  lastName    String?
  phone       String?
  totalSpent  Decimal  @default(0)
  ordersCount Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  orders      Order[]

  @@unique([tenantId, shopifyId])
  @@index([tenantId])
  @@index([email])
}

model Product {
  id             String   @id @default(uuid())
  tenantId       String
  shopifyId      String
  title          String
  description    String?
  price          Decimal
  compareAtPrice Decimal?
  inventoryQty   Int      @default(0)
  imageUrl       String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  tenant         Tenant      @relation(fields: [tenantId], references: [id])
  orderItems     OrderItem[]

  @@unique([tenantId, shopifyId])
  @@index([tenantId])
}

model Order {
  id                String   @id @default(uuid())
  tenantId          String
  shopifyId         String
  customerId        String?
  orderNumber       String
  totalPrice        Decimal
  subtotalPrice     Decimal
  totalTax          Decimal
  financialStatus   String
  fulfillmentStatus String?
  orderDate         DateTime
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  tenant            Tenant      @relation(fields: [tenantId], references: [id])
  customer          Customer?   @relation(fields: [customerId], references: [id])
  items             OrderItem[]

  @@unique([tenantId, shopifyId])
  @@index([tenantId])
  @@index([orderDate])
}

model OrderItem {
  id         String   @id @default(uuid())
  tenantId   String
  orderId    String
  productId  String?
  title      String
  quantity   Int
  price      Decimal
  createdAt  DateTime @default(now())

  tenant     Tenant   @relation(fields: [tenantId], references: [id])
  order      Order    @relation(fields: [orderId], references: [id])
  product    Product? @relation(fields: [productId], references: [id])

  @@index([tenantId])
  @@index([orderId])
}
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:
```env
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/shopify_insights?schema=public"

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Shopify API (for testing)
SHOPIFY_SHOP_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxx
SHOPIFY_API_VERSION=2024-10

# CORS
FRONTEND_URL=http://localhost:5173
```

### Production Environment Variables

Required on Render:
```env
PORT=10000
NODE_ENV=production
DATABASE_URL=[Render PostgreSQL Internal URL]
JWT_SECRET=[64-character random string]
SHOPIFY_SHOP_DOMAIN=insights-dev-stores.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxx
SHOPIFY_API_VERSION=2024-10
FRONTEND_URL=https://shopify-insights-frontend.vercel.app
```

---

## 🔧 Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Shopify Partner account with development store
- Shopify custom app with Admin API access

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/parth1006/shopify-insights-backend.git
cd shopify-insights-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and set your database and Shopify credentials.

4. **Setup PostgreSQL database**
```bash
# Create database
createdb shopify_insights

# Or using psql
psql -U postgres
CREATE DATABASE shopify_insights;
\q
```

5. **Run database migrations**
```bash
npx prisma migrate dev
```

6. **Generate Prisma Client**
```bash
npx prisma generate
```

7. **Start development server**
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

### Database Management
```bash
# Open Prisma Studio (GUI)
npx prisma studio

# Create new migration
npx prisma migrate dev --name migration_name

# Deploy migrations (production)
npx prisma migrate deploy

# Reset database (warning: deletes all data)
npx prisma migrate reset
```

---

## 📁 Project Structure
```
shopify-insights-backend/
├── prisma/
│   ├── migrations/          # Database migrations
│   └── schema.prisma        # Database schema
├── src/
│   ├── config/
│   │   └── database.js      # Prisma client singleton
│   ├── controllers/
│   │   ├── authController.js      # Authentication logic
│   │   ├── shopifyController.js   # Shopify sync logic
│   │   └── insightsController.js  # Analytics logic
│   ├── middleware/
│   │   ├── auth.js                # JWT authentication
│   │   ├── tenantContext.js       # Tenant scoping
│   │   └── errorHandler.js        # Global error handler
│   ├── routes/
│   │   ├── authRoutes.js          # Auth endpoints
│   │   ├── shopifyRoutes.js       # Shopify endpoints
│   │   └── insightsRoutes.js      # Analytics endpoints
│   ├── utils/
│   │   ├── validators.js          # Input validation
│   │   └── logger.js              # Logging utility
│   ├── app.js                     # Express app setup
│   └── server.js                  # Entry point
├── .env                     # Environment variables
├── .gitignore
├── package.json
└── README.md
```

---

## 🔐 Security

### Implemented Security Measures

- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ JWT-based stateless authentication
- ✅ Environment variable for sensitive data
- ✅ CORS configured for specific origin
- ✅ Input validation on all endpoints
- ✅ SQL injection prevention (Prisma parameterized queries)
- ✅ Rate limiting on authentication endpoints
- ✅ Error messages don't leak sensitive info
- ✅ Token expiration (7 days)

### Production Security Recommendations

1. **Authentication & Authorization**
   - Implement refresh tokens
   - Add rate limiting globally (express-rate-limit)
   - Implement MFA (multi-factor authentication)
   - Add account lockout after failed login attempts
   - Implement password complexity requirements

2. **API Security**
   - Add request signing for API calls
   - Implement API keys for service-to-service
   - Add request size limits
   - Implement CSRF protection
   - Add security headers (helmet.js)

3. **Database Security**
   - Enable SSL for database connections
   - Implement database backup strategy
   - Use read replicas for analytics queries
   - Regular security audits
   - Implement database encryption at rest

4. **Infrastructure**
   - Use secrets manager (AWS Secrets Manager, Vault)
   - Implement WAF (Web Application Firewall)
   - DDoS protection
   - Regular penetration testing
   - Container scanning for vulnerabilities

---

## 🎯 Assumptions Made

### Technical Assumptions

1. **Single Region**: All data stored in single region (no geo-distribution needed)
2. **Data Volume**: Each tenant has <10,000 customers, <50,000 orders
3. **Sync Frequency**: Manual sync is acceptable (no real-time sync required)
4. **API Limits**: Shopify API limits (250 records per request) are sufficient
5. **Currency**: All monetary values in USD (no multi-currency support)
6. **Timezone**: All dates stored in UTC, displayed in user's local timezone

### Business Assumptions

7. **Pricing Model**: Free tier for development/testing
8. **SLA**: 99% uptime acceptable for MVP
9. **Support**: Email support is sufficient
10. **Scalability**: Up to 100 concurrent tenants initially
11. **Data Retention**: Indefinite data retention (no archival/deletion policy)

### Integration Assumptions

12. **Shopify Plan**: Development stores used (paid plans in production)
13. **API Version**: Shopify API 2024-10 stable for 12 months
14. **Access Scopes**: `read_customers`, `read_products`, `read_orders` sufficient
15. **Webhooks**: Not implemented (pull-based sync only)

---

## 🚧 Known Limitations

### Current Version

1. **No Real-time Sync**: Data only updates on manual sync trigger
2. **Limited Batch Size**: Maximum 250 records per entity per sync
3. **No Webhook Support**: Doesn't respond to Shopify events
4. **Single Shop per Tenant**: One Shopify store per account
5. **No Data Export**: Cannot export raw data
6. **Basic Error Handling**: Generic error messages
7. **No Retry Logic**: Failed API calls don't retry automatically
8. **No Audit Log**: User actions not logged

### Shopify Development Store Limitations

9. **Customer PII Restriction**: Shopify dev stores restrict access to customer personal information (names, emails, phone) through Admin API due to privacy compliance. This affects both REST and GraphQL APIs.
   
   **Impact**: Customer records sync with NULL values for `firstName`, `lastName`, `email`, `phone`
   
   **Workaround**: Manual data seeding for demonstration
   
   **Production Solution**: With paid Shopify plans (Shopify, Advanced, Plus), full customer PII is available through the API with proper OAuth scopes

10. **API Rate Limits**: Development stores have stricter rate limits
11. **Test Data**: Limited to pre-populated sample data

---

## 🔄 Next Steps to Productionize

### Phase 1: Core Improvements (1-2 months)

#### 1.1 Real-time Features
- **Shopify Webhooks**: Subscribe to customer.create, order.create events
- **Automatic Sync**: Trigger sync on webhook receipt
- **WebSocket Support**: Real-time dashboard updates
- **Background Jobs**: Use Bull/BullMQ for async processing

#### 1.2 Enhanced Error Handling
- **Retry Logic**: Exponential backoff for failed API calls
- **Circuit Breaker**: Prevent cascading failures
- **Dead Letter Queue**: Store failed jobs for manual review
- **Detailed Error Logging**: Structured logging with correlation IDs

#### 1.3 Testing
- **Unit Tests**: Jest for business logic (80%+ coverage)
- **Integration Tests**: Supertest for API endpoints
- **E2E Tests**: Test complete sync workflow
- **Load Testing**: Artillery/k6 for performance testing

### Phase 2: Scalability (2-4 months)

#### 2.1 Performance Optimization
- **Database Indexing**: Optimize slow queries
- **Query Optimization**: Use database views for complex analytics
- **Caching Layer**: Redis for frequent queries
- **Connection Pooling**: Optimize database connections
- **CDN**: Cache static analytics results

#### 2.2 Horizontal Scaling
- **Stateless Design**: Remove any session state
- **Load Balancer**: Distribute traffic across instances
- **Database Read Replicas**: Separate read/write workloads
- **Microservices**: Split sync and analytics into separate services

#### 2.3 Advanced Features
- **GraphQL API**: Flexible query language
- **Batch Operations**: Bulk import/export
- **Data Pipeline**: Stream processing with Kafka/RabbitMQ
- **Machine Learning**: Predictive analytics

### Phase 3: Enterprise Features (4-6 months)

#### 3.1 Multi-tenancy Enhancements
- **Organization Management**: Multiple users per tenant
- **Role-Based Access Control**: Admin, viewer, analyst roles
- **Team Collaboration**: Shared dashboards, annotations
- **White-label Support**: Custom branding per tenant

#### 3.2 Compliance & Security
- **GDPR Compliance**: Data export, right to deletion
- **SOC 2 Certification**: Security audit
- **Data Encryption**: At-rest and in-transit
- **Audit Logs**: Track all data access
- **Compliance Reports**: Automated compliance documentation

#### 3.3 Advanced Analytics
- **Custom Reports**: User-defined metrics
- **Scheduled Reports**: Email reports daily/weekly
- **Forecasting**: Revenue prediction ML models
- **Cohort Analysis**: Customer segmentation
- **A/B Testing**: Experiment framework

### Phase 4: DevOps & Monitoring (Ongoing)

#### 4.1 Observability
- **APM**: New Relic, Datadog, or Dynatrace
- **Logging**: Centralized logging (ELK stack)
- **Metrics**: Prometheus + Grafana dashboards
- **Tracing**: Distributed tracing with Jaeger
- **Alerting**: PagerDuty integration

#### 4.2 CI/CD Pipeline
- **Automated Testing**: Run tests on every commit
- **Staging Environment**: Pre-production testing
- **Blue-Green Deployment**: Zero-downtime deploys
- **Feature Flags**: LaunchDarkly or similar
- **Automated Rollback**: Revert on failure

#### 4.3 Infrastructure as Code
- **Terraform**: Infrastructure provisioning
- **Docker**: Containerization
- **Kubernetes**: Container orchestration
- **Helm Charts**: Application deployment
- **GitOps**: Flux or ArgoCD

---

## 🧪 Testing

### Run Tests (When Implemented)
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage

# Watch mode
npm run test:watch
```

### Manual API Testing

Use these curl commands or import into Postman:
```bash
# Health check
curl https://shopify-insights-api-a7yt.onrender.com/health

# Register
curl -X POST https://shopify-insights-api-a7yt.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "shopDomain": "mystore.myshopify.com",
    "accessToken": "shpat_xxxxx"
  }'

# Login
curl -X POST https://shopify-insights-api-a7yt.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'

# Get overview (replace TOKEN)
curl https://shopify-insights-api-a7yt.onrender.com/api/insights/overview \
  -H "Authorization: Bearer TOKEN"
```

---

## 📊 Performance Benchmarks

### Expected Performance (Single Instance)

- **Authentication**: <100ms response time
- **Sync Operation**: 10-30 seconds for 250 records/entity
- **Analytics Queries**: <200ms response time
- **Concurrent Users**: 50+ simultaneous users
- **Database Queries**: <50ms for simple queries, <200ms for aggregations

### Bottlenecks Identified

1. Shopify API rate limits (2 requests/second)
2. Database aggregation queries (can be cached)
3. Large order item inserts (can be batched)

---

## 🐛 Troubleshooting

### Issue: Database connection fails

**Symptoms**: `PrismaClientInitializationError`

**Solutions**:
1. Check `DATABASE_URL` format is correct
2. Verify database is accessible from your IP
3. Check PostgreSQL is running
4. Verify SSL settings if required

### Issue: Shopify API returns 401

**Symptoms**: "Invalid access token"

**Solutions**:
1. Verify `SHOPIFY_ACCESS_TOKEN` is correct
2. Check token hasn't been revoked
3. Verify API scopes are granted
4. Test token in Shopify GraphQL IDE

### Issue: CORS errors in frontend

**Symptoms**: "Access-Control-Allow-Origin blocked"

**Solutions**:
1. Verify `FRONTEND_URL` matches exactly (no trailing slash)
2. Check origin in request headers
3. Ensure CORS middleware is before routes
4. Check browser console for actual origin

### Issue: JWT token invalid

**Symptoms**: 401 errors on protected routes

**Solutions**:
1. Verify `JWT_SECRET` is set
2. Check token hasn't expired
3. Ensure "Bearer " prefix in Authorization header
4. Verify token format is valid JWT

---

## 📄 License

This project is created for educational purposes as part of a placement assignment.

---

## 👨‍💻 Author

**Parth Maheshwari**  
📧 Email: parthmaheshwari4384@gmail.com  
🐙 GitHub: https://github.com/parth1006  
🔗 LinkedIn: https://www.linkedin.com/in/parth1006/
