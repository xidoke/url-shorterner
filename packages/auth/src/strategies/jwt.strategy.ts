import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type {
	AuthenticatedUser,
	JwtPayload,
} from "../interfaces/jwt-payload.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor() {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey:
				process.env.JWT_SECRET || "your-secret-key-change-in-production",
		});
	}

	async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
		if (!payload.sub || !payload.email) {
			throw new UnauthorizedException("Invalid token payload");
		}

		return {
			id: BigInt(payload.sub),
			email: payload.email,
			tier: payload.tier,
		};
	}
}
