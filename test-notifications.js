const fetch = require('node-fetch');

const API_BASE = 'http://localhost:4000';
const ADMIN_SECRET = 'climbly_admin_secret_2024';

async function testNotifications() {
  console.log('🧪 Testing Notification Endpoints...\n');

  // Test 1: Admin Announce Endpoint
  console.log('1️⃣ Testing /api/notifications/announce...');
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
  } catch (error) {
    console.error('❌ Announce Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Create Notification with Admin Secret
  console.log('2️⃣ Testing /api/notifications/create with admin secret...');
  try {
    const createResponse = await fetch(`${API_BASE}/api/notifications`, {
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

    const createData = await createResponse.json();
    console.log('✅ Create Response:', createData);
    console.log('Status:', createResponse.status);
  } catch (error) {
    console.error('❌ Create Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Create Notification without Auth (should fail)
  console.log('3️⃣ Testing /api/notifications/create without auth (should fail)...');
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
  } catch (error) {
    console.error('❌ Create No Auth Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Health Check
  console.log('4️⃣ Testing /health endpoint...');
  try {
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health Response:', healthData);
    console.log('Status:', healthResponse.status);
  } catch (error) {
    console.error('❌ Health Error:', error.message);
  }
}

// Run tests
testNotifications().catch(console.error);
