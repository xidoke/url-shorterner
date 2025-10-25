/**
 * Validation utilities
 */

import { SHORT_CODE } from "../constants";

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		return parsed.protocol === "http:" || parsed.protocol === "https:";
	} catch {
		return false;
	}
}

/**
 * Validate short code format
 */
export function isValidShortCode(shortCode: string): boolean {
	if (!shortCode) return false;

	const { MIN_LENGTH, MAX_LENGTH, CHARSET } = SHORT_CODE;

	if (shortCode.length < MIN_LENGTH || shortCode.length > MAX_LENGTH) {
		return false;
	}

	// Check if all characters are in the allowed charset
	return [...shortCode].every((char) => CHARSET.includes(char));
}

/**
 * Sanitize URL (remove tracking parameters, normalize)
 */
export function sanitizeUrl(url: string): string {
	try {
		const parsed = new URL(url);

		// Remove common tracking parameters
		const trackingParams = [
			"utm_source",
			"utm_medium",
			"utm_campaign",
			"utm_term",
			"utm_content",
			"fbclid",
			"gclid",
		];

		for (const param of trackingParams) {
			parsed.searchParams.delete(param);
		}

		return parsed.toString();
	} catch {
		return url;
	}
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}
