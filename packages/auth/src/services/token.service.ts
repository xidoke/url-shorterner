import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { UserTier } from "@xidoke/types";
import type { JwtPayload } from "../interfaces/jwt-payload.interface";

@Injectable()
export class TokenService {
	constructor(private jwtService: JwtService) {}

	generateAccessToken(userId: bigint, email: string, tier: UserTier): string {
		const payload: JwtPayload = {
			sub: userId.toString(),
			email,
			tier,
		};

		return this.jwtService.sign(payload, {
			expiresIn: "15m",
		});
	}

	generateRefreshToken(userId: bigint): string {
		const payload = {
			sub: userId.toString(),
		};

		return this.jwtService.sign(payload, {
			expiresIn: "7d",
		});
	}

	verifyToken(token: string): JwtPayload {
		return this.jwtService.verify<JwtPayload>(token);
	}
}
