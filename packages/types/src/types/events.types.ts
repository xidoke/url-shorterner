/**
 * Event type definitions for messaging (Kafka)
 */

import type { ClickEvent } from "./analytics.types";
import type { Link } from "./link.types";

export enum EventType {
	LINK_CREATED = "link.created",
	LINK_UPDATED = "link.updated",
	LINK_DELETED = "link.deleted",
	CLICK_TRACKED = "click.tracked",
	CACHE_INVALIDATE = "cache.invalidate",
}

export interface BaseEvent {
	type: EventType;
	timestamp: number;
	metadata?: Record<string, unknown>;
}

export interface LinkCreatedEvent extends BaseEvent {
	type: EventType.LINK_CREATED;
	payload: {
		link: Link;
		userId: bigint;
	};
}

export interface LinkUpdatedEvent extends BaseEvent {
	type: EventType.LINK_UPDATED;
	payload: {
		linkId: bigint;
		shortCode: string;
		changes: Partial<Link>;
	};
}

export interface LinkDeletedEvent extends BaseEvent {
	type: EventType.LINK_DELETED;
	payload: {
		linkId: bigint;
		shortCode: string;
	};
}

export interface ClickTrackedEvent extends BaseEvent {
	type: EventType.CLICK_TRACKED;
	payload: ClickEvent;
}

export interface CacheInvalidateEvent extends BaseEvent {
	type: EventType.CACHE_INVALIDATE;
	payload: {
		keys: string[];
		pattern?: string;
	};
}

export type DomainEvent =
	| LinkCreatedEvent
	| LinkUpdatedEvent
	| LinkDeletedEvent
	| ClickTrackedEvent
	| CacheInvalidateEvent;
