import { Injectable } from "@nestjs/common";
import { SHORT_CODE } from "@xidoke/types";

/**
 * Base62 Encoding Service
 * Converts numeric IDs to short alphanumeric strings
 *
 * Base62 uses: 0-9, A-Z, a-z (62 characters)
 * 7 characters can represent ~3.5 trillion IDs
 */
@Injectable()
export class Base62Service {
	private readonly CHARSET = SHORT_CODE.CHARSET;
	private readonly BASE = BigInt(this.CHARSET.length);

	/**
	 * Encode a numeric ID to Base62 string
	 */
	encode(id: bigint): string {
		if (id === 0n) {
			return "0".padStart(SHORT_CODE.DEFAULT_LENGTH, "0");
		}

		let result = "";
		let num = id;

		while (num > 0n) {
			const remainder = Number(num % this.BASE);
			result = this.CHARSET[remainder] + result;
			num = num / this.BASE;
		}

		// Pad to default length for consistent short URLs
		return result.padStart(SHORT_CODE.DEFAULT_LENGTH, "0");
	}

	/**
	 * Decode a Base62 string to numeric ID
	 */
	decode(shortCode: string): bigint {
		let id = 0n;

		for (const char of shortCode) {
			const index = this.CHARSET.indexOf(char);
			if (index === -1) {
				throw new Error(`Invalid character in short code: ${char}`);
			}
			id = id * this.BASE + BigInt(index);
		}

		return id;
	}

	/**
	 * Generate a random short code (for custom aliases)
	 */
	generateRandom(length = SHORT_CODE.DEFAULT_LENGTH): string {
		let result = "";
		for (let i = 0; i < length; i++) {
			const randomIndex = Math.floor(Math.random() * this.CHARSET.length);
			result += this.CHARSET[randomIndex];
		}
		return result;
	}
}
