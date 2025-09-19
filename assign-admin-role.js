#!/usr/bin/env node

/**
 * Script to assign SUPER_ADMIN role to a user
 *
 * This script helps you assign the SUPER_ADMIN role to your user account
 * so you can access the admin interface.
 *
 * Usage:
 * 1. Make sure your backend is running (npm run start:dev in app/backend)
 * 2. Update the EMAIL and API_BASE_URL below
 * 3. Run: node assign-admin-role.js
 */

const https = require('https');
const http = require('http');

// Configuration - UPDATE THESE VALUES
const EMAIL = 'your-email@example.com'; // Change this to your email
const API_BASE_URL = 'http://localhost:3000'; // Change if your backend runs on different port
const USERNAME = 'your-username'; // Change this to your username if you have one
const PASSWORD = 'your-password'; // Change this to your password

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

// Step 1: First initialize the RBAC system
async function initializeRBAC(token) {
  log('🔧 Initializing RBAC system...', 'blue');

  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE_URL}/api/rbac-setup/initialize`);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const req = (url.protocol === 'https:' ? https : http).request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          const result = JSON.parse(data);
          log('✅ RBAC system initialized successfully!', 'green');
          log(`   - Permissions created: ${result.permissionsCreated}`, 'green');
          log(`   - Roles created: ${result.rolesCreated}`, 'green');
          log(`   - Role permissions assigned: ${result.rolePermissionsAssigned}`, 'green');
          resolve(result);
        } else {
          log(`❌ Failed to initialize RBAC: ${res.statusCode} - ${data}`, 'red');
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Step 2: Login to get access token
async function login() {
  log('🔐 Logging in...', 'blue');

  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE_URL}/api/auth/login`);

    const loginData = JSON.stringify({
      email: EMAIL,
      password: PASSWORD
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    const req = (url.protocol === 'https:' ? https : http).request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          const result = JSON.parse(data);
          log('✅ Login successful!', 'green');
          resolve(result.accessToken);
        } else {
          log(`❌ Login failed: ${res.statusCode} - ${data}`, 'red');
          reject(new Error(`Login failed: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(loginData);
    req.end();
  });
}

// Step 3: Get current user info
async function getCurrentUser(token) {
  log('👤 Getting current user info...', 'blue');

  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE_URL}/api/auth/profile`);

    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = (url.protocol === 'https:' ? https : http).request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const user = JSON.parse(data);
          log(`✅ Found user: ${user.email} (ID: ${user.id})`, 'green');
          resolve(user);
        } else {
          log(`❌ Failed to get user info: ${res.statusCode} - ${data}`, 'red');
          reject(new Error(`Failed to get user: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Step 4: Assign SUPER_ADMIN role
async function assignSuperAdminRole(token, userId) {
  log('🛡️  Assigning SUPER_ADMIN role...', 'blue');

  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE_URL}/api/user-roles/assign`);

    const roleData = JSON.stringify({
      userId: userId,
      roleName: 'SUPER_ADMIN',
      reason: 'Initial admin setup via script'
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(roleData)
      }
    };

    const req = (url.protocol === 'https:' ? https : http).request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          const result = JSON.parse(data);
          log('🎉 SUCCESS! SUPER_ADMIN role assigned!', 'green');
          resolve(result);
        } else {
          log(`❌ Failed to assign role: ${res.statusCode} - ${data}`, 'red');
          reject(new Error(`Failed to assign role: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(roleData);
    req.end();
  });
}

// Alternative method: Direct database approach
function printDatabaseMethod() {
  log('\n📋 Alternative Method: Direct Database Assignment', 'yellow');
  log('If the API method doesn\'t work, you can assign the role directly in the database:', 'yellow');
  log('');
  log('1. Connect to your PostgreSQL database', 'yellow');
  log('2. Find your user ID:', 'yellow');
  log(`   SELECT id, email FROM "User" WHERE email = '${EMAIL}';`, 'yellow');
  log('');
  log('3. Find the SUPER_ADMIN role ID:', 'yellow');
  log(`   SELECT id, name FROM "Role" WHERE name = 'SUPER_ADMIN';`, 'yellow');
  log('');
  log('4. Assign the role (replace USER_ID and ROLE_ID with actual values):', 'yellow');
  log(`   INSERT INTO "UserRole" ("userId", "roleId", "assignedBy", "assignedAt")`, 'yellow');
  log(`   VALUES ('USER_ID', 'ROLE_ID', 'SYSTEM', NOW());`, 'yellow');
  log('');
}

// Main execution
async function main() {
  log('🚀 SUPER_ADMIN Role Assignment Script', 'blue');
  log('=====================================', 'blue');

  // Validation
  if (EMAIL === 'your-email@example.com') {
    log('❌ Please update the EMAIL variable in the script with your actual email!', 'red');
    return;
  }

  if (PASSWORD === 'your-password') {
    log('❌ Please update the PASSWORD variable in the script with your actual password!', 'red');
    return;
  }

  try {
    // Step 1: Login
    const token = await login();

    // Step 2: Get user info
    const user = await getCurrentUser(token);

    // Step 3: Initialize RBAC system (this creates all roles and permissions)
    try {
      await initializeRBAC(token);
    } catch (error) {
      log('⚠️  RBAC initialization failed, but continuing with role assignment...', 'yellow');
      log('   This might be because RBAC is already initialized.', 'yellow');
    }

    // Step 4: Assign SUPER_ADMIN role
    await assignSuperAdminRole(token, user.id);

    log('');
    log('🎉 All done! You should now be able to:', 'green');
    log('   1. Refresh your frontend application', 'green');
    log('   2. See the "Administration" link in the navigation', 'green');
    log('   3. Access the admin interface at /admin', 'green');
    log('');

  } catch (error) {
    log('');
    log('❌ Script failed:', 'red');
    log(`   ${error.message}`, 'red');
    log('');
    printDatabaseMethod();
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}