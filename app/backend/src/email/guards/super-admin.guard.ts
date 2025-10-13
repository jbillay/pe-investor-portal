/**
 * Super Admin Guard
 *
 * Ensures only SUPER_ADMIN role can access email template management
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * Super Admin Guard
 * Restricts access to SUPER_ADMIN role only
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get user roles
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      include: {
        role: true,
      },
    });

    // Check if user has SUPER_ADMIN role
    const isSuperAdmin = userRoles.some(
      (ur) => ur.role.name === 'SUPER_ADMIN' && ur.role.isActive,
    );

    if (!isSuperAdmin) {
      throw new ForbiddenException(
        'Only SUPER_ADMIN can access email template management',
      );
    }

    return true;
  }
}
