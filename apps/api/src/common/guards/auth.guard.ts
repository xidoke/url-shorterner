import {
	type CanActivate,
	type ExecutionContext,
	Injectable,
} from "@nestjs/common";

/**
 * Authentication Guard
 * Placeholder for JWT authentication
 *
 * TODO: Implement JWT token verification
 */
@Injectable()
export class AuthGuard implements CanActivate {
	canActivate(_context: ExecutionContext): boolean {
		// TODO: Implement JWT authentication
		// const request = context.switchToHttp().getRequest();
		// const token = this.extractToken(request);
		// Verify token and attach user to request

		// For now, always allow (development only)
		return true;
	}
}
