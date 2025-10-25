import { Module } from "@nestjs/common";
import { CacheModule } from "../../infrastructure/cache/cache.module";
import { MonitoringModule } from "../../infrastructure/monitoring/monitoring.module";
import { LinksModule } from "../links/links.module";
import { RedirectController } from "./redirect.controller";
import { RedirectService } from "./redirect.service";

@Module({
	imports: [LinksModule, CacheModule, MonitoringModule],
	controllers: [RedirectController],
	providers: [RedirectService],
})
export class RedirectModule {}
