/**
 * Email Templates Seed
 *
 * Seeds the database with default system email templates
 */

import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

const EMAIL_TEMPLATES = [
  {
    name: 'USER_ACCOUNT_CREATED',
    displayName: 'User Account Created',
    description: 'Welcome email sent when a new user account is created',
    category: 'ACCOUNT',
    subject: 'Welcome to {{platformName}}, {{firstName}}!',
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #1e40af; padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to {{platformName}}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1e40af; margin: 0 0 20px 0; font-size: 24px;">Hello {{firstName}}!</h2>
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                Your account has been successfully created. You now have access to the investor portal where you can:
              </p>
              <ul style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 20px 0; padding-left: 20px;">
                <li>View your investment portfolio</li>
                <li>Track capital calls and distributions</li>
                <li>Access important documents</li>
                <li>Review performance reports</li>
              </ul>
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
                Click the button below to access your account:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{loginUrl}}" style="display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-size: 16px; font-weight: bold;">
                      Access Your Account
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                If you have any questions, please contact our support team.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    textBody: `Welcome to {{platformName}}, {{firstName}}!

Your account has been successfully created. You now have access to the investor portal where you can:

- View your investment portfolio
- Track capital calls and distributions
- Access important documents
- Review performance reports

Access your account: {{loginUrl}}

If you have any questions, please contact our support team.`,
    variables: [
      { name: 'firstName', type: 'string', required: true, description: 'User first name', example: 'John' },
      { name: 'lastName', type: 'string', required: false, description: 'User last name', example: 'Doe' },
      { name: 'email', type: 'string', required: true, description: 'User email', example: 'john@example.com' },
      { name: 'platformName', type: 'string', required: true, description: 'Platform name', example: 'Investor Portal', defaultValue: 'Investor Portal' },
      { name: 'loginUrl', type: 'string', required: true, description: 'Login URL', example: 'https://portal.example.com/login' },
    ],
    isActive: true,
    isSystem: true,
  },
  {
    name: 'PASSWORD_RESET_REQUEST',
    displayName: 'Password Reset Request',
    description: 'Email sent when a user requests a password reset',
    category: 'ACCOUNT',
    subject: 'Reset your password for {{platformName}}',
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1e40af; margin: 0 0 20px 0; font-size: 24px;">Password Reset Request</h2>
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                Hello {{firstName}},
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="{{resetUrl}}" style="display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-size: 16px; font-weight: bold;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 20px 0 0 0;">
                This link will expire in {{expiresIn}}. If you didn't request a password reset, please ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #fef3c7; padding: 20px; border-top: 1px solid #fbbf24;">
              <p style="color: #92400e; font-size: 14px; margin: 0;">
                <strong>Security Notice:</strong> Never share your password reset link with anyone.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    textBody: `Password Reset Request

Hello {{firstName}},

We received a request to reset your password. Click the link below to create a new password:

{{resetUrl}}

This link will expire in {{expiresIn}}. If you didn't request a password reset, please ignore this email.

Security Notice: Never share your password reset link with anyone.`,
    variables: [
      { name: 'firstName', type: 'string', required: true, description: 'User first name', example: 'John' },
      { name: 'resetUrl', type: 'string', required: true, description: 'Password reset URL', example: 'https://portal.example.com/reset/token123' },
      { name: 'expiresIn', type: 'string', required: true, description: 'Expiration time', example: '24 hours', defaultValue: '24 hours' },
      { name: 'platformName', type: 'string', required: true, description: 'Platform name', example: 'Investor Portal', defaultValue: 'Investor Portal' },
    ],
    isActive: true,
    isSystem: true,
  },
  {
    name: 'DOCUMENT_PUBLISHED',
    displayName: 'New Document Published',
    description: 'Notification when a new document is published',
    category: 'DOCUMENT',
    subject: 'New Document: {{documentTitle}} - {{fundName}}',
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1e40af; margin: 0 0 20px 0; font-size: 24px;">📄 New Document Available</h2>
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                Hello {{firstName}},
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                A new document has been published for your review:
              </p>
              <table style="width: 100%; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin: 0 0 20px 0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Document</p>
                    <p style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px; font-weight: bold;">{{documentTitle}}</p>
                    <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">Type: {{documentType}}</p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">Fund: {{fundName}}</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{documentUrl}}" style="display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-size: 16px; font-weight: bold;">
                      View Document
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    textBody: `New Document Available

Hello {{firstName}},

A new document has been published for your review:

Document: {{documentTitle}}
Type: {{documentType}}
Fund: {{fundName}}

View the document: {{documentUrl}}`,
    variables: [
      { name: 'firstName', type: 'string', required: true, description: 'User first name', example: 'John' },
      { name: 'documentTitle', type: 'string', required: true, description: 'Document title', example: 'Q4 2024 Financial Statement' },
      { name: 'documentType', type: 'string', required: true, description: 'Document type', example: 'Financial Statement' },
      { name: 'fundName', type: 'string', required: true, description: 'Fund name', example: 'Growth Fund I' },
      { name: 'documentUrl', type: 'string', required: true, description: 'Document URL', example: 'https://portal.example.com/documents/123' },
      { name: 'publishedDate', type: 'date', required: false, description: 'Publication date', example: '2024-01-15' },
    ],
    isActive: true,
    isSystem: true,
  },
  {
    name: 'CAPITAL_CALL_NOTICE',
    displayName: 'Capital Call Notice',
    description: 'Notification for capital call requests',
    category: 'CAPITAL_CALL',
    subject: 'Capital Call Notice #{{callNumber}} - {{fundName}}',
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color: #dc2626; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">💰 Capital Call Notice</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                Dear {{firstName}},
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                This is an official capital call notice for:
              </p>
              <table style="width: 100%; background-color: #fef2f2; border: 2px solid #dc2626; border-radius: 6px; padding: 20px; margin: 0 0 20px 0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 10px 0; color: #7f1d1d; font-size: 14px; font-weight: bold;">FUND</p>
                    <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px; font-weight: bold;">{{fundName}}</p>
                    <table style="width: 100%;">
                      <tr>
                        <td style="padding: 8px 0;">
                          <p style="margin: 0; color: #6b7280; font-size: 14px;">Call Number:</p>
                        </td>
                        <td align="right" style="padding: 8px 0;">
                          <p style="margin: 0; color: #1f2937; font-size: 14px; font-weight: bold;">#{{callNumber}}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <p style="margin: 0; color: #6b7280; font-size: 14px;">Amount Called:</p>
                        </td>
                        <td align="right" style="padding: 8px 0;">
                          <p style="margin: 0; color: #dc2626; font-size: 18px; font-weight: bold;">\${{amountCalled}}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-top: 1px solid #fecaca;">
                          <p style="margin: 0; color: #6b7280; font-size: 14px;">Payment Due:</p>
                        </td>
                        <td align="right" style="padding: 8px 0; border-top: 1px solid #fecaca;">
                          <p style="margin: 0; color: #1f2937; font-size: 14px; font-weight: bold;">{{dueDate}}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                <strong>Purpose:</strong> {{purpose}}
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{noticeUrl}}" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-size: 16px; font-weight: bold;">
                      View Full Notice
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #fef3c7; padding: 20px; border-top: 1px solid #fbbf24;">
              <p style="color: #92400e; font-size: 14px; margin: 0;">
                <strong>Important:</strong> Please ensure payment is received by the due date to avoid late fees.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    textBody: `CAPITAL CALL NOTICE

Dear {{firstName}},

This is an official capital call notice for:

FUND: {{fundName}}
Call Number: #{{callNumber}}
Amount Called: \${{amountCalled}}
Payment Due: {{dueDate}}

Purpose: {{purpose}}

View full notice: {{noticeUrl}}

IMPORTANT: Please ensure payment is received by the due date to avoid late fees.`,
    variables: [
      { name: 'firstName', type: 'string', required: true, description: 'Investor first name', example: 'John' },
      { name: 'fundName', type: 'string', required: true, description: 'Fund name', example: 'Growth Fund I' },
      { name: 'callNumber', type: 'number', required: true, description: 'Call number', example: 5 },
      { name: 'amountCalled', type: 'currency', required: true, description: 'Amount called', example: '250,000.00' },
      { name: 'dueDate', type: 'date', required: true, description: 'Payment due date', example: '2024-02-15' },
      { name: 'purpose', type: 'string', required: true, description: 'Purpose of capital call', example: 'New investment opportunities' },
      { name: 'noticeUrl', type: 'string', required: true, description: 'Full notice URL', example: 'https://portal.example.com/capital-calls/123' },
    ],
    isActive: true,
    isSystem: true,
  },
];

async function seedEmailTemplates() {
  console.log('🌱 Seeding email templates...');

  // Get admin user for createdBy field (use first SUPER_ADMIN)
  const adminUser = await prisma.user.findFirst({
    where: {
      userRoles: {
        some: {
          role: {
            name: 'SUPER_ADMIN',
          },
        },
      },
    },
  });

  if (!adminUser) {
    console.log('⚠️  No SUPER_ADMIN user found. Skipping email template seeding.');
    console.log('   Please create a SUPER_ADMIN user first.');
    return;
  }

  for (const template of EMAIL_TEMPLATES) {
    const existing = await prisma.emailTemplate.findUnique({
      where: { name: template.name },
    });

    if (existing) {
      console.log(`  ℹ️  Template '${template.name}' already exists, skipping...`);
      continue;
    }

    await prisma.emailTemplate.create({
      data: {
        ...template,
        variables: template.variables as any,
        createdBy: adminUser.id,
      },
    });

    console.log(`  ✅ Created template: ${template.displayName}`);
  }

  console.log('✅ Email templates seeded successfully!');
}

// Run if called directly
if (require.main === module) {
  seedEmailTemplates()
    .catch((e) => {
      console.error('❌ Error seeding email templates:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { seedEmailTemplates };
