import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
	HttpExceptionFilter,
	TransformInterceptor,
} from "@xidoke/api-standards";
import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { AppModule } from "./app.module";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from workspace root
config({ path: resolve(__dirname, "../../../.env") });

async function bootstrap() {
	const logger = new Logger("Bootstrap");
	const app = await NestFactory.create(AppModule);

	// Global validation pipe
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	);

	// Global exception filter (from @xidoke/api-standards)
	app.useGlobalFilters(new HttpExceptionFilter());

	// Global interceptors
	app.useGlobalInterceptors(
		new LoggingInterceptor(),
		new TransformInterceptor(), // Transform responses to standard format
	);

	// CORS configuration
	app.enableCors({
		origin: process.env.CORS_ORIGIN || "*",
		credentials: true,
	});

	const port = process.env.PORT ?? 3000;
	await app.listen(port);

	logger.log(`Application is running on: http://localhost:${port}`);
	logger.log(`Environment: ${process.env.NODE_ENV || "development"}`);
	logger.log(
		`Database: ${process.env.DATABASE_URL ? "Connected" : "Not configured"}`,
	);
}

bootstrap();
