/**
 * Analytics-related type definitions
 */

export interface ClickEvent {
	eventId: string;
	linkId: bigint;
	shortCode: string;
	timestamp: number;
	ipAddress: string;
	userAgent?: string;
	referer?: string;
	countryCode?: string;
	region?: string;
	city?: string;
	deviceType?: string;
	browser?: string;
	os?: string;
}

export interface AnalyticsStats {
	linkId: string;
	totalClicks: number;
	uniqueVisitors: number;
	topCountries: CountryStats[];
	topDevices: DeviceStats[];
	clicksByDate: DateStats[];
}

export interface CountryStats {
	countryCode: string;
	clicks: number;
}

export interface DeviceStats {
	deviceType: string;
	clicks: number;
}

export interface DateStats {
	date: string;
	clicks: number;
	uniqueVisitors: number;
}
