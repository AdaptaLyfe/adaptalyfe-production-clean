#!/bin/bash

# Adaptalyfe Database Import Script for Railway
# Run this AFTER exporting your database and creating PostgreSQL on Railway

set -e

echo "📥 Adaptalyfe Database Import to Railway"
echo "=========================================="
echo ""

# Check if RAILWAY_DB_URL is provided
if [ -z "$1" ]; then
    echo "❌ Error: Railway database URL not provided"
    echo ""
    echo "Usage:"
    echo "  ./import-to-railway-db.sh '<RAILWAY_DATABASE_PUBLIC_URL>'"
    echo ""
    echo "Example:"
    echo "  ./import-to-railway-db.sh 'postgresql://postgres:pass@containers-us-west-15.railway.app:6473/railway'"
    echo ""
    echo "📋 Get your Railway DATABASE_PUBLIC_URL:"
    echo "  1. Go to Railway dashboard: https://railway.app/dashboard"
    echo "  2. Click on PostgreSQL service"
    echo "  3. Go to 'Variables' tab"
    echo "  4. Copy DATABASE_PUBLIC_URL value"
    exit 1
fi

RAILWAY_DB_URL="$1"

# Find the most recent backup file
BACKUP_FILE=$(ls -t adaptalyfe_backup_*.dump 2>/dev/null | head -1)

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Error: No backup file found"
    echo "Please run ./migrate-to-railway-db.sh first to export your database"
    exit 1
fi

echo "📁 Using backup file: $BACKUP_FILE"
echo "🎯 Target database: ${RAILWAY_DB_URL%%\?*}" | sed 's/:[^:@]*@/:***@/g'
echo ""

# Check if pg_restore is available
if ! command -v pg_restore &> /dev/null; then
    echo "❌ Error: pg_restore not found. Please install postgresql-client"
    exit 1
fi

echo "🔄 Starting import..."
echo ""

# Import the database
pg_restore -d "$RAILWAY_DB_URL" -v "$BACKUP_FILE"

echo ""
echo "=============================================="
echo "✅ Import Complete!"
echo ""
echo "📋 Verify the import:"
echo ""
echo "  psql '$RAILWAY_DB_URL' -c '\\dt'"
echo "  psql '$RAILWAY_DB_URL' -c 'SELECT COUNT(*) FROM \"User\";'"
echo "  psql '$RAILWAY_DB_URL' -c 'SELECT COUNT(*) FROM \"DailyTask\";'"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Update Railway environment variables:"
echo "   - Go to your Railway service → Variables tab"
echo "   - Add: DATABASE_URL = \${{ Postgres.DATABASE_URL }}"
echo "   - Add: PGHOST = \${{ Postgres.PGHOST }}"
echo "   - Add: PGPORT = \${{ Postgres.PGPORT }}"
echo "   - Add: PGUSER = \${{ Postgres.PGUSER }}"
echo "   - Add: PGPASSWORD = \${{ Postgres.PGPASSWORD }}"
echo "   - Add: PGDATABASE = \${{ Postgres.PGDATABASE }}"
echo ""
echo "2. Redeploy your Railway app"
echo ""
echo "3. Test: https://adaptalyfe-cache-bust-production.up.railway.app/"
echo ""
echo "=============================================="
