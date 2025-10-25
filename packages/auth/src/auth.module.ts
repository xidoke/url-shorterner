import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthGuard } from "./guards/auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { PasswordService } from "./services/password.service";
import { TokenService } from "./services/token.service";
import { JwtStrategy } from "./strategies/jwt.strategy";

@Module({
	imports: [
		PassportModule.register({ defaultStrategy: "jwt" }),
		JwtModule.register({
			secret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
			signOptions: {
				expiresIn: "15m",
			},
		}),
	],
	providers: [
		JwtStrategy,
		PasswordService,
		TokenService,
		AuthGuard,
		RolesGuard,
	],
	exports: [
		PasswordService,
		TokenService,
		AuthGuard,
		RolesGuard,
		JwtModule,
		PassportModule,
	],
})
export class AuthModule {}
