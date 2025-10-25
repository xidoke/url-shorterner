import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

/**
 * Current User Decorator
 * Extract user from request context
 *
 * Usage: @CurrentUser() user: User
 */
export const CurrentUser = createParamDecorator(
	(_data: unknown, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		return request.user;
	},
);
