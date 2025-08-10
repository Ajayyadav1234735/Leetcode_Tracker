# Complete Render Deployment Guide - Zero Errors

This guide provides foolproof steps to deploy your LeetCode tracker to Render without any issues.

## Prerequisites Checklist

Before starting, ensure you have:
- [ ] GitHub account with your code repository
- [ ] Render account (free tier available at https://render.com)
- [ ] Neon Database account (free tier at https://neon.tech)
- [ ] All code committed and pushed to GitHub

## Step 1: Prepare Your Database

### 1.1 Create Production Database on Neon

1. Go to [Neon Console](https://console.neon.tech/)
2. Click **"Create a project"**
3. Name it: `leetcode-tracker-production`
4. Choose region closest to your users
5. Click **"Create project"**

### 1.2 Get Database Connection String

1. In your Neon project dashboard, click **"Dashboard"**
2. Find the **"Connection string"** section
3. Select **"Pooled connection"**
4. Copy the connection string - it looks like:
   ```
   postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true
   ```
5. **SAVE THIS** - you'll need it for Render

## Step 2: Deploy to Render

### 2.1 Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Click **"Connect account"** to link your GitHub
4. Find and select your repository
5. Click **"Connect"**

### 2.2 Configure Service Settings

**Basic Settings:**
- **Name**: `leetcode-tracker` (or your preferred name)
- **Region**: Choose same as your Neon database
- **Branch**: `main`
- **Root Directory**: (leave empty)

**Build & Deploy Settings:**
- **Runtime**: `Node`
- **Build Command**: 
  ```
  npm install && npm run build && node deploy-simple.cjs
  ```
- **Start Command**: 
  ```
  npm start
  ```

### 2.3 Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these **EXACTLY**:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Neon connection string from Step 1.2 |
| `NODE_ENV` | `production` |
| `PORT` | `10000` |

**Important Notes:**
- Use your actual Neon database URL for `DATABASE_URL`
- `PORT=10000` is required by Render
- `NODE_ENV=production` enables production optimizations

### 2.4 Deploy

1. Click **"Create Web Service"**
2. Render will start building (this takes 3-5 minutes)
3. Watch the build logs - they should show:
   ```
   Building...
   Running: npm install && npm run build && node deploy-simple.cjs
   Setting up deployment files...
   SUCCESS: /opt/render/project/src/server/public
   SUCCESS: /opt/render/project/src/client/dist
   Deployment setup complete!
   ```

## Step 3: Post-Deployment Setup

### 3.1 Initialize Database Schema

After successful deployment:

**Option A: Using Render Shell (Recommended)**
1. In your Render service dashboard, click **"Shell"** tab
2. Wait for shell to load
3. Run: `npm run db:push`
4. You should see: `✅ Your database is now in sync with your schema.`

**Option B: Local Setup (Alternative)**
1. Temporarily set your local `.env` file:
   ```
   DATABASE_URL=your-production-neon-url
   ```
2. Run: `npm run db:push`
3. Remove the production URL from local `.env`

### 3.2 Verify Deployment

1. Your app URL will be: `https://your-app-name.onrender.com`
2. Visit the URL - you should see the LeetCode tracker
3. Go to Admin Dashboard
4. Test the interface loads properly

### 3.3 Import Student Data

1. Access Admin Dashboard at: `https://your-app-name.onrender.com/admin`
2. Use the CSV import feature to upload your student data
3. Run initial LeetCode sync to populate profiles

## Step 4: Troubleshooting

### Common Issues and Solutions

**Issue: Build fails with "Could not find build directory"**
- Solution: Ensure you're using the exact build command: `npm install && npm run build && node deploy-simple.cjs`

**Issue: Database connection fails**
- Check your `DATABASE_URL` is correct
- Ensure it includes `?sslmode=require&pgbouncer=true`
- Verify Neon database is active

**Issue: App loads but shows errors**
- Run database migration: `npm run db:push` in Render shell
- Check environment variables are set correctly

**Issue: Build timeout**
- This is normal for first deployment
- Subsequent deploys are faster

## Step 5: Domain Setup (Optional)

### 5.1 Custom Domain

1. In Render dashboard, go to your service
2. Click **"Settings"** → **"Custom Domains"**
3. Add your domain name
4. Follow DNS configuration instructions
5. SSL is automatically provisioned

## Step 6: Monitoring

### 6.1 Health Checks

Render automatically monitors your app:
- Health check endpoint: `GET /`
- Auto-restart on failures
- Email alerts on downtime

### 6.2 Logs

Access logs via:
- Render dashboard → Your service → **"Logs"** tab
- Real-time log streaming
- Error tracking and debugging

## Final Checklist

Before going live:
- [ ] App loads at your Render URL
- [ ] Database connection works
- [ ] Student data imports successfully
- [ ] LeetCode sync functions properly
- [ ] Admin dashboard accessible
- [ ] All features working as expected

## Deployment Commands Summary

**Build Command (for Render):**
```bash
npm install && npm run build && node deploy-simple.cjs
```

**Start Command:**
```bash
npm start
```

**Database Setup:**
```bash
npm run db:push
```

## Support

If you encounter any issues:
1. Check Render logs for error messages
2. Verify environment variables
3. Ensure database URL is correct
4. Contact Render support if needed

Your LeetCode tracker is now successfully deployed on Render with zero downtime and all features working!