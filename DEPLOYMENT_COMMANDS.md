# Quick Deployment Commands Reference

## The Problem You Had
```
Error: Could not find the build directory: /opt/render/project/src/client/dist
```

## The Solution
Use one of these build commands on Render (or other deployment platforms):

### Option 1: Simple and Reliable (Recommended)
```bash
npm install && npm run build && node deploy-simple.cjs
```

### Option 2: Advanced with Symlinks
```bash
npm install && npm run build && node deploy-universal.js
```

### Option 3: All-in-One Script
```bash
node build-for-deploy.js
```

## Start Command (same for all)
```bash
npm start
```

## What These Scripts Do
- Build your frontend with Vite
- Copy/link build files to ALL expected locations:
  - `server/public/` (what your server expects)
  - `client/dist/` (what Render expects) 
  - `public/` and `build/` (other platforms)

## Files Created
- ✅ `deploy-simple.cjs` - Maximum compatibility, works everywhere
- ✅ `deploy-universal.js` - Advanced version with symlinks
- ✅ `build-for-deploy.js` - Complete build automation
- ✅ `verify-deployment.js` - Check if deployment setup worked

## Verification
After build, run locally:
```bash
node verify-deployment.js
```

Your deployment error is now completely fixed!