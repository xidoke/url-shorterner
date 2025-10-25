import { Module } from "@nestjs/common";
// Shared packages
import { AuthModule } from "@xidoke/auth";
import { RateLimitModule } from "@xidoke/rate-limit";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { CacheModule } from "./infrastructure/cache/cache.module";
// Infrastructure
import { DatabaseModule } from "./infrastructure/database/database.module";
import { IdGeneratorModule } from "./infrastructure/id-generator/id-generator.module";
import { MonitoringModule } from "./infrastructure/monitoring/monitoring.module";

// Modules
import { LinksModule } from "./modules/links/links.module";
import { RedirectModule } from "./modules/redirect/redirect.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
	imports: [
		// Shared packages
		AuthModule,
		RateLimitModule.forRoot({
			useRedis: !!process.env.REDIS_HOST, // Use Redis if configured, otherwise memory
		}),

		// Infrastructure
		DatabaseModule,
		IdGeneratorModule,
		CacheModule,
		MonitoringModule,

		// Feature modules
		LinksModule,
		RedirectModule,
		UsersModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
