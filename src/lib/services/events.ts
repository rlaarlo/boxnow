import { pb } from '$lib/pocketbase';
import type { EventRecord } from '$lib/types';

export interface EventInput {
	title: string;
	category: EventRecord['category'];
	session: EventRecord['session'];
	circuit?: string;
	flag?: string;
	starts_at: string; // ISO
	ends_at?: string;
}

const SOON_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const ENDED_GRACE_MS = 4 * 60 * 60 * 1000;

function pbDate(d: Date): string {
	const pad = (n: number, len = 2) => n.toString().padStart(len, '0');
	return (
		`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
		`${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.${pad(d.getUTCMilliseconds(), 3)}`
	);
}

export function eventStatus(
	e: EventRecord,
	now = Date.now()
): 'live' | 'soon' | 'upcoming' | 'ended' {
	const start = new Date(e.starts_at).getTime();
	const end = e.ends_at
		? new Date(e.ends_at).getTime()
		: start + (e.session === 'race' ? 2 * 60 * 60 * 1000 : 90 * 60 * 1000);
	if (now < start - 60 * 60 * 1000) return 'upcoming';
	if (now < start) return 'soon';
	if (now < end) return 'live';
	return 'ended';
}

export async function listUpcomingEvents(limit = 20): Promise<EventRecord[]> {
	const now = new Date();
	const horizon = new Date(now.getTime() + SOON_WINDOW_MS);
	const cutoff = new Date(now.getTime() - ENDED_GRACE_MS);
	const result = await pb.collection('events').getList<EventRecord>(1, limit, {
		filter: `starts_at >= "${pbDate(cutoff)}" && starts_at <= "${pbDate(horizon)}"`,
		sort: 'starts_at'
	});
	return result.items;
}

/** Next N events (live or upcoming), without an upper time horizon. */
export async function listNextEvents(limit = 5): Promise<EventRecord[]> {
	const cutoff = new Date(Date.now() - ENDED_GRACE_MS);
	const result = await pb.collection('events').getList<EventRecord>(1, limit, {
		filter: `starts_at >= "${pbDate(cutoff)}"`,
		sort: 'starts_at'
	});
	return result.items;
}

export async function listAllEvents(): Promise<EventRecord[]> {
	return await pb.collection('events').getFullList<EventRecord>({
		sort: '-starts_at'
	});
}

export async function createEvent(data: EventInput): Promise<EventRecord> {
	return await pb.collection('events').create<EventRecord>(data);
}

export async function updateEvent(id: string, data: Partial<EventInput>): Promise<EventRecord> {
	return await pb.collection('events').update<EventRecord>(id, data);
}

export async function deleteEvent(id: string): Promise<void> {
	await pb.collection('events').delete(id);
}
