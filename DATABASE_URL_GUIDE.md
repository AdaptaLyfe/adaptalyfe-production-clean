# Database URL Format Guide

## Correct Railway PostgreSQL Database URL Format

A Railway PostgreSQL DATABASE_URL should look like this:

```
postgresql://postgres:PASSWORD@HOST:PORT/DATABASE_NAME
```

### Example Railway Database URLs:
```
postgresql://postgres:abc123xyz@monorail.proxy.rlwy.net:12345/railway
postgresql://postgres:secretpassword@containers-us-west-1.railway.app:5432/adaptalyfe
```

## Key Components:
- **Protocol**: `postgresql://` (always starts with this)
- **Username**: Usually `postgres`
- **Password**: Random generated password
- **Host**: Railway's database host (ends with `.railway.app` or `.rlwy.net`)
- **Port**: Usually `5432` or a custom port number
- **Database Name**: Usually `railway` or your project name

## How to Get Your Railway Database URL:

### Option 1: Railway Auto-Generated
1. Railway Dashboard → Add Service → PostgreSQL
2. Railway automatically creates DATABASE_URL
3. Copy from Variables tab in Railway dashboard

### Option 2: Manual Setup
If using existing database, ensure it follows the format above.

## Common Issues:
❌ **Wrong format**: `https://adaptalyfe-db-production.up.railway.app`
✅ **Correct format**: `postgresql://postgres:password@host:port/database`

❌ **Missing components**: `postgresql://host:port/database`
✅ **Complete format**: `postgresql://username:password@host:port/database`

## Testing Your Database URL:
Run this to test connection:
```bash
npm run db:push
```

If successful, your schema will sync to the database.