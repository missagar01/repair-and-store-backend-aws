# Unified Backend - Repair & Store System

Production-ready unified backend combining Repair Management and Store Management systems.

## Features

- **Unified Authentication**: Single JWT-based login system for both Repair and Store modules
- **Dual Database Support**: 
  - PostgreSQL for Repair system and Authentication
  - Oracle Database for Store system
- **RESTful**: Clean structure with proper routing
- **File Uploads**: AWS S3 integration for image/file uploads
- **Production Ready**: Optimized for EC2 deployment

## Project Structure

```
backend/
├── server.js                 # Main server entry point
├── package.json             # Dependencies
├── .env.example            # Environment variables template
├── src/
│   ├── config/             # Database configurations
│   │   ├── db.js          # Oracle DB config
│   │   ├── postgres.js    # PostgreSQL config (Repair)
│   │   ├── auth.js        # PostgreSQL config (Auth)
│   │   ├── db_dropdown.js # Dropdown database config
│   │   ├── oracleClient.js # Oracle client setup
│   │   └── redisClient.js  # Redis config
│   ├── routes/            # routes
│   │   ├── index.js       # Main router
│   │   ├── auth.routes.js # Authentication routes
│   │   ├── repairRoutes.js # Repair system routes
│   │   └── ...            # Other routes
│   ├── controllers/       # Request handlers
│   ├── services/          # Business logic
│   ├── middlewares/       # Middleware functions
│   └── utils/            # Utility functions
```

## Installation

1. **Clone and navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your actual database credentials and configuration.

## Environment Variables

See `.env.example` for all required environment variables. Key variables:

- `PORT`: Server port (default: 5000)
- `JWT_SECRET`: Secret key for JWT tokens
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: PostgreSQL credentials
- `PG_HOST`, `PG_USER`, `PG_PASSWORD`, `PG_NAME`: Login-specific PostgreSQL credentials (mirrors `DB_*` values in production).
- `ORACLE_USER`, `ORACLE_PASSWORD`, `ORACLE_CONNECTION_STRING`: Oracle credentials
- `AWS_*`: AWS S3 configuration for file uploads

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will start on the port specified in `PORT` environment variable (default: 5000).

## Endpoints

### Authentication
- `POST /api/auth/login` – JWT-based login shared by Repair and Store modules.

### Health & Readiness
- `GET /` – Root health check.
- `GET /api/health/pg` – PostgreSQL connectivity probe used by health monitoring.

### Store (Oracle-backed)s

#### Cost Locations
- `GET /api/cost-location/` – All cost locations (requires authentication).
- `GET /api/cost-location/rp` – RP division cost locations (requires authentication).
- `GET /api/cost-location/pm` – PM division cost locations (requires authentication).
- `GET /api/cost-location/co` – CO division cost locations where `DIV_CODE` is null (requires authentication).

#### Store Indents & Dashboard
- `POST /api/store-indent/` – Submit an indent request.
- `PUT /api/store-indent/approve` – Approve indents.
- `GET /api/store-indent/pending` – List pending indents (requires authentication).
- `GET /api/store-indent/pending/download` – Download pending indent report (requires authentication).
- `GET /api/store-indent/history` – List completed indents (requires authentication).
- `GET /api/store-indent/history/download` – Download history report (requires authentication).
- `GET /api/store-indent/dashboard` – Dashboard metrics for store indents (requires authentication).

#### Indents
- `GET /api/indent/` – Filtered list of indents.
- `GET /api/indent/all` – Unpaginated list of every indent.
- `GET /api/indent/filter` – Advanced filter endpoint.
- `GET /api/indent/status/:statusType` – List indents by status.
- `GET /api/indent/:requestNumber` – Fetch details for a single indent.
- `POST /api/indent/` – Submit a new indent.
- `PUT /api/indent/:requestNumber/status` – Update indent approval decision.

#### Purchase Orders
- `GET /api/po/pending` – Pending purchase orders (requires authentication).
- `GET /api/po/pending/download` – Download pending PO report (requires authentication).
- `GET /api/po/history` – Purchase order history (requires authentication).
- `GET /api/po/history/download` – Download history report (requires authentication).

#### Listings
- `GET /api/items` – Item master list (requires authentication).
- `GET /api/uom` – Units of measure master (requires authentication).
- `GET /api/stock` – Stock snapshot.

#### Vendor Management
- `GET /api/vendor-rate-update/pending` – Pending vendor rate updates.
- `GET /api/vendor-rate-update/history` – Vendor rate history.
- `POST /api/vendor-rate-update/` – Submit or update vendor rates.
- `GET /api/three-party-approval/pending` – List of pending approvals.
- `GET /api/three-party-approval/history` – Approval history.
- `POST /api/three-party-approval/approve` – Approve a vendor rate update.

### Repair (PostgreSQL-backed)s

- `GET / ` – List repair tasks.
- `POST /api/repair/create` – Create a repair task (supports an `image` upload field).
- `GET /api/repair-options/form-options` – Dropdown form data for repair forms.
- `GET /api/repair-check/all` – All repair check tasks.
- `GET /api/repair-check/pending` – Pending repair checks.
- `GET /api/repair-check/history` – Repair check history.
- `POST /api/repair-check/upload-bill` – Upload a bill image to S3 (expects multipart `file` field).
- `PUT /api/repair-check/update/:taskNo` – Update a repair check task.
- `GET /api/repair-system/all` – All items sent to vendor.
- `GET /api/repair-system/pending` – Pending vendor tasks.
- `GET /api/repair-system/history` – Vendor task history.
- `PUT /api/repair-system/update/:taskNo` – Update vendor tasks (`transportingImage` upload allowed).
- `GET /api/store-in/all` – List rows from the repair store-in table.
- `PUT /api/store-in/update/:taskNo` – Update store-in details.
- `POST /api/store-in/upload-product` – Upload a product image to S3 (multipart `file`).
- `GET /api/dashboard` – Repair dashboard metrics.
- `GET /api/payment/pending` – Pending payments.
- `GET /api/payment/history` – Payment history.
- `POST /api/payment/add` – Add a payment.

### Repair Gate Pass
- `GET /api/repair-gate-pass/pending` – List gate passes still pending dispatch.
- `GET /api/repair-gate-pass/received` – List gate passes that have been received.
- `GET /api/repair-gate-pass/history` – Alias for the received gate pass list endpoint.
- `GET /api/repair-gate-pass/counts` – Aggregate counts for pending and received gate passes.

## Database Setup

### PostgreSQL
The system uses PostgreSQL for:
- User authentication
- Repair system data
- Dropdown options

Ensure your PostgreSQL database is accessible and credentials are correct in `.env`.

### Oracle Database
The system uses Oracle Database for:
- Store system data
- Stock management
- Purchase orders

Ensure Oracle Instant Client is installed and configured. Set the library path in `.env`:
- Windows: `ORACLE_WIN_CLIENT_LIB_DIR`
- Linux: `ORACLE_LINUX_CLIENT_LIB_DIR`

## Deployment on EC2

1. **SSH into your EC2 instance:**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

2. **Install Node.js and dependencies:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install Oracle Instant Client (for Linux):**
   ```bash
   # Follow Oracle Instant Client installation guide
   # Set ORACLE_LINUX_CLIENT_LIB_DIR in .env
   ```

4. **Clone and setup:**
   ```bash
   git clone <your-repo>
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with production values
   ```

5. **Run with PM2 (recommended):**
   ```bash
   npm install -g pm2
   pm2 start server.js --name unified-backend
   pm2 save
   pm2 startup
   ```

6. **Configure Nginx (optional):**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

The token is obtained by logging in at `POST /auth/login`.

## Error Handling

The returns consistent error responses:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Logging

Server logs include:
- Database connection status
- request/response logs
- Error messages

## Security Notes

- Always use strong `JWT_SECRET` in production
- Use HTTPS in production
- Keep database credentials secure
- Regularly update dependencies
- Use environment variables for sensitive data

## Support

For issues or questions, please check the logs and ensure all environment variables are correctly set.







