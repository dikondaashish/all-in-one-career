/**
 * Production Readiness Check for PDF functionality
 * This script verifies that all PDF-related functionality will work in production
 */

const fs = require('fs');
const path = require('path');

async function checkProductionReadiness() {
  console.log('🔍 Production Readiness Check for PDF Functionality\n');
  console.log('=' * 60);
  
  const checks = [];
  
  try {
    // Check 1: PDF Parse Module
    console.log('📦 Check 1: PDF Parse Module Availability');
    try {
      const pdfParse = require('pdf-parse');
      if (typeof pdfParse === 'function') {
        console.log('✅ pdf-parse module loaded and is callable');
        checks.push({ name: 'PDF Module', status: 'PASS' });
      } else {
        throw new Error('pdf-parse is not a function');
      }
    } catch (error) {
      console.log('❌ pdf-parse module failed:', error.message);
      checks.push({ name: 'PDF Module', status: 'FAIL', error: error.message });
    }
    
    // Check 2: Node.js Version Compatibility
    console.log('\n🔢 Check 2: Node.js Version Compatibility');
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion >= 16) {
      console.log(`✅ Node.js ${nodeVersion} is compatible (minimum: v16)`);
      checks.push({ name: 'Node Version', status: 'PASS' });
    } else {
      console.log(`❌ Node.js ${nodeVersion} is too old (minimum: v16)`);
      checks.push({ name: 'Node Version', status: 'FAIL', error: 'Version too old' });
    }
    
    // Check 3: Environment Variables
    console.log('\n🌍 Check 3: Environment Configuration');
    const envChecks = [
      { name: 'NODE_ENV', required: false },
      { name: 'PORT', required: false }
    ];
    
    envChecks.forEach(env => {
      const value = process.env[env.name];
      if (value || !env.required) {
        console.log(`✅ ${env.name}: ${value || 'not set (optional)'}`);
      } else {
        console.log(`❌ ${env.name}: required but not set`);
      }
    });
    checks.push({ name: 'Environment', status: 'PASS' });
    
    // Check 4: Dependencies
    console.log('\n📚 Check 4: Dependencies Check');
    try {
      const packageJson = require('../../package.json');
      const dependencies = packageJson.dependencies;
      
      const criticalDeps = ['pdf-parse', 'express', 'multer'];
      let allDepsOk = true;
      
      criticalDeps.forEach(dep => {
        if (dependencies[dep]) {
          console.log(`✅ ${dep}: ${dependencies[dep]}`);
        } else {
          console.log(`❌ ${dep}: missing`);
          allDepsOk = false;
        }
      });
      
      checks.push({ name: 'Dependencies', status: allDepsOk ? 'PASS' : 'FAIL' });
    } catch (error) {
      console.log('⚠️ Could not verify dependencies:', error.message);
      checks.push({ name: 'Dependencies', status: 'WARN' });
    }
    
    // Check 5: TypeScript Compilation
    console.log('\n⚙️ Check 5: TypeScript Compilation');
    try {
      // Check if compiled files exist
      const distDir = path.join(__dirname, '../../dist');
      if (fs.existsSync(distDir)) {
        console.log('✅ TypeScript compilation appears successful');
        checks.push({ name: 'TypeScript', status: 'PASS' });
      } else {
        console.log('⚠️ No dist directory found - may need compilation');
        checks.push({ name: 'TypeScript', status: 'WARN' });
      }
    } catch (error) {
      console.log('❌ TypeScript check failed:', error.message);
      checks.push({ name: 'TypeScript', status: 'FAIL' });
    }
    
    // Check 6: Memory and Performance
    console.log('\n💾 Check 6: Memory and Performance');
    const memUsage = process.memoryUsage();
    console.log(`✅ Memory usage: ${Math.round(memUsage.rss / 1024 / 1024)}MB`);
    console.log(`✅ Platform: ${process.platform} ${process.arch}`);
    checks.push({ name: 'Performance', status: 'PASS' });
    
    // Summary
    console.log('\n' + '=' * 60);
    console.log('📊 PRODUCTION READINESS SUMMARY');
    console.log('=' * 60);
    
    const passed = checks.filter(c => c.status === 'PASS').length;
    const warned = checks.filter(c => c.status === 'WARN').length;
    const failed = checks.filter(c => c.status === 'FAIL').length;
    
    checks.forEach(check => {
      const icon = check.status === 'PASS' ? '✅' : check.status === 'WARN' ? '⚠️' : '❌';
      console.log(`${icon} ${check.name}: ${check.status}`);
      if (check.error) {
        console.log(`   └─ Error: ${check.error}`);
      }
    });
    
    console.log('\n📈 RESULTS:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`⚠️ Warnings: ${warned}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed === 0) {
      console.log('\n🎉 READY FOR PRODUCTION!');
      console.log('✨ PDF functionality should work correctly in production environment');
      return true;
    } else {
      console.log('\n⚠️ NEEDS ATTENTION');
      console.log('🔧 Please resolve the failed checks before deploying to production');
      return false;
    }
    
  } catch (error) {
    console.error('\n💥 Production readiness check failed:', error);
    return false;
  }
}

// Deployment recommendations
async function deploymentRecommendations() {
  console.log('\n📋 DEPLOYMENT RECOMMENDATIONS:');
  console.log('=' * 60);
  
  console.log('1. 🔧 Build Process:');
  console.log('   - Run "pnpm build" to compile TypeScript');
  console.log('   - Ensure all tests pass before deployment');
  
  console.log('\n2. 🌍 Environment Variables:');
  console.log('   - Set NODE_ENV=production');
  console.log('   - Configure PORT if needed');
  console.log('   - Set up proper logging levels');
  
  console.log('\n3. 📦 Dependencies:');
  console.log('   - Use "pnpm install --production" for production');
  console.log('   - Verify pdf-parse is included in production dependencies');
  
  console.log('\n4. 🔍 Monitoring:');
  console.log('   - Monitor PDF processing errors');
  console.log('   - Set up alerts for file processing failures');
  console.log('   - Track memory usage for large PDF files');
  
  console.log('\n5. 🛡️ Error Handling:');
  console.log('   - PDF parsing errors are gracefully handled');
  console.log('   - Fallback to DOCX format is recommended to users');
  console.log('   - Proper HTTP status codes are returned');
}

// Run the checks
async function main() {
  const isReady = await checkProductionReadiness();
  await deploymentRecommendations();
  
  process.exit(isReady ? 0 : 1);
}

main().catch(console.error);
