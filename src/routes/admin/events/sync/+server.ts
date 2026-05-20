import { json, error } from '@sveltejs/kit';
import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/public';
import { fetchF1Sessions, groupByWeekend } from '$lib/services/openf1';
import { fetchMotoGpSchedule } from '$lib/services/motogp';
import { fetchSportsDbSchedule } from '$lib/services/sportsdb';
import type { EventCategory, EventRecord, EventSession } from '$lib/types';
import type { EventInput } from '$lib/services/events';
import type { RequestHandler } from './$types';

const PB_URL = env.PUBLIC_PB_URL;

type Series = 'f1' | 'motogp' | 'wsbk' | 'wec';

function mapF1Session(name: string): EventSession {
	const n = name.toLowerCase();
	if (n.includes('practice')) return 'practice';
	if (n.includes('shootout')) return 'qualifying';
	if (n.includes('sprint qualifying')) return 'qualifying';
	if (n.includes('sprint')) return 'sprint';
	if (n.includes('qualifying')) return 'qualifying';
	if (n.includes('race')) return 'race';
	return 'other';
}

function pbDate(d: Date): string {
	const pad = (n: number, len = 2) => n.toString().padStart(len, '0');
	return (
		`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
		`${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.${pad(d.getUTCMilliseconds(), 3)}Z`
	);
}

async function buildItems(
	series: Series,
	year: number,
	fetchFn: typeof fetch
): Promise<EventInput[]> {
	if (series === 'f1') {
		const sessions = await fetchF1Sessions(year);
		const weekends = groupByWeekend(sessions);
		const items: EventInput[] = [];
		for (const w of weekends) {
			for (const s of w.sessions) {
				items.push({
					title: `${w.country_name} GP — ${s.session_name}`,
					category: 'f1',
					session: mapF1Session(s.session_name),
					circuit: w.circuit_short_name || undefined,
					flag: w.flag,
					starts_at: new Date(s.date_start).toISOString(),
					ends_at: new Date(s.date_end).toISOString()
				});
			}
		}
		return items;
	}

	if (series === 'motogp') {
		const recs = await fetchMotoGpSchedule(fetchFn, year);
		return recs.map((r) => ({
			title: r.title,
			category: 'motogp',
			session: 'race',
			circuit: r.circuit,
			flag: r.flag,
			starts_at: r.starts_at,
			ends_at: r.ends_at
		}));
	}

	// wsbk / wec via TheSportsDB
	const cat = series as EventCategory;
	const recs = await fetchSportsDbSchedule(fetchFn, cat);
	if (!recs) return [];
	return recs.map((r) => ({
		title: r.title,
		category: cat,
		session: 'race',
		circuit: r.circuit,
		flag: r.flag,
		starts_at: r.starts_at,
		ends_at: r.ends_at
	}));
}

export const POST: RequestHandler = async ({ request, fetch }) => {
	if (!PB_URL) throw error(500, 'PUBLIC_PB_URL not configured');

	const body = (await request.json().catch(() => ({}))) as {
		series?: Series;
		token?: string;
		year?: number;
	};
	const { series, token, year } = body;

	if (!series || !token) throw error(400, 'series & token required');
	if (!['f1', 'motogp', 'wsbk', 'wec'].includes(series)) {
		throw error(400, `Unsupported series "${series}"`);
	}

	// Auth check via PocketBase using forwarded token
	const pb = new PocketBase(PB_URL);
	pb.authStore.save(token, null);
	try {
		await pb.collection('users').authRefresh();
	} catch {
		throw error(401, 'Invalid or expired token');
	}
	const me = pb.authStore.record as { role?: string } | null;
	if (me?.role !== 'admin') throw error(403, 'Admin only');

	let items: EventInput[];
	try {
		items = await buildItems(series, year ?? new Date().getFullYear(), fetch);
	} catch (err) {
		const msg = err instanceof Error ? err.message : 'Fetch upstream failed';
		throw error(502, `Sync source error: ${msg}`);
	}

	let created = 0;
	let updated = 0;
	let errors = 0;
	const errorMessages: string[] = [];

	for (const it of items) {
		try {
			// Match existing by (category + session + starts_at ±2min) to dedupe re-runs
			const start = new Date(it.starts_at).getTime();
			const before = pbDate(new Date(start - 2 * 60_000));
			const after = pbDate(new Date(start + 2 * 60_000));
			const existing = await pb
				.collection('events')
				.getFirstListItem<EventRecord>(
					`category="${it.category}" && session="${it.session}" && starts_at>="${before}" && starts_at<="${after}"`
				)
				.catch(() => null);

			if (existing) {
				await pb.collection('events').update(existing.id, it);
				updated++;
			} else {
				await pb.collection('events').create(it);
				created++;
			}
		} catch (e) {
			errors++;
			if (errorMessages.length < 5) {
				const base = e instanceof Error ? e.message : String(e);
				// PocketBase ClientResponseError carries field-level details on `.response.data`.
				const resp = (e as { response?: { data?: Record<string, { message?: string }> } })
					?.response?.data;
				const fieldMsg = resp
					? Object.entries(resp)
							.map(([k, v]) => `${k}: ${v?.message ?? ''}`)
							.join('; ')
					: '';
				errorMessages.push(fieldMsg ? `${base} — ${fieldMsg}` : base);
			}
		}
	}

	return json({
		series,
		total: items.length,
		created,
		updated,
		errors,
		errorMessages
	});
};
