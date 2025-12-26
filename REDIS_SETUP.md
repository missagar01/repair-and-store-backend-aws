# Redis Caching Setup for Oracle Queries

## Overview
This project uses Redis caching to significantly improve Oracle query performance. All Oracle database queries are cached in Redis to reduce load times and database pressure.

## Configuration

### Environment Variables

Add this to your `.env` file:

```env
# Redis Configuration - Simple URL format (Recommended)
REDIS_URL=redis://127.0.0.1:6379
```

**OR use separate host/port (alternative):**
```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=your-password-if-any
```

### Example Configurations

**Local Development (Recommended):**
```env
REDIS_URL=redis://127.0.0.1:6379
```

**EC2 Redis (No Password):**
```env
REDIS_URL=redis://ec2-xxx-xxx-xxx-xxx.compute-1.amazonaws.com:6379
```

**EC2 Redis (With Password in URL):**
```env
REDIS_URL=redis://:your-password@ec2-xxx-xxx-xxx-xxx.compute-1.amazonaws.com:6379
```

**EC2 Redis (With Password separate):**
```env
REDIS_URL=redis://ec2-xxx-xxx-xxx-xxx.compute-1.amazonaws.com:6379
REDIS_PASSWORD=your-secure-password
```

**Full URL Format with Username:**
```env
REDIS_URL=redis://username:password@host:port
```

## Cache TTL (Time To Live)

Default cache expiration times:

- **Stock Data**: 5 minutes (300 seconds)
- **PO Data**: 3 minutes (180 seconds)
- **Indent Data**: 3 minutes (180 seconds)
- **Dashboard Metrics**: 2 minutes (120 seconds)
- **Gate Pass Data**: 3 minutes (180 seconds)
- **UOM Items**: 1 hour (3600 seconds) - rarely changes

## Services Using Redis Cache

### ✅ Integrated Services

1. **stockService.js** - Stock queries
2. **po.service.js** - Purchase Order queries (Pending & History)
3. **storeIndent.service.js** - Store Indent queries (Pending, History, Dashboard)
4. **repairGatePass.service.js** - Gate Pass queries (Pending, Received, Counts)
5. **uom.service.js** - UOM items list

## How It Works

### Cache Flow

1. **First Request**: Query Oracle → Store in Redis → Return data
2. **Subsequent Requests**: Check Redis → Return cached data (fast!)
3. **Cache Expiry**: After TTL, next request fetches from Oracle again

### Graceful Degradation

If Redis is unavailable:
- App continues to work normally
- Queries go directly to Oracle
- No errors thrown (graceful fallback)

## Cache Invalidation

Caches are automatically invalidated when:
- New indent is created
- Indent is approved

Manual invalidation:
```javascript
import { invalidateCache } from "./services/redisCache.js";

// Invalidate all stock caches
await invalidateCache("stock:*");

// Invalidate all indent caches
await invalidateCache("indent:*");
```

## Redis Connection

The Redis client:
- Auto-connects on server start
- Reconnects automatically if connection drops
- Uses exponential backoff for reconnection
- Logs connection status

## Testing Redis Connection

Check Redis connection in your server logs:
```
✅ Redis connected to 127.0.0.1:6379
✅ Redis client ready
```

If Redis is unavailable:
```
⚠️ Redis auto-connect failed (will retry on first use)
```

## Performance Benefits

### Before Redis:
- Oracle query: **500-2000ms** per request
- Multiple concurrent requests: **Slow, database overload**

### After Redis:
- Cache hit: **<10ms** (99% faster!)
- Cache miss: **500-2000ms** (first request only)
- Multiple concurrent requests: **Fast, no database overload**

## Production Checklist

- [ ] Redis server running on EC2
- [ ] Redis port (6379) open in security group
- [ ] Environment variables set correctly
- [ ] Redis password configured (if needed)
- [ ] Connection tested and working
- [ ] Cache TTL values reviewed for your use case

## Troubleshooting

### Redis Connection Failed
1. Check Redis server is running: `redis-cli ping`
2. Verify host/port in `.env`
3. Check EC2 security group allows port 6379
4. Verify network connectivity

### Cache Not Working
1. Check Redis connection logs
2. Verify environment variables
3. Check Redis server memory (may be full)
4. Review cache key patterns

### Slow Performance
1. Check Redis server resources (CPU, Memory)
2. Verify Redis is on same network/VPC
3. Review TTL values (may be too short)
4. Check for Redis connection errors

## Redis Commands (for debugging)

```bash
# Connect to Redis
redis-cli -h your-redis-host -p 6379

# Check all keys
KEYS *

# Get specific key
GET stock:01-JAN-25|31-DEC-25

# Check TTL
TTL stock:01-JAN-25|31-DEC-25

# Delete key
DEL stock:01-JAN-25|31-DEC-25

# Flush all (careful!)
FLUSHALL
```

## Cache Key Patterns

- `stock:{fromDate}|{toDate}` - Stock queries
- `po:pending` - Pending PO list
- `po:history` - PO history
- `indent:pending` - Pending indents
- `indent:history` - Indent history
- `indent:dashboard` - Dashboard metrics
- `gatepass:pending` - Pending gate passes
- `gatepass:received` - Received gate passes
- `gatepass:counts` - Gate pass counts
- `uom:items` - UOM items list

## Security Notes

1. **Redis Password**: Always use password in production
2. **Network**: Restrict Redis access to backend server only
3. **SSL/TLS**: Consider using Redis with SSL in production
4. **Firewall**: Only allow Redis port from trusted sources

## Support

For issues or questions:
1. Check server logs for Redis connection errors
2. Verify environment variables
3. Test Redis connection manually
4. Review this documentation

