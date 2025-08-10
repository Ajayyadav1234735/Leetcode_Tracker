#!/usr/bin/env node

/**
 * Simple deployment script with maximum compatibility
 * Uses CommonJS for older Node.js environments
 */

const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const files = fs.readdirSync(src);
  
  for (const file of files) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function main() {
  const distPublicPath = path.resolve(__dirname, 'dist', 'public');
  const primaryTarget = path.resolve(__dirname, 'server', 'public');
  
  console.log('Setting up deployment files for Render...');
  console.log('Working directory:', process.cwd());
  console.log('Script directory:', __dirname);
  
  if (!fs.existsSync(distPublicPath)) {
    console.error('Error: Build directory not found at', distPublicPath);
    console.error('Please run "npm run build" first');
    process.exit(1);
  }
  
  console.log('Copying frontend assets to server/public...');
  copyDir(distPublicPath, primaryTarget);
  
  const hasIndex = fs.existsSync(path.join(primaryTarget, 'index.html'));
  if (!hasIndex) {
    console.error('CRITICAL: index.html not found in', primaryTarget);
    process.exit(1);
  }
  
  console.log('SUCCESS: Frontend assets copied to server/public');
  
  // Verify critical files exist
  const criticalFiles = ['index.html'];
  for (const file of criticalFiles) {
    const filePath = path.join(primaryTarget, file);
    if (!fs.existsSync(filePath)) {
      console.error(`CRITICAL: Missing ${file} in deployment`);
      process.exit(1);
    }
  }
  
  console.log('✅ Deployment setup complete - Ready for Render!');
}

main();