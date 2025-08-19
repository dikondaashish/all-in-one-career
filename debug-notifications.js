// Debug script to test notification flow
const API_URL = 'https://all-in-one-career-api.onrender.com';
const ADMIN_SECRET = 'climbly_admin_secret_2024';

async function testNotificationFlow() {
  console.log('🧪 Testing notification flow...');
  
  try {
    // Step 1: Send admin announcement
    console.log('📢 Step 1: Sending admin announcement...');
    const announceResponse = await fetch(`${API_URL}/api/notifications/announce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': ADMIN_SECRET
      },
      body: JSON.stringify({
        type: 'FEATURE',
        title: 'Debug Test Notification',
        message: 'This is a test notification to debug the real-time flow'
      })
    });
    
    const announceData = await announceResponse.json();
    console.log('📢 Announcement response:', announceData);
    
    if (announceResponse.ok) {
      console.log('✅ Announcement sent successfully');
      
      // Step 2: Check if notification was created in DB
      console.log('🔍 Step 2: Checking if notification exists...');
      // Note: We can't directly query the DB from here, but we can check the response
      
      // Step 3: Test the notifications endpoint (this would require a user token)
      console.log('🔍 Step 3: Notifications endpoint would require user authentication');
      
    } else {
      console.error('❌ Announcement failed:', announceData);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testNotificationFlow();
