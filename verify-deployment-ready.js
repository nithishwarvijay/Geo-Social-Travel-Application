#!/usr/bin/env node

/**
 * Deployment Readiness Verification Script
 * Checks if all components are ready for deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Verifying Deployment Readiness...\n');
console.log('='.repeat(60));

let allChecks = true;
const results = [];

// Helper functions
function check(name, condition, message) {
  const status = condition ? '✅' : '❌';
  const result = `${status} ${name}`;
  console.log(result);
  if (!condition) {
    console.log(`   ⚠️  ${message}`);
    allChecks = false;
  }
  results.push({ name, passed: condition, message });
  return condition;
}

function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, filePath));
}

function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

console.log('\n📦 Checking Project Structure...\n');

check(
  'Server directory exists',
  fileExists('server'),
  'Server directory not found'
);

check(
  'Client directory exists',
  fileExists('client'),
  'Client directory not found'
);

check(
  'AI service directory exists',
  fileExists('server/ai-service'),
  'AI service directory not found'
);

console.log('\n📄 Checking Configuration Files...\n');

check(
  'Docker Compose file',
  fileExists('docker-compose.yml'),
  'docker-compose.yml not found'
);

check(
  'Server Dockerfile',
  fileExists('server/Dockerfile'),
  'server/Dockerfile not found'
);

check(
  'Client Dockerfile',
  fileExists('client/Dockerfile'),
  'client/Dockerfile not found'
);

check(
  'Nginx configuration',
  fileExists('client/nginx.conf'),
  'client/nginx.conf not found'
);

check(
  'Deployment script',
  fileExists('deploy.sh'),
  'deploy.sh not found'
);

console.log('\n📚 Checking Documentation...\n');

check(
  'Deployment Ready guide',
  fileExists('DEPLOYMENT_READY.md'),
  'DEPLOYMENT_READY.md not found'
);

check(
  'Deployment Guide',
  fileExists('DEPLOYMENT_GUIDE.md'),
  'DEPLOYMENT_GUIDE.md not found'
);

check(
  'Quick Deploy guide',
  fileExists('QUICK_DEPLOY.md'),
  'QUICK_DEPLOY.md not found'
);

check(
  'Production Checklist',
  fileExists('PRODUCTION_CHECKLIST.md'),
  'PRODUCTION_CHECKLIST.md not found'
);

console.log('\n🔧 Checking Dependencies...\n');

check(
  'Server package.json',
  fileExists('server/package.json'),
  'server/package.json not found'
);

check(
  'Client package.json',
  fileExists('client/package.json'),
  'client/package.json not found'
);

check(
  'AI requirements.txt',
  fileExists('server/ai-service/requirements.txt'),
  'server/ai-service/requirements.txt not found'
);

check(
  'Server node_modules',
  fileExists('server/node_modules'),
  'Run: cd server && npm install'
);

check(
  'Client node_modules',
  fileExists('client/node_modules'),
  'Run: cd client && npm install'
);

console.log('\n🐍 Checking Python Environment...\n');

check(
  'Virtual environment exists',
  fileExists('.venv'),
  'Run: python -m venv .venv'
);

check(
  'AI detector script',
  fileExists('server/ai-service/deepfake_detector.py'),
  'deepfake_detector.py not found'
);

console.log('\n⚙️  Checking Environment Templates...\n');

check(
  'Production env example',
  fileExists('.env.production.example'),
  '.env.production.example not found'
);

check(
  'Docker env example',
  fileExists('.env.docker.example'),
  '.env.docker.example not found'
);

check(
  'Client production env example',
  fileExists('client/.env.production.example'),
  'client/.env.production.example not found'
);

console.log('\n🔒 Checking Security Files...\n');

check(
  '.gitignore exists',
  fileExists('.gitignore'),
  '.gitignore not found'
);

check(
  '.dockerignore exists',
  fileExists('.dockerignore'),
  '.dockerignore not found'
);

console.log('\n🏥 Checking Health Endpoints...\n');

// Check if health check is in server code
const serverIndexPath = path.join(__dirname, 'server/index.js');
if (fileExists('server/index.js')) {
  const serverCode = fs.readFileSync(serverIndexPath, 'utf8');
  check(
    'Health check endpoint',
    serverCode.includes('/health'),
    'Health check endpoint not found in server/index.js'
  );
}

console.log('\n' + '='.repeat(60));

if (allChecks) {
  console.log('\n✅ ALL CHECKS PASSED! Your application is ready for deployment!\n');
  console.log('Next steps:');
  console.log('  1. Read DEPLOYMENT_READY.md');
  console.log('  2. Choose your deployment method');
  console.log('  3. Configure environment variables');
  console.log('  4. Deploy! 🚀\n');
  process.exit(0);
} else {
  console.log('\n❌ Some checks failed. Please fix the issues above.\n');
  console.log('Failed checks:');
  results
    .filter(r => !r.passed)
    .forEach(r => console.log(`  - ${r.name}: ${r.message}`));
  console.log('\n');
  process.exit(1);
}
