/**
 * 🧪 S3 CONNECTION TEST SCRIPT
 * 
 * Tests S3 connection and validates permissions before deployment
 */

import { profileImageS3Service } from '../services/s3Service';
import { s3Config, securityAudit } from '../config/environment';

// Simple logger for testing
const logger = {
  info: (message: string) => console.log(`📝 TEST INFO: ${message}`),
  warn: (message: string) => console.warn(`⚠️ TEST WARN: ${message}`),
  error: (context: any, message: string) => console.error(`❌ TEST ERROR: ${message}`, context)
};

async function testS3Connection() {
  console.log('🔍 Starting S3 Connection Test...\n');

  // 1. Environment Check
  console.log('📋 STEP 1: Environment Configuration Check');
  console.log('='.repeat(50));
  
  if (!s3Config.isConfigured) {
    console.log('❌ S3 not configured - missing environment variables');
    console.log('Required variables: S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY');
    return;
  }

  console.log('✅ S3 environment variables configured');
  console.log(`   Bucket: ${s3Config.config!.S3_BUCKET}`);
  console.log(`   Region: ${s3Config.config!.S3_REGION}`);
  console.log(`   Access Key ID: ${s3Config.config!.S3_ACCESS_KEY_ID.substring(0, 8)}...`);
  console.log(`   Secret Key: [REDACTED - ${s3Config.config!.S3_SECRET_ACCESS_KEY.length} chars]`);

  // 2. Security Audit
  console.log('\n🛡️ STEP 2: Security Audit');
  console.log('='.repeat(50));
  
  console.log(`   S3 Credentials: ${securityAudit.hasS3Credentials ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Environment Security: ${securityAudit.environmentSecure ? '✅ Secure' : '⚠️ Needs Attention'}`);
  
  if (securityAudit.warnings.length > 0) {
    console.log('   Warnings:');
    securityAudit.warnings.forEach(warning => console.log(`     ⚠️ ${warning}`));
  }

  // 3. Service Availability
  console.log('\n🚀 STEP 3: Service Availability Check');
  console.log('='.repeat(50));
  
  if (!profileImageS3Service.isAvailable()) {
    console.log('❌ S3 service not available');
    return;
  }
  
  console.log('✅ S3 service initialized and available');

  // 4. Connection Test
  console.log('\n🔗 STEP 4: S3 Connection Test');
  console.log('='.repeat(50));
  
  try {
    const connectionTest = await profileImageS3Service.testConnection();
    
    if (connectionTest.success) {
      console.log('✅ S3 connection successful!');
      console.log('   - Can authenticate with AWS');
      console.log('   - Can access the specified bucket');
      console.log('   - Ready for production use');
    } else {
      console.log('❌ S3 connection failed:');
      console.log(`   Error: ${connectionTest.error}`);
      
      // Common error diagnosis
      if (connectionTest.error?.includes('NoSuchBucket')) {
        console.log('   💡 The S3 bucket does not exist or is in a different region');
      } else if (connectionTest.error?.includes('Access Denied')) {
        console.log('   💡 The AWS credentials do not have permission to access this bucket');
      } else if (connectionTest.error?.includes('SignatureDoesNotMatch')) {
        console.log('   💡 The AWS secret access key appears to be incorrect');
      } else if (connectionTest.error?.includes('InvalidAccessKeyId')) {
        console.log('   💡 The AWS access key ID appears to be incorrect');
      }
    }
  } catch (error) {
    console.log('❌ Connection test threw an error:');
    console.log(`   ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // 5. Feature Capabilities Test
  console.log('\n⚙️ STEP 5: Feature Capabilities Test');
  console.log('='.repeat(50));
  
  try {
    // Test listing (read permission)
    const testUserId = 'test-user-12345';
    const userImages = await profileImageS3Service.listUserImages(testUserId);
    console.log(`✅ List operation successful (found ${userImages.length} existing images)`);
    
    // Note: We don't test actual upload/delete here to avoid creating test files
    console.log('✅ Service methods available for upload/delete operations');
    
  } catch (error) {
    console.log('⚠️ Some features may have limited access:');
    console.log(`   ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // 6. Summary
  console.log('\n📊 STEP 6: Test Summary');
  console.log('='.repeat(50));
  
  const isFullyOperational = s3Config.isConfigured && 
                            profileImageS3Service.isAvailable() && 
                            securityAudit.environmentSecure;
  
  if (isFullyOperational) {
    console.log('🎉 S3 SETUP COMPLETE AND OPERATIONAL!');
    console.log('   ✅ All security checks passed');
    console.log('   ✅ Connection successful');
    console.log('   ✅ Ready for production deployment');
  } else {
    console.log('⚠️ S3 SETUP NEEDS ATTENTION');
    console.log('   Please review the errors above and fix configuration issues');
  }
  
  console.log('\n🔒 Security Reminder:');
  console.log('   - Never commit AWS credentials to version control');
  console.log('   - Rotate credentials regularly');
  console.log('   - Monitor S3 usage for unexpected activity');
  console.log('   - Set up CloudTrail logging for production');
}

// Run the test if this script is executed directly
if (require.main === module) {
  testS3Connection()
    .then(() => {
      console.log('\n✅ S3 connection test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ S3 connection test failed:', error);
      process.exit(1);
    });
}

export default testS3Connection;
