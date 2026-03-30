# E-Commerce Backend - Authentication System

Production-ready auth with JWT (access + refresh), bcrypt, role-based access, Joi validation, and centralized error handling.

## Setup

1. **Install dependencies**
   ```bash
   cd e-commerce-backend && npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your PostgreSQL URL and JWT secrets.

3. **Run migrations**
   ```bash
   psql -U your_user -d your_db -f migrations/001_auth_schema.sql
   psql -U your_user -d your_db -f migrations/002_products_schema.sql
   psql -U your_user -d your_db -f migrations/003_cart_and_orders_schema.sql
   psql -U your_user -d your_db -f migrations/004_product_embeddings_schema.sql
   ```

4. **Seed categories** (optional, for testing products)
   ```bash
   npm run seed:categories
   ```

5. **Start server**
   ```bash
   npm run dev
   ```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login |
| POST | `/api/auth/refresh` | No | Refresh access token |
| GET | `/api/auth/me` | Yes | Get current user |
| POST | `/api/auth/logout` | Yes | Logout (revoke refresh token) |

### Products API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | No | List products (pagination, filters, sort) |
| GET | `/api/products/:id` | No | Get product by ID |
| POST | `/api/products` | Admin | Create product |
| PATCH | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |

**List products query params:** `page`, `limit`, `categoryId`, `status`, `brand`, `minPrice`, `maxPrice`, `search`, `sortBy` (name|price|created_at|stock_quantity), `sortOrder` (asc|desc)

**AI recommendations:** `GET /api/products/:id/recommendations?limit=5` — Returns top 5 similar products (cosine similarity on OpenAI embeddings). Requires `OPENAI_API_KEY`.

### Cart API (Auth required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get cart items |
| POST | `/api/cart/items` | Add to cart (`productId`, `quantity`) |
| PATCH | `/api/cart/items/:productId` | Update quantity |
| DELETE | `/api/cart/items/:productId` | Remove from cart |
| DELETE | `/api/cart` | Clear cart |

### Orders API (Auth required)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/orders` | User | Create order from cart |
| GET | `/api/orders` | User | Order history (query: `page`, `limit`) |
| GET | `/api/orders/:id` | User/Admin | Get order by ID |
| PATCH | `/api/orders/:id/status` | Admin | Update order status |

## Using Role Middleware

```javascript
import { authenticate } from './middlewares/authMiddleware.js';
import { adminOnly, authorize } from './middlewares/roleMiddleware.js';

// Admin only
router.get('/admin/users', authenticate, adminOnly, userController.list);

// Multiple roles
router.get('/dashboard', authenticate, authorize('admin', 'customer'), controller.dashboard);
```

## Request Examples

**Register**
```json
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass1!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Login**
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass1!"
}
```

**Refresh**
```json
POST /api/auth/refresh
{
  "refreshToken": "<refresh_token>"
}
```

**Logout** (send refreshToken to revoke single session, omit to revoke all)
```json
POST /api/auth/logout
Authorization: Bearer <access_token>
{
  "refreshToken": "<refresh_token>"  // optional
}
```
