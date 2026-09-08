#!/bin/bash

# Adaptalyfe Database Migration Script
# Migrates PostgreSQL database from Replit/Neon to Railway

set -e  # Exit on any error

echo "🚀 Adaptalyfe Database Migration to Railway"
echo "=============================================="
echo ""

# Check if pg_dump and pg_restore are available
if ! command -v pg_dump &> /dev/null; then
    echo "❌ Error: pg_dump not found. Please install postgresql-client:"
    echo "   brew install postgresql (macOS)"
    echo "   sudo apt-get install postgresql-client (Linux)"
    exit 1
fi

# Step 1: Export current database
echo "📤 Step 1: Exporting current Replit database..."
echo "Source: $DATABASE_URL"
echo ""

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not set"
    exit 1
fi

BACKUP_FILE="adaptalyfe_backup_$(date +%Y%m%d_%H%M%S).dump"

pg_dump "$DATABASE_URL" -Fc -b -v -f "$BACKUP_FILE"

if [ -f "$BACKUP_FILE" ]; then
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup created: $BACKUP_FILE ($FILE_SIZE)"
else
    echo "❌ Backup failed"
    exit 1
fi

echo ""
echo "=============================================="
echo "✅ Export Complete!"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Go to Railway Dashboard: https://railway.app/dashboard"
echo "2. Open your project: adaptalyfe-cache-bust-production"
echo "3. Add PostgreSQL: Click '+ New' → 'Database' → 'Add PostgreSQL'"
echo "4. Get DATABASE_PUBLIC_URL from Variables tab"
echo "5. Run this command to import:"
echo ""
echo "   RAILWAY_DB_URL='<your-railway-database-public-url>' \\"
echo "   pg_restore -d \"\$RAILWAY_DB_URL\" -v $BACKUP_FILE"
echo ""
echo "6. Update environment variables in Railway:"
echo "   DATABASE_URL = \${{ Postgres.DATABASE_URL }}"
echo "   PGHOST = \${{ Postgres.PGHOST }}"
echo "   PGPORT = \${{ Postgres.PGPORT }}"
echo "   PGUSER = \${{ Postgres.PGUSER }}"
echo "   PGPASSWORD = \${{ Postgres.PGPASSWORD }}"
echo "   PGDATABASE = \${{ Postgres.PGDATABASE }}"
echo ""
echo "7. Redeploy your Railway app"
echo ""
echo "📁 Backup file: $BACKUP_FILE"
echo "=============================================="
