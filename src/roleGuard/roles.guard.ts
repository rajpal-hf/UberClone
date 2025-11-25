
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'src/common/constants';
import { ROLES_KEY } from './roles.decorator';


@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) { }

	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		console.log("requiredRoles", requiredRoles)
		
		
		if (!requiredRoles) {
			return true;
		}
		const { user } = context.switchToHttp().getRequest(); 

		console.log("user", user)
		const hasRole = requiredRoles.some(role => user.role === role);

		console.log("hasRole", hasRole)

		if (!hasRole) {
			throw new ForbiddenException('You do not have the required role to access this resource');
		}
		
		return hasRole;
	}
}
