import { Module } from "@nestjs/common";
import { Base62Service } from "./base62.service";
import { SnowflakeService } from "./snowflake.service";

@Module({
	providers: [
		SnowflakeService,
		Base62Service,
		{
			provide: "REGION_ID",
			useValue: BigInt(process.env.REGION_ID || 0),
		},
		{
			provide: "WORKER_ID",
			useValue: BigInt(process.env.WORKER_ID || 0),
		},
	],
	exports: [SnowflakeService, Base62Service],
})
export class IdGeneratorModule {}
