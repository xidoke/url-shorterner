import {
	IsDateString,
	IsEnum,
	IsOptional,
	IsString,
	MaxLength,
} from "class-validator";

export class UpdateLinkDto {
	@IsOptional()
	@IsString()
	@MaxLength(200)
	title?: string;

	@IsOptional()
	@IsString()
	@MaxLength(1000)
	description?: string;

	@IsOptional()
	@IsEnum(["ACTIVE", "DISABLED"], {
		message: "Status must be either ACTIVE or DISABLED",
	})
	status?: "ACTIVE" | "DISABLED";

	@IsOptional()
	@IsDateString()
	expiresAt?: string;
}
