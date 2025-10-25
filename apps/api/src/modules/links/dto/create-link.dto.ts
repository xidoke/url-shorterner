import { SHORT_CODE } from "@xidoke/types";
import {
	IsDateString,
	IsInt,
	IsOptional,
	IsString,
	IsUrl,
	Matches,
	MaxLength,
} from "class-validator";

export class CreateLinkDto {
	@IsUrl({}, { message: "Invalid URL format" })
	@MaxLength(2048, { message: "URL too long" })
	longUrl!: string;

	@IsOptional()
	@IsString()
	@Matches(
		new RegExp(
			`^[a-zA-Z0-9-_]{${SHORT_CODE.MIN_LENGTH},${SHORT_CODE.MAX_LENGTH}}$`,
		),
		{
			message: `Custom alias must be ${SHORT_CODE.MIN_LENGTH}-${SHORT_CODE.MAX_LENGTH} characters and contain only letters, numbers, hyphens, and underscores`,
		},
	)
	customAlias?: string;

	@IsOptional()
	@IsInt()
	collectionId?: number;

	@IsOptional()
	@IsString()
	@MaxLength(200)
	title?: string;

	@IsOptional()
	@IsString()
	@MaxLength(1000)
	description?: string;

	@IsOptional()
	@IsDateString()
	expiresAt?: string;
}
