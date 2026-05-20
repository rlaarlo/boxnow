// MotoGP schedule via api.motogp.pulselive.com
import type { EventRecord } from '$lib/types';

interface MotoGpSeason {
	id: string;
	year: number;
	current: boolean;
}

interface MotoGpEvent {
	id: string;
	name: string;
	sponsored_name?: string;
	short_name?: string;
	date_start: string; // YYYY-MM-DD
	date_end: string;
	status?: string;
	test?: boolean;
	country?: { iso?: string; name?: string };
	circuit?: { name?: string; place?: string };
}

const SEASONS_URL = 'https://api.motogp.pulselive.com/motogp/v1/results/seasons';
const EVENTS_URL = 'https://api.motogp.pulselive.com/motogp/v1/results/events';

const REQUEST_HEADERS: Record<string, string> = {
	accept: 'application/json',
	'accept-language': 'en-US,en;q=0.9',
	'user-agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
	referer: 'https://www.motogp.com/'
};

/** Convert ISO alpha-2 → flag emoji. */
function flagFromAlpha2(iso?: string): string {
	if (!iso || iso.length !== 2) return '🏁';
	const A = 0x1f1e6;
	return (
		String.fromCodePoint(A + (iso.charCodeAt(0) - 65)) +
		String.fromCodePoint(A + (iso.charCodeAt(1) - 65))
	);
}

/** Treat YYYY-MM-DD as local-noon ISO so it survives toLocaleDateString correctly. */
function dateOnlyToIso(d: string, hour = 12): string {
	const dt = new Date(`${d}T${hour.toString().padStart(2, '0')}:00:00Z`);
	return dt.toISOString();
}

export async function fetchMotoGpSchedule(
	_fetchFn: typeof fetch,
	year = new Date().getFullYear()
): Promise<EventRecord[]> {
	// Use the runtime's native fetch (not SvelteKit's wrapped fetch) — pulselive
	// rejects (403) some of the headers SvelteKit forwards from the inbound request.
	const nativeFetch: typeof fetch = globalThis.fetch.bind(globalThis);
	const seasonsRes = await nativeFetch(SEASONS_URL, { headers: REQUEST_HEADERS });
	if (!seasonsRes.ok) throw new Error(`MotoGP seasons ${seasonsRes.status}`);
	const seasons = (await seasonsRes.json()) as MotoGpSeason[];
	const season = seasons.find((s) => s.year === year) ?? seasons.find((s) => s.current);
	if (!season) return [];

	const eventsRes = await nativeFetch(`${EVENTS_URL}?seasonUuid=${season.id}`, {
		headers: REQUEST_HEADERS
	});
	if (!eventsRes.ok) throw new Error(`MotoGP events ${eventsRes.status}`);
	const events = (await eventsRes.json()) as MotoGpEvent[];

	const out: EventRecord[] = events
		.filter((e) => !e.test)
		.map((e) => {
			const title = (e.sponsored_name || e.name || 'Round').replace(/\s+/g, ' ').trim();
			const circuit = [e.circuit?.name, e.circuit?.place].filter(Boolean).join(', ');
			return {
				id: e.id,
				title,
				category: 'motogp',
				session: 'race',
				circuit: circuit || undefined,
				flag: flagFromAlpha2(e.country?.iso),
				starts_at: dateOnlyToIso(e.date_start, 9),
				ends_at: dateOnlyToIso(e.date_end, 18),
				created: '',
				updated: ''
			} satisfies EventRecord;
		});

	out.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
	return out;
}
