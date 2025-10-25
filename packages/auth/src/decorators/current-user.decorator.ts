import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AuthenticatedUser } from "../interfaces/jwt-payload.interface";

export const CurrentUser = createParamDecorator(
	(_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
		const request = ctx.switchToHttp().getRequest();
		return request.user;
	},
);
