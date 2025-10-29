import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';

export const DYNAMIC_PERMISSION_KEY = 'dynamicPermission';
export const DynamicPermission = (action: 'READ' | 'WRITE' | 'DELETE') =>
  Reflect.metadata(DYNAMIC_PERMISSION_KEY, action);

@Injectable()
export class DynamicPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredAction = this.reflector.getAllAndOverride<string>(
      DYNAMIC_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredAction) {
      // No permission requirement
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const dataKey = request.params.dataKey;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!dataKey) {
      throw new NotFoundException('Data key not provided');
    }

    // Verify data object exists
    const dataObject = await this.prisma.dataObject.findUnique({
      where: { dataKey, isActive: true },
    });

    if (!dataObject) {
      throw new NotFoundException(`Data object with key '${dataKey}' not found`);
    }

    // Check user permissions
    const hasPermission = await this.checkPermission(
      user.id,
      dataKey,
      requiredAction,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `You do not have ${requiredAction} permission for ${dataKey}`,
      );
    }

    return true;
  }

  /**
   * Check if user has specific permission for data object
   */
  private async checkPermission(
    userId: string,
    dataKey: string,
    action: string,
  ): Promise<boolean> {
    const permissionName = `${dataKey.toUpperCase()}:${action}`;

    // Get user's roles with permissions
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              where: { isActive: true },
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // Check if any role has the required permission
    for (const userRole of userRoles) {
      for (const rolePermission of userRole.role.rolePermissions) {
        if (rolePermission.permission.name === permissionName && rolePermission.permission.isActive) {
          return true;
        }
      }
    }

    return false;
  }
}
