# Render Deployment Setup - LeetCode Tracker

## Quick Start Guide

Your app is now configured for seamless Render deployment. Follow these steps:

### 1. Database Setup (Required First)

**Create Production Database:**
1. Go to [Neon Console](https://console.neon.tech/)
2. Create new project: "leetcode-tracker-production"
3. Copy the connection string (it looks like):
   ```
   postgresql://username:password@host.neon.tech/database?sslmode=require
   ```

### 2. Deploy to Render

**Quick Deploy:**
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Render will auto-detect the configuration from `render.yaml`

**Manual Configuration (if needed):**
- **Name**: leetcode-tracker
- **Runtime**: Node
- **Build Command**: `npm install && npm run build && node deploy-simple.cjs`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `NODE_ENV=production`
  - `PORT=10000`
  - `DATABASE_URL=<your-neon-connection-string>`

### 3. Environment Variables

In Render dashboard, add these environment variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | Your Neon connection string | Required |
| `NODE_ENV` | `production` | Required |
| `PORT` | `10000` | Required by Render |

### 4. Deploy and Verify

1. Click "Create Web Service"
2. Wait for build to complete (3-5 minutes)
3. Visit your app URL (provided by Render)
4. Run initial data sync from admin panel

## Files Created for Deployment

- ✅ `render.yaml` - Render service configuration
- ✅ `.nvmrc` - Node.js version specification
- ✅ `Procfile` - Process configuration
- ✅ `.gitignore` - Git ignore rules
- ✅ `deploy-simple.cjs` - Optimized deployment script

## Build Process

The app builds in this order:
1. `npm install` - Install dependencies
2. `npm run build` - Build frontend and backend
3. `node deploy-simple.cjs` - Copy assets to correct locations

## Troubleshooting

**Build Fails:**
- Check Node.js version (should be 20)
- Verify all environment variables are set
- Check build logs for specific errors

**App Won't Start:**
- Ensure `DATABASE_URL` is correctly set
- Check that database is accessible
- Verify `PORT=10000` is set

**Database Connection Issues:**
- Confirm Neon database is running
- Check connection string format
- Ensure SSL mode is enabled

## Post-Deployment Steps

1. **Access Admin Panel**: Use your admin credentials
2. **Initialize Data**: Import student data if needed
3. **Run Sync**: Start LeetCode data synchronization
4. **Test Features**: Verify all dashboards work correctly

## Security Notes

- Never commit `.env` files
- Use Render's environment variables for secrets
- Database uses SSL by default
- All API endpoints are protected with authentication

Your app is now ready for production deployment on Render!