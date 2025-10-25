import { Inject, Injectable } from "@nestjs/common";

/**
 * Snowflake ID Generator
 * Generates unique, sortable 64-bit IDs
 *
 * Bit layout: [timestamp:41][region:3][worker:10][sequence:10]
 * - 41 bits for timestamp (milliseconds since custom epoch) - ~69 years
 * - 3 bits for region ID (0-7) - supports 8 regions
 * - 10 bits for worker ID (0-1023) - supports 1024 workers per region
 * - 10 bits for sequence (0-1023) - supports 1024 IDs per millisecond per worker
 */
@Injectable()
export class SnowflakeService {
	private readonly EPOCH = 1704067200000; // 2024-01-01 00:00:00 UTC
	private sequence = 0n;
	private lastTimestamp = 0n;

	constructor(
		@Inject("REGION_ID") private readonly regionId: bigint,
		@Inject("WORKER_ID") private readonly workerId: bigint,
	) {
		// Validate region and worker IDs
		if (regionId < 0n || regionId > 7n) {
			throw new Error("Region ID must be between 0 and 7");
		}
		if (workerId < 0n || workerId > 1023n) {
			throw new Error("Worker ID must be between 0 and 1023");
		}
	}

	/**
	 * Generate a new Snowflake ID
	 */
	generateId(): bigint {
		let timestamp = BigInt(Date.now()) - BigInt(this.EPOCH);

		if (timestamp === this.lastTimestamp) {
			// Same millisecond - increment sequence
			this.sequence = (this.sequence + 1n) & 1023n; // Wrap at 1024

			if (this.sequence === 0n) {
				// Sequence overflow - wait for next millisecond
				while (timestamp <= this.lastTimestamp) {
					timestamp = BigInt(Date.now()) - BigInt(this.EPOCH);
				}
			}
		} else {
			// New millisecond - reset sequence
			this.sequence = 0n;
		}

		this.lastTimestamp = timestamp;

		// Combine all parts into 64-bit ID
		// [timestamp:41][region:3][worker:10][sequence:10]
		const id =
			(timestamp << 23n) | // Shift timestamp by 23 bits (3 + 10 + 10)
			(this.regionId << 20n) | // Shift region by 20 bits (10 + 10)
			(this.workerId << 10n) | // Shift worker by 10 bits (sequence)
			this.sequence;

		return id;
	}

	/**
	 * Extract timestamp from a Snowflake ID
	 */
	extractTimestamp(id: bigint): Date {
		const timestamp = (id >> 23n) + BigInt(this.EPOCH);
		return new Date(Number(timestamp));
	}

	/**
	 * Extract region ID from a Snowflake ID
	 */
	extractRegionId(id: bigint): bigint {
		return (id >> 20n) & 7n;
	}

	/**
	 * Extract worker ID from a Snowflake ID
	 */
	extractWorkerId(id: bigint): bigint {
		return (id >> 10n) & 1023n;
	}

	/**
	 * Extract sequence from a Snowflake ID
	 */
	extractSequence(id: bigint): bigint {
		return id & 1023n;
	}
}
