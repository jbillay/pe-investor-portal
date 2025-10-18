/**
 * Test Email Script
 * Sends a test email using Ethereal Email
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { EmailService } from './src/email/services/email.service';

async function testEmail() {
  console.log('🚀 Starting email test...\n');

  // Create NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);
  const emailService = app.get(EmailService);

  try {
    // Test 1: Send a simple direct email
    console.log('📧 Test 1: Sending direct email...');
    const result1 = await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'Test Email from Investor Portal',
      html: `
        <h1>Welcome to Investor Portal</h1>
        <p>This is a test email to verify Ethereal Email integration.</p>
        <p>If you can see this, the email system is working correctly!</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is a test email sent from the development environment.
        </p>
      `,
      text: 'Welcome to Investor Portal\n\nThis is a test email to verify Ethereal Email integration.\n\nIf you can see this, the email system is working correctly!',
    });

    console.log('\n✅ Test 1 Result:', result1);

    // Test 2: Send a templated email (if template exists)
    console.log('\n📧 Test 2: Checking for available templates...');

    try {
      const result2 = await emailService.sendTemplatedEmail({
        templateName: 'user-password-reset',
        recipientEmail: 'investor@example.com',
        recipientName: 'Test Investor',
        variables: {
          userName: 'Test Investor',
          resetLink: 'https://investorportal.local/reset-password?token=test123',
          expiryTime: '1 hour',
        },
      });
      console.log('✅ Test 2 Result:', result2);
    } catch (error) {
      if (error instanceof Error) {
        console.log('⚠️  Template test skipped:', error.message);
      }
    }

    console.log('\n✨ Email testing completed successfully!');
    console.log('\n💡 Check your backend console logs for:');
    console.log('   - Ethereal account credentials');
    console.log('   - Email preview URLs');

  } catch (error) {
    console.error('\n❌ Email test failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run the test
testEmail()
  .then(() => {
    console.log('\n👋 Test completed, exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
