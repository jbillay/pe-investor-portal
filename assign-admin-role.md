# How to Assign SUPER_ADMIN Role

You now have the admin route set up at `/admin`, but you need SUPER_ADMIN role to access it. Here are several ways to assign the SUPER_ADMIN role to your user:

## Method 1: Using the Node.js Script (Recommended)

1. **Edit the script configuration:**
   Open `assign-admin-role.js` and update these variables:
   ```javascript
   const EMAIL = 'your-actual-email@example.com';    // Your login email
   const PASSWORD = 'your-actual-password';          // Your login password
   const API_BASE_URL = 'http://localhost:3000';     // Your backend URL
   ```

2. **Run the script:**
   ```bash
   node assign-admin-role.js
   ```

   The script will:
   - Initialize the RBAC system (create all roles and permissions)
   - Login with your credentials
   - Find your user account
   - Assign the SUPER_ADMIN role to your user

## Method 2: Using cURL Commands

1. **First, login to get your access token:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "your-email@example.com",
       "password": "your-password"
     }'
   ```

   Copy the `accessToken` from the response.

2. **Initialize RBAC system (creates all roles):**
   ```bash
   curl -X POST http://localhost:3000/api/rbac-setup/initialize \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

3. **Get your user ID:**
   ```bash
   curl -X GET http://localhost:3000/api/auth/profile \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

   Copy the `id` from the response.

4. **Assign SUPER_ADMIN role:**
   ```bash
   curl -X POST http://localhost:3000/api/user-roles/assign \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -d '{
       "userId": "YOUR_USER_ID",
       "roleName": "SUPER_ADMIN",
       "reason": "Initial admin setup"
     }'
   ```

## Method 3: Direct Database Assignment

If the API methods don't work, you can assign the role directly in the database:

1. **Connect to your PostgreSQL database**

2. **Find your user ID:**
   ```sql
   SELECT id, email FROM "User" WHERE email = 'your-email@example.com';
   ```

3. **Find the SUPER_ADMIN role ID (or create it if it doesn't exist):**
   ```sql
   -- Check if role exists
   SELECT id, name FROM "Role" WHERE name = 'SUPER_ADMIN';

   -- If it doesn't exist, create it:
   INSERT INTO "Role" (id, name, description, "isDefault", "createdAt", "updatedAt")
   VALUES (gen_random_uuid(), 'SUPER_ADMIN', 'System administrators with full access', false, NOW(), NOW());
   ```

4. **Assign the role (replace USER_ID and ROLE_ID with actual values):**
   ```sql
   INSERT INTO "UserRole" ("userId", "roleId", "assignedBy", "assignedAt")
   VALUES ('YOUR_USER_ID', 'SUPER_ADMIN_ROLE_ID', 'SYSTEM', NOW());
   ```

## After Assigning the Role

Once you've successfully assigned the SUPER_ADMIN role:

1. **Refresh your frontend application** (Ctrl+F5 or restart the dev server)
2. **Look for the "Administration" link** in the navigation bar
3. **Click on it or navigate to** `http://localhost:5173/admin`

You should now see the full RBAC admin interface with:
- User Management tab with advanced DataTable
- Role Management tab
- Permission Matrix tab
- System Analytics tab

## Troubleshooting

**If you don't see the Administration link:**
- Check the browser console for any errors
- Verify that your user's roles include 'SUPER_ADMIN' by checking the auth store
- Make sure you've refreshed the page after role assignment

**If you get "Access Denied":**
- The role assignment might not have worked
- Try the database method as a fallback
- Check the browser console for detailed error messages

**If the RBAC initialization fails:**
- The roles might already exist
- Check your database connection
- Ensure your backend is running and accessible

## API Endpoints Overview

The admin interface uses these API endpoints (all require SUPER_ADMIN role):

- `/api/rbac-setup/initialize` - Initialize the complete RBAC system
- `/api/user-roles/assign` - Assign roles to users
- `/api/user-roles/effective-permissions/me` - Get current user permissions
- `/api/user-roles/check-access/me` - Check user access permissions

All endpoints are documented in the Swagger UI at `http://localhost:3000/api` when your backend is running.