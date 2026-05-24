import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { groupByWeekend, type F1Weekend } from '$lib/services/openf1';
import { pb } from '$lib/pocketbase';
import { fetchMotoGpSchedule } from '$lib/services/motogp';
import { fetchSportsDbSchedule } from '$lib/services/sportsdb';
import { fetchGtWceSchedule } from '$lib/services/gtwce';
import type { EventRecord, EventCategory } from '$lib/types';
import { isSeries, type Series } from '$lib/services/series';

async function loadF1(fetchFn: typeof fetch, year: number): Promise<F1Weekend[]> {
	try {
		const res = await fetchFn(`https://api.openf1.org/v1/sessions?year=${year}`);
		if (!res.ok) throw new Error(`OpenF1 ${res.status}`);
		const sessions = await res.json();
		return groupByWeekend(sessions);
	} catch {
		return [];
	}
}

async function loadPbEvents(category: EventCategory): Promise<EventRecord[]> {
	try {
		return await pb.collection('events').getFullList<EventRecord>({
			filter: `category = "${category}"`,
			sort: 'starts_at'
		});
	} catch {
		return [];
	}
}

async function loadSportsDb(
	fetchFn: typeof fetch,
	category: EventCategory
): Promise<EventRecord[] | null> {
	try {
		return await fetchSportsDbSchedule(fetchFn, category);
	} catch (err) {
		console.warn(`[jadwal] TheSportsDB unavailable for ${category}:`, err);
		return null;
	}
}

async function loadMotoGp(fetchFn: typeof fetch, year: number): Promise<EventRecord[]> {
	// Prefer the official MotoGP API (full season). Fall back to TheSportsDB,
	// then PocketBase if both APIs are unreachable.
	try {
		const api = await fetchMotoGpSchedule(fetchFn, year);
		if (api.length > 0) return api;
	} catch {
		// continue to fallbacks
	}
	const sdb = await loadSportsDb(fetchFn, 'motogp');
	if (sdb && sdb.length > 0) return sdb;
	return await loadPbEvents('motogp');
}

async function loadGt(fetchFn: typeof fetch, year: number): Promise<EventRecord[]> {
	try {
		const api = await fetchGtWceSchedule(fetchFn, year);
		if (api.length > 0) return api;
	} catch (err) {
		console.warn('[jadwal] GTWCE iCal unavailable:', err);
	}
	return await loadPbEvents('gt');
}

async function loadCategory(
	fetchFn: typeof fetch,
	category: EventCategory
): Promise<EventRecord[]> {
	const sdb = await loadSportsDb(fetchFn, category);
	if (sdb && sdb.length > 0) return sdb;
	return await loadPbEvents(category);
}

export const load: PageServerLoad = async ({ fetch, params, setHeaders }) => {
	if (!isSeries(params.series)) {
		throw error(404, 'Seri motorsport tidak ditemukan');
	}
	const series: Series = params.series;
	const year = new Date().getFullYear();

	// Cache for 5 minutes at the edge / browser
	setHeaders({ 'cache-control': 'public, max-age=60, s-maxage=300' });

	if (series === 'f1') {
		const weekends = await loadF1(fetch, year);
		return { series, year, weekends, events: [] as EventRecord[] };
	}

	const events =
		series === 'motogp'
			? await loadMotoGp(fetch, year)
			: series === 'gt'
				? await loadGt(fetch, year)
				: await loadCategory(fetch, series);
	return { series, year, weekends: [] as F1Weekend[], events };
};
