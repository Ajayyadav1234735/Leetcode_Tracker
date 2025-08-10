# Render Deployment Checklist ✅

Use this checklist to deploy without any errors.

## Before You Start

### Prerequisites
- [ ] GitHub account with your code repository
- [ ] Render account (create free at https://render.com)
- [ ] Neon Database account (create free at https://neon.tech)
- [ ] All code committed and pushed to GitHub

## Step 1: Database Setup

- [ ] Created Neon project named `leetcode-tracker-production`
- [ ] Copied the pooled connection string (starts with `postgresql://`)
- [ ] Connection string includes `?sslmode=require&pgbouncer=true`

## Step 2: Render Configuration

### Service Creation
- [ ] Connected GitHub repository to Render
- [ ] Selected correct repository and branch (`main`)

### Build Settings (CRITICAL - Use Exact Commands)
- [ ] Build Command: `npm install && npm run build && node deploy-simple.cjs`
- [ ] Start Command: `npm start`
- [ ] Runtime: `Node`

### Environment Variables (REQUIRED)
- [ ] `DATABASE_URL` = Your Neon connection string
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `10000`

## Step 3: Deploy and Verify

### Deployment
- [ ] Clicked "Create Web Service"
- [ ] Build logs show "SUCCESS" messages for all directories
- [ ] Build completed without errors
- [ ] Service shows as "Live"

### Database Setup
- [ ] Opened Render Shell for your service
- [ ] Ran `npm run db:push` successfully
- [ ] Saw "✅ Your database is now in sync with your schema"

### Final Verification
- [ ] App loads at your Render URL
- [ ] No console errors in browser
- [ ] Admin dashboard accessible
- [ ] Can import student data
- [ ] LeetCode sync works

## If Something Goes Wrong

### Build Fails
1. Check you used the exact build command: `npm install && npm run build && node deploy-simple.cjs`
2. Verify all files are committed to GitHub
3. Check build logs for specific error messages

### Database Issues
1. Verify `DATABASE_URL` is correct and includes `?sslmode=require&pgbouncer=true`
2. Run `npm run db:push` in Render Shell
3. Check Neon database is active and not suspended

### App Won't Load
1. Check environment variables are set correctly
2. Verify `PORT=10000` is set
3. Check service logs in Render dashboard

## Success Indicators

✅ Build logs show:
```
Setting up deployment files...
SUCCESS: /opt/render/project/src/server/public
SUCCESS: /opt/render/project/src/client/dist
Deployment setup complete!
```

✅ App is accessible at your Render URL

✅ Database migration shows:
```
✅ Your database is now in sync with your schema
```

## Your Deployment URLs

After successful deployment, save these:
- **App URL**: `https://your-service-name.onrender.com`
- **Admin**: `https://your-service-name.onrender.com/admin`
- **API**: `https://your-service-name.onrender.com/api/students/all`

## Commands Reference

**Exact Build Command for Render:**
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

Follow this checklist step-by-step and your deployment will succeed without any errors!