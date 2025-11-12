/**
 * Comprehensive Email System Testing Script
 * Tests SendGrid configuration, credentials, and email delivery
 */

// Step 1: Check environment variables
console.log('\n====================================');
console.log('STEP 1: Checking SendGrid Configuration');
console.log('====================================\n');

console.log('✓ SENDGRID_API_KEY exists:', !!process.env.SENDGRID_API_KEY);
console.log('✓ SENDGRID_API_KEY length:', process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.length : 0);
console.log('✓ FROM_EMAIL:', process.env.FROM_EMAIL || 'NOT SET');

if (!process.env.SENDGRID_API_KEY) {
  console.error('\n❌ SENDGRID_API_KEY is not set!');
  console.log('\nTo fix this:');
  console.log('1. Get your SendGrid API key from https://app.sendgrid.com/settings/api_keys');
  console.log('2. Set the environment variable SENDGRID_API_KEY');
  process.exit(1);
}

// Step 2: Test API call to test endpoint
console.log('\n====================================');
console.log('STEP 2: Testing Email Endpoint');
console.log('====================================\n');

async function testEmailEndpoint() {
  try {
    const response = await fetch('http://localhost:5000/api/test-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        testEmail: 'katlego@itshappening.africa'
      })
    });

    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ Email sent successfully!');
      console.log('Check inbox at:', data.details.to);
    } else {
      console.log('\n❌ Email failed to send');
      console.log('Error:', data.message);
      console.log('Details:', data.details);
    }
    
    return data;
  } catch (error) {
    console.error('\n❌ Error calling endpoint:', error);
    throw error;
  }
}

// Step 3: Instructions for checking SendGrid account
console.log('\n====================================');
console.log('STEP 3: SendGrid Account Verification');
console.log('====================================\n');

console.log('To verify your SendGrid account status:');
console.log('1. Go to https://app.sendgrid.com/');
console.log('2. Log in with your SendGrid credentials');
console.log('3. Check the following:');
console.log('   - Dashboard > API Keys (ensure key is active)');
console.log('   - Settings > Sender Authentication (verify FROM_EMAIL)');
console.log('   - Dashboard > Account Details (check credit balance)');
console.log('   - Activity > Recent Activity (check for failed sends)');

// Run the test
async function main() {
  // Wait for server to be ready
  console.log('\nWaiting for server to be ready...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const result = await testEmailEndpoint();
  
  console.log('\n====================================');
  console.log('TEST COMPLETE');
  console.log('====================================\n');
  
  if (result.success) {
    console.log('✅ ALL TESTS PASSED');
    console.log('\nNext steps:');
    console.log('1. Check email inbox at:', result.details.to);
    console.log('2. Verify email was delivered (check spam folder too)');
    console.log('3. If email not received, check SendGrid dashboard for errors');
  } else {
    console.log('❌ TESTS FAILED');
    console.log('\nTroubleshooting steps:');
    console.log('1. Verify SendGrid API key is correct');
    console.log('2. Check SendGrid account has available credits');
    console.log('3. Verify FROM_EMAIL is authenticated in SendGrid');
    console.log('4. Check server logs for detailed error messages');
  }
}

main().catch(console.error);
