const fetch = require('node-fetch');

const API_BASE = 'http://localhost:4000';
const ADMIN_SECRET = 'climbly_admin_secret_2024';

async function testNotifications() {
  console.log('🧪 Testing Phase 2 Notification Endpoints...\n');

  // Test 1: Admin Announce Endpoint - Success Case
  console.log('1️⃣ Testing /api/notifications/announce (SUCCESS)...');
  try {
    const announceResponse = await fetch(`${API_BASE}/api/notifications/announce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': ADMIN_SECRET
      },
      body: JSON.stringify({
        type: 'SYSTEM',
        title: 'Test Announcement',
        message: 'This is a test announcement from the admin endpoint'
      })
    });

    const announceData = await announceResponse.json();
    console.log('✅ Announce Response:', announceData);
    console.log('Status:', announceResponse.status);
    console.log('Success:', announceData.success);
    console.log('Users Found:', announceData.sentTo);
  } catch (error) {
    console.error('❌ Announce Error:', error.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: Admin Announce Endpoint - Missing Secret (Should Fail)
  console.log('2️⃣ Testing /api/notifications/announce (MISSING SECRET - Should Fail)...');
  try {
    const announceNoSecretResponse = await fetch(`${API_BASE}/api/notifications/announce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'SYSTEM',
        title: 'Test Announcement',
        message: 'This should fail without admin secret'
      })
    });

    const announceNoSecretData = await announceNoSecretResponse.json();
    console.log('✅ Announce No Secret Response:', announceNoSecretData);
    console.log('Status:', announceNoSecretResponse.status);
    console.log('Expected: 401 Unauthorized');
  } catch (error) {
    console.error('❌ Announce No Secret Error:', error.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 3: Create Notification with Admin Secret
  console.log('3️⃣ Testing /api/notifications/create with admin secret...');
  try {
    const createAdminResponse = await fetch(`${API_BASE}/api/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': ADMIN_SECRET
      },
      body: JSON.stringify({
        userId: 'test-user-123',
        type: 'TASK',
        title: 'Test Task Notification',
        message: 'This is a test task notification created with admin secret',
        metadata: {
          action: 'task_created',
          url: '/tasks/123'
        }
      })
    });

    const createAdminData = await createAdminResponse.json();
    console.log('✅ Create with Admin Secret Response:', createAdminData);
    console.log('Status:', createAdminResponse.status);
    console.log('Expected: 201 Created');
  } catch (error) {
    console.error('❌ Create with Admin Secret Error:', error.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 4: Create Notification without Auth (Should Fail)
  console.log('4️⃣ Testing /api/notifications/create without auth (Should Fail)...');
  try {
    const createNoAuthResponse = await fetch(`${API_BASE}/api/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'test-user-123',
        type: 'TASK',
        title: 'Test Task Notification',
        message: 'This should fail without auth'
      })
    });

    const createNoAuthData = await createNoAuthResponse.json();
    console.log('✅ Create No Auth Response:', createNoAuthData);
    console.log('Status:', createNoAuthResponse.status);
    console.log('Expected: 401 Unauthorized');
  } catch (error) {
    console.error('❌ Create No Auth Error:', error.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 5: Create Notification with Invalid JWT (Should Fail)
  console.log('5️⃣ Testing /api/notifications/create with invalid JWT (Should Fail)...');
  try {
    const createInvalidJWTResponse = await fetch(`${API_BASE}/api/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid.jwt.token'
      },
      body: JSON.stringify({
        type: 'TASK',
        title: 'Test Task Notification',
        message: 'This should fail with invalid JWT'
      })
    });

    const createInvalidJWTData = await createInvalidJWTResponse.json();
    console.log('✅ Create Invalid JWT Response:', createInvalidJWTData);
    console.log('Status:', createInvalidJWTResponse.status);
    console.log('Expected: 401 Unauthorized');
  } catch (error) {
    console.error('❌ Create Invalid JWT Error:', error.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 6: Health Check
  console.log('6️⃣ Testing /health endpoint...');
  try {
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health Response:', healthData);
    console.log('Status:', healthResponse.status);
    console.log('Expected: 200 OK');
  } catch (error) {
    console.error('❌ Health Error:', error.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 7: Get Notifications (Should Fail without Auth)
  console.log('7️⃣ Testing GET /api/notifications without auth (Should Fail)...');
  try {
    const getNotificationsResponse = await fetch(`${API_BASE}/api/notifications`);
    const getNotificationsData = await getNotificationsResponse.json();
    console.log('✅ Get Notifications Response:', getNotificationsData);
    console.log('Status:', getNotificationsResponse.status);
    console.log('Expected: 401 Unauthorized (requires JWT)');
  } catch (error) {
    console.error('❌ Get Notifications Error:', error.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');
  console.log('🎯 Test Summary:');
  console.log('✅ Admin announce endpoint should work with x-admin-secret');
  console.log('✅ Create endpoint should work with either admin secret or valid JWT');
  console.log('✅ All endpoints should properly reject unauthorized requests');
  console.log('✅ Router wiring should be correct (no global auth middleware)');
}

// Run tests
testNotifications().catch(console.error);
