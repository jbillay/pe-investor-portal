import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create permissions first
    console.log('📋 Creating permissions...');

    const permissions = [
      // User Management
      { name: 'CREATE_USER', description: 'Create new users', resource: 'USER', action: 'CREATE' },
      { name: 'VIEW_USER', description: 'View user details', resource: 'USER', action: 'READ' },
      { name: 'UPDATE_USER', description: 'Update user information', resource: 'USER', action: 'UPDATE' },
      { name: 'DELETE_USER', description: 'Delete users', resource: 'USER', action: 'DELETE' },

      // Role Management
      { name: 'CREATE_ROLE', description: 'Create new roles', resource: 'ROLE', action: 'CREATE' },
      { name: 'VIEW_ROLE', description: 'View role details', resource: 'ROLE', action: 'READ' },
      { name: 'UPDATE_ROLE', description: 'Update role information', resource: 'ROLE', action: 'UPDATE' },
      { name: 'DELETE_ROLE', description: 'Delete roles', resource: 'ROLE', action: 'DELETE' },
      { name: 'ASSIGN_ROLE', description: 'Assign roles to users', resource: 'ROLE', action: 'ASSIGN' },
      { name: 'REVOKE_ROLE', description: 'Revoke roles from users', resource: 'ROLE', action: 'REVOKE' },

      // Permission Management
      { name: 'CREATE_PERMISSION', description: 'Create new permissions', resource: 'PERMISSION', action: 'CREATE' },
      { name: 'VIEW_PERMISSION', description: 'View permission details', resource: 'PERMISSION', action: 'READ' },
      { name: 'UPDATE_PERMISSION', description: 'Update permission information', resource: 'PERMISSION', action: 'UPDATE' },
      { name: 'DELETE_PERMISSION', description: 'Delete permissions', resource: 'PERMISSION', action: 'DELETE' },

      // Dashboard Access
      { name: 'VIEW_ADMIN_DASHBOARD', description: 'Access admin dashboard', resource: 'DASHBOARD', action: 'READ' },
      { name: 'VIEW_INVESTOR_DASHBOARD', description: 'Access investor dashboard', resource: 'DASHBOARD', action: 'READ' },
      { name: 'VIEW_USER_DASHBOARD', description: 'Access user dashboard', resource: 'DASHBOARD', action: 'READ' },

      // Portfolio Management
      { name: 'CREATE_PORTFOLIO', description: 'Create new portfolios', resource: 'PORTFOLIO', action: 'CREATE' },
      { name: 'VIEW_PORTFOLIO', description: 'View portfolio details', resource: 'PORTFOLIO', action: 'READ' },
      { name: 'UPDATE_PORTFOLIO', description: 'Update portfolio information', resource: 'PORTFOLIO', action: 'UPDATE' },
      { name: 'DELETE_PORTFOLIO', description: 'Delete portfolios', resource: 'PORTFOLIO', action: 'DELETE' },

      // System Management
      { name: 'VIEW_AUDIT_LOGS', description: 'View system audit logs', resource: 'SYSTEM', action: 'READ' },
      { name: 'MANAGE_SYSTEM_SETTINGS', description: 'Manage system settings', resource: 'SYSTEM', action: 'MANAGE' },
      { name: 'VIEW_SYSTEM_METRICS', description: 'View system metrics', resource: 'SYSTEM', action: 'READ' },
    ];

    const createdPermissions = [];
    for (const permission of permissions) {
      const created = await prisma.permission.upsert({
        where: { name: permission.name },
        update: permission,
        create: permission,
      });
      createdPermissions.push(created);
    }

    console.log(`✅ Created ${createdPermissions.length} permissions`);

    // Create roles
    console.log('👑 Creating roles...');

    const roles = [
      {
        name: 'ADMIN',
        description: 'System administrator with full access to all features',
        isDefault: false,
        permissions: [
          // Full access to everything
          'CREATE_USER', 'VIEW_USER', 'UPDATE_USER', 'DELETE_USER',
          'CREATE_ROLE', 'VIEW_ROLE', 'UPDATE_ROLE', 'DELETE_ROLE', 'ASSIGN_ROLE', 'REVOKE_ROLE',
          'CREATE_PERMISSION', 'VIEW_PERMISSION', 'UPDATE_PERMISSION', 'DELETE_PERMISSION',
          'VIEW_ADMIN_DASHBOARD', 'VIEW_INVESTOR_DASHBOARD', 'VIEW_USER_DASHBOARD',
          'CREATE_PORTFOLIO', 'VIEW_PORTFOLIO', 'UPDATE_PORTFOLIO', 'DELETE_PORTFOLIO',
          'VIEW_AUDIT_LOGS', 'MANAGE_SYSTEM_SETTINGS', 'VIEW_SYSTEM_METRICS',
        ],
      },
      {
        name: 'INVESTOR',
        description: 'Investor with access to portfolio management and limited user features',
        isDefault: false,
        permissions: [
          'VIEW_USER',
          'VIEW_ROLE',
          'VIEW_PERMISSION',
          'VIEW_INVESTOR_DASHBOARD', 'VIEW_USER_DASHBOARD',
          'CREATE_PORTFOLIO', 'VIEW_PORTFOLIO', 'UPDATE_PORTFOLIO',
        ],
      },
      {
        name: 'USER',
        description: 'Basic user with limited access to personal features',
        isDefault: true, // This will be the default role for new users
        permissions: [
          'VIEW_USER_DASHBOARD',
          'VIEW_PORTFOLIO', // Can view their own portfolios
        ],
      },
    ];

    const createdRoles = [];
    for (const roleData of roles) {
      const { permissions: rolePermissions, ...roleInfo } = roleData;

      const role = await prisma.role.upsert({
        where: { name: roleData.name },
        update: roleInfo,
        create: roleInfo,
      });

      createdRoles.push(role);

      // Assign permissions to role
      console.log(`🔗 Assigning permissions to ${role.name} role...`);

      for (const permissionName of rolePermissions) {
        const permission = createdPermissions.find(p => p.name === permissionName);
        if (permission) {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: permission.id,
              },
            },
            update: { isActive: true },
            create: {
              roleId: role.id,
              permissionId: permission.id,
              isActive: true,
            },
          });
        }
      }
    }

    console.log(`✅ Created ${createdRoles.length} roles with permissions`);

    // Create a default admin user (optional - for development)
    if (process.env.NODE_ENV === 'development') {
      console.log('👤 Creating default admin user for development...');

      // Only create if no admin exists
      const existingAdmin = await prisma.user.findFirst({
        where: {
          userRoles: {
            some: {
              role: { name: 'ADMIN' },
              isActive: true,
            },
          },
        },
      });

      if (!existingAdmin) {
        const bcrypt = await import('bcrypt');
        const defaultPassword = 'AdminPassword123!';
        const hashedPassword = await bcrypt.hash(defaultPassword, 12);

        const adminUser = await prisma.user.create({
          data: {
            email: 'admin@pe-portal.com',
            password: hashedPassword,
            firstName: 'System',
            lastName: 'Administrator',
            isActive: true,
            isVerified: true,
          },
        });

        // Assign ADMIN role to the user
        const adminRole = createdRoles.find(r => r.name === 'ADMIN');
        if (adminRole) {
          await prisma.userRole.create({
            data: {
              userId: adminUser.id,
              roleId: adminRole.id,
              isActive: true,
            },
          });

          // Create role assignment record
          await prisma.roleAssignment.create({
            data: {
              userId: adminUser.id,
              roleId: adminRole.id,
              assignedBy: adminUser.id, // Self-assigned
              reason: 'Initial system admin setup',
              isActive: true,
            },
          });

          console.log(`✅ Created admin user: admin@pe-portal.com (password: ${defaultPassword})`);
          console.log('⚠️  Please change this password in production!');
        }
      } else {
        console.log('ℹ️  Admin user already exists, skipping creation');
      }
    }

    // Create sample investor user (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('💼 Creating sample investor user for development...');

      const existingInvestor = await prisma.user.findUnique({
        where: { email: 'investor@pe-portal.com' },
      });

      if (!existingInvestor) {
        const bcrypt = await import('bcrypt');
        const defaultPassword = 'InvestorPassword123!';
        const hashedPassword = await bcrypt.hash(defaultPassword, 12);

        const investorUser = await prisma.user.create({
          data: {
            email: 'investor@pe-portal.com',
            password: hashedPassword,
            firstName: 'Demo',
            lastName: 'Investor',
            isActive: true,
            isVerified: true,
          },
        });

        // Assign INVESTOR role
        const investorRole = createdRoles.find(r => r.name === 'INVESTOR');
        if (investorRole) {
          await prisma.userRole.create({
            data: {
              userId: investorUser.id,
              roleId: investorRole.id,
              isActive: true,
            },
          });

          await prisma.roleAssignment.create({
            data: {
              userId: investorUser.id,
              roleId: investorRole.id,
              assignedBy: investorUser.id, // Self-assigned for demo
              reason: 'Demo investor user setup',
              isActive: true,
            },
          });

          console.log(`✅ Created investor user: investor@pe-portal.com (password: ${defaultPassword})`);
        }
      } else {
        console.log('ℹ️  Investor user already exists, skipping creation');
      }

      // Create sample regular user
      console.log('👤 Creating sample regular user for development...');

      const existingUser = await prisma.user.findUnique({
        where: { email: 'user@pe-portal.com' },
      });

      if (!existingUser) {
        const bcrypt = await import('bcrypt');
        const defaultPassword = 'UserPassword123!';
        const hashedPassword = await bcrypt.hash(defaultPassword, 12);

        const regularUser = await prisma.user.create({
          data: {
            email: 'user@pe-portal.com',
            password: hashedPassword,
            firstName: 'Demo',
            lastName: 'User',
            isActive: true,
            isVerified: true,
          },
        });

        // Assign USER role (default role)
        const userRole = createdRoles.find(r => r.name === 'USER');
        if (userRole) {
          await prisma.userRole.create({
            data: {
              userId: regularUser.id,
              roleId: userRole.id,
              isActive: true,
            },
          });

          await prisma.roleAssignment.create({
            data: {
              userId: regularUser.id,
              roleId: userRole.id,
              assignedBy: regularUser.id, // Self-assigned for demo
              reason: 'Demo regular user setup',
              isActive: true,
            },
          });

          console.log(`✅ Created regular user: user@pe-portal.com (password: ${defaultPassword})`);
        }
      } else {
        console.log('ℹ️  Regular user already exists, skipping creation');
      }
    }

    // Log summary
    const totalUsers = await prisma.user.count();
    const totalRoles = await prisma.role.count();
    const totalPermissions = await prisma.permission.count();
    const totalRolePermissions = await prisma.rolePermission.count({ where: { isActive: true } });
    const totalUserRoles = await prisma.userRole.count({ where: { isActive: true } });

    console.log('\n📊 Seeding Summary:');
    console.log(`   Users: ${totalUsers}`);
    console.log(`   Roles: ${totalRoles}`);
    console.log(`   Permissions: ${totalPermissions}`);
    console.log(`   Role-Permission Assignments: ${totalRolePermissions}`);
    console.log(`   User-Role Assignments: ${totalUserRoles}`);

    console.log('\n🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });