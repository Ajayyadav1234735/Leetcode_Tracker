#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Checks all necessary files and configurations for Render deployment
 */

const fs = require('fs');
const path = require('path');

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${description}: ${filePath}`);
  return exists;
}

function checkBuildOutput() {
  const distPublic = path.resolve(__dirname, 'dist', 'public');
  const serverPublic = path.resolve(__dirname, 'server', 'public');
  
  console.log('\n📦 Build Output Verification:');
  
  const distExists = checkFile(distPublic, 'Frontend build directory');
  const serverExists = checkFile(serverPublic, 'Server public directory');
  
  if (distExists) {
    checkFile(path.join(distPublic, 'index.html'), 'Frontend index.html');
    checkFile(path.join(distPublic, 'assets'), 'Frontend assets directory');
  }
  
  if (serverExists) {
    checkFile(path.join(serverPublic, 'index.html'), 'Server index.html');
    checkFile(path.join(serverPublic, 'assets'), 'Server assets directory');
  }
  
  return distExists && serverExists;
}

function checkEnvironmentFiles() {
  console.log('\n🔧 Environment Configuration:');
  
  checkFile('.env.example', 'Environment template');
  
  console.log('\n📋 Required Environment Variables for Production:');
  console.log('   • DATABASE_URL - PostgreSQL connection string');
  console.log('   • NODE_ENV=production');
  console.log('   • PORT=10000 (required by Render)');
}

function main() {
  console.log('🚀 LeetCode Tracker - Deployment Verification\n');
  
  console.log('📋 Deployment Configuration Files:');
  const configFiles = [
    ['render.yaml', 'Render service configuration'],
    ['deploy-simple.cjs', 'Deployment script'],
    ['.nvmrc', 'Node.js version specification'],
    ['Procfile', 'Process configuration'],
    ['healthcheck.js', 'Health check script'],
    ['app.json', 'Platform compatibility'],
    ['.gitignore', 'Git ignore rules']
  ];
  
  let allConfigsPresent = true;
  for (const [file, desc] of configFiles) {
    if (!checkFile(file, desc)) {
      allConfigsPresent = false;
    }
  }
  
  console.log('\n📚 Documentation:');
  checkFile('README.md', 'Main documentation');
  checkFile('RENDER_DEPLOYMENT_SETUP.md', 'Deployment guide');
  checkFile('replit.md', 'Project documentation');
  
  const buildOutputValid = checkBuildOutput();
  checkEnvironmentFiles();
  
  console.log('\n🎯 Package Configuration:');
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const hasRequiredScripts = packageJson.scripts.build && packageJson.scripts.start;
  console.log(`${hasRequiredScripts ? '✅' : '❌'} Build and start scripts: present`);
  
  console.log('\n📊 Summary:');
  console.log(`Configuration Files: ${allConfigsPresent ? '✅ All present' : '❌ Missing files'}`);
  console.log(`Build Output: ${buildOutputValid ? '✅ Ready' : '❌ Need to run build'}`);
  console.log(`Package Scripts: ${hasRequiredScripts ? '✅ Ready' : '❌ Missing scripts'}`);
  
  if (allConfigsPresent && buildOutputValid && hasRequiredScripts) {
    console.log('\n🎉 READY FOR DEPLOYMENT!');
    console.log('\nNext steps:');
    console.log('1. Create Neon database and get connection string');
    console.log('2. Deploy to Render with environment variables');
    console.log('3. Visit deployed app and complete setup');
    console.log('\nSee RENDER_DEPLOYMENT_SETUP.md for detailed instructions.');
  } else {
    console.log('\n⚠️  Please fix the issues above before deploying.');
  }
}

main();