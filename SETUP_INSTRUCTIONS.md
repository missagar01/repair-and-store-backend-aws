# Setup Instructions for Indent Table

## Problem
The `indent` table does not exist in PostgreSQL (AWS RDS), causing the error:
```
relation "indent" does not exist
```

## Solution

### Step 1: Create the `indent` table in PostgreSQL

You have 3 options:

#### Option 1: Using psql (Recommended)
```bash
# Connect to your PostgreSQL database
psql -h <your-aws-rds-host> -U <username> -d <database-name>

# Then run the SQL:
\i src/migrations/create_indent_table.sql

# Or copy-paste the SQL from create_indent_table.sql
```

#### Option 2: Using pgAdmin or DBeaver
1. Connect to your AWS RDS PostgreSQL database
2. Open SQL Editor
3. Copy the contents of `backend/src/migrations/create_indent_table.sql`
4. Paste and execute

#### Option 3: Using Node.js script
```bash
cd backend
node src/scripts/create-indent-table.js
```

### Step 2: Verify Table Creation
```sql
-- Check if table exists
SELECT * FROM indent LIMIT 1;

-- If no error, table exists!
```

### Step 3: Start Backend Server
```bash
cd backend
npm start
```

The server should start on port 3004.

### Step 4: Test the API
Once backend is running, test:
```
GET http://localhost:3004/api/indent/all
```

## Important Notes

- ✅ All Oracle code has been removed from `indent.service.js`
- ✅ All functions now use PostgreSQL (AWS RDS) only
- ✅ The `indent` table must exist in PostgreSQL before the API will work
- ✅ Make sure your `.env` file has correct PostgreSQL connection details

## Environment Variables Required

Make sure your `backend/.env` has:
```
PG_HOST=your-aws-rds-endpoint.rds.amazonaws.com
PG_PORT=5432
PG_USER=your-username
PG_PASSWORD=your-password
PG_NAME=your-database-name
```

## Troubleshooting

1. **Backend not starting?**
   - Check if port 3004 is already in use
   - Check `.env` file has correct database credentials

2. **Table creation fails?**
   - Check database connection
   - Verify user has CREATE TABLE permissions
   - Check if table already exists (use `CREATE TABLE IF NOT EXISTS`)

3. **API still returns 500?**
   - Check backend console logs for specific error
   - Verify table was created successfully
   - Check database connection in `.env`









