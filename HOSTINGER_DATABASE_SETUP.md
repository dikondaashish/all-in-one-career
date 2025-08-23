# 🗄️ Hostinger Database Migration Guide

## Step 1: Get Hostinger Database Details

1. **Login to Hostinger Control Panel**
2. **Navigate to**: Databases → MySQL Databases
3. **Create a new database** (if needed)
4. **Note down these details:**
   - **Host**: Usually `mysql.hostinger.com` or an IP address
   - **Database Name**: Your database name
   - **Username**: Your database username  
   - **Password**: Your database password
   - **Port**: Usually `3306`

## Step 2: Update Environment Variables

### Local Development (.env)
Update your `.env` file with the Hostinger MySQL connection:

```env
# Replace with your Hostinger database details
DATABASE_URL="mysql://username:password@mysql.hostinger.com:3306/database_name"

# Example:
# DATABASE_URL="mysql://u123456789_career:MySecurePass123@mysql.hostinger.com:3306/u123456789_career_db"
```

### Render Backend Service
Update your Render environment variables:

1. Go to **Render Dashboard** → Your API Service
2. Go to **Environment** tab
3. Update `DATABASE_URL` with your Hostinger MySQL connection string

## Step 3: Run Database Migration

After updating the connection string, run these commands:

```bash
# Generate new migration for MySQL
npx prisma migrate reset --force

# Push the schema to your new MySQL database
npx prisma db push

# Generate Prisma client for MySQL
npx prisma generate
```

## Step 4: Verify Connection

Test the connection:

```bash
# Check if database is accessible
npx prisma db seed

# View your database in Prisma Studio
npx prisma studio
```

## Step 5: Deploy Changes

1. **Commit the changes:**
   ```bash
   git add .
   git commit -m "MIGRATE: Switch from Neon PostgreSQL to Hostinger MySQL"
   git push origin master
   ```

2. **Redeploy Render services** (should auto-deploy on git push)

## Common Hostinger Database Formats

```bash
# Standard Hostinger format
DATABASE_URL="mysql://u123456789_dbname:password@mysql.hostinger.com:3306/u123456789_dbname"

# If using cPanel hosting
DATABASE_URL="mysql://username_dbname:password@servername.hostinger.com:3306/username_dbname"

# If using shared hosting
DATABASE_URL="mysql://username:password@localhost:3306/database_name"
```

## Troubleshooting

### Connection Issues
- ✅ Verify database credentials in Hostinger panel
- ✅ Check if remote connections are enabled
- ✅ Ensure your IP is whitelisted (if required)
- ✅ Test connection with a MySQL client first

### Migration Issues  
- ✅ Make sure old DATABASE_URL is completely replaced
- ✅ Clear any cached connections: `rm -rf node_modules/.prisma`
- ✅ Regenerate Prisma client: `npx prisma generate`

### Hostinger Specific
- ✅ Some Hostinger plans may have connection limits
- ✅ Database name usually includes your account prefix
- ✅ Remote access might need to be enabled in cPanel

## Benefits of Hostinger Migration

✅ **Cost Effective**: Included with hosting plan  
✅ **Integrated**: Same provider as your hosting  
✅ **Reliable**: Established hosting provider  
✅ **Control**: Full database access via cPanel  

## Data Migration (Optional)

If you want to preserve existing data from your previous database:

1. **Export from Previous Database:**
   ```bash
   # For PostgreSQL
   pg_dump "your_old_connection_string" > old_backup.sql
   ```

2. **Convert PostgreSQL to MySQL** (manual process if needed)
3. **Import to Hostinger** via phpMyAdmin or MySQL command line

**Note**: This is complex due to SQL dialect differences. Consider starting fresh if data isn't critical.
