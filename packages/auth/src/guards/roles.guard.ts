import {
	type CanActivate,
	type ExecutionContext,
	Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { UserTier } from "@xidoke/types";
import { ROLES_KEY } from "../decorators/roles.decorator";
import type { AuthenticatedUser } from "../interfaces/jwt-payload.interface";

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<UserTier[]>(
			ROLES_KEY,
			[context.getHandler(), context.getClass()],
		);

		if (!requiredRoles || requiredRoles.length === 0) {
			return true;
		}

		const request = context.switchToHttp().getRequest();
		const user = request.user as AuthenticatedUser;

		return requiredRoles.some((role) => user.tier === role);
	}
}
