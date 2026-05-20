// Domain types mirroring PocketBase collections
export type UserRole = 'member' | 'admin';

export interface UserRecord {
	id: string;
	email: string;
	username: string;
	avatar?: string;
	role: UserRole;
	created: string;
	updated: string;
}

export interface PostRecord {
	id: string;
	collectionId: string;
	collectionName: string;
	title: string;
	slug: string;
	content: string;
	thumbnail?: string;
	excerpt: string;
	category: string;
	tags: string;
	published: boolean;
	author: string;
	created: string;
	updated: string;
}

export type EventCategory = 'f1' | 'motogp' | 'wsbk' | 'wec' | 'formulae' | 'other';
export type EventSession = 'practice' | 'qualifying' | 'sprint' | 'race' | 'other';

export interface EventRecord {
	id: string;
	title: string;
	category: EventCategory;
	session: EventSession;
	circuit?: string;
	flag?: string;
	starts_at: string;
	ends_at?: string;
	created: string;
	updated: string;
}
