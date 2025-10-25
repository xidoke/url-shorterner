import { Module } from "@nestjs/common";
import { CacheModule } from "../../infrastructure/cache/cache.module";
import { IdGeneratorModule } from "../../infrastructure/id-generator/id-generator.module";
import { LinksController } from "./links.controller";
import { LinksRepository } from "./links.repository";
import { LinksService } from "./links.service";

@Module({
	imports: [IdGeneratorModule, CacheModule],
	controllers: [LinksController],
	providers: [LinksService, LinksRepository],
	exports: [LinksService],
})
export class LinksModule {}
