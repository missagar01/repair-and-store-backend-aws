# How to Start Backend Server

## Quick Start

```bash
cd backend
npm start
```

The server will start on **port 3004** (matching frontend configuration).

## Before Starting

### 1. Create `indent` Table (if not exists)

Run the migration script to create the `indent` table in PostgreSQL:

```bash
cd backend
node src/scripts/create-indent-table.js
```

### 2. Check Environment Variables

Make sure your `backend/.env` file has:

```env
# PostgreSQL (AWS RDS) - Required for indent table
PG_HOST=your-aws-rds-endpoint.rds.amazonaws.com
PG_PORT=5432
PG_USER=your-username
PG_PASSWORD=your-password
PG_NAME=your-database-name
PG_SSL=true

# Server Port
PORT=3004

# Oracle (Optional - only if using Store features that need Oracle)
ORACLE_USER=your-oracle-user
ORACLE_PASSWORD=your-oracle-password
ORACLE_CONNECTION_STRING=your-oracle-connection-string
```

## Verify Server is Running

Once started, you should see:
```
🚀 Unified Backend Server running on port 3004
📡 API available at http://localhost:3004/api
```

Test the health endpoint:
```bash
curl http://localhost:3004/
```

Or open in browser: http://localhost:3004/

## Troubleshooting

### Port Already in Use
If port 3004 is already in use:
1. Change `PORT` in `.env` file
2. Update frontend `.env` to match

### Database Connection Error
- Check PostgreSQL credentials in `.env`
- Verify AWS RDS is accessible
- Check network/firewall settings

### Table Not Found Error
- Run the migration script: `node src/scripts/create-indent-table.js`
- Verify table exists: Connect to PostgreSQL and run `SELECT * FROM indent LIMIT 1;`









