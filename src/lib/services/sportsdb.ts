// Schedule via TheSportsDB v1 (free key: 123)
// Docs: https://www.thesportsdb.com/documentation
import type { EventRecord, EventCategory } from '$lib/types';

interface SportsDbEvent {
	idEvent: string;
	strEvent: string;
	strLeague?: string;
	strSeason?: string;
	dateEvent?: string; // YYYY-MM-DD (UTC)
	strTime?: string; // HH:mm:ss (UTC)
	strTimestamp?: string; // ISO without TZ — treat as UTC
	dateEventLocal?: string;
	strTimeLocal?: string;
	strVenue?: string;
	strCity?: string;
	strCountry?: string;
	strPoster?: string;
	strThumb?: string;
	intRound?: string;
	strStatus?: string;
}

const BASE = 'https://www.thesportsdb.com/api/v1/json/123';

/** TheSportsDB league IDs for our supported series. Formula E, DTM, and
 *  GT World Challenge are not on the free tier of TheSportsDB, so they
 *  fall back to PocketBase. */
const LEAGUE_IDS: Partial<Record<EventCategory, number>> = {
	f1: 4370,
	motogp: 4407,
	wsbk: 4454,
	wec: 4413
};

const COUNTRY_TO_FLAG: Record<string, string> = {
	Australia: '🇦🇺', Austria: '🇦🇹', Azerbaijan: '🇦🇿', Bahrain: '🇧🇭',
	Belgium: '🇧🇪', Brazil: '🇧🇷', Canada: '🇨🇦', China: '🇨🇳',
	'Czech Republic': '🇨🇿', Czechia: '🇨🇿', Finland: '🇫🇮', France: '🇫🇷',
	Germany: '🇩🇪', Hungary: '🇭🇺', India: '🇮🇳', Indonesia: '🇮🇩',
	Italy: '🇮🇹', Japan: '🇯🇵', Malaysia: '🇲🇾', Mexico: '🇲🇽',
	Monaco: '🇲🇨', Morocco: '🇲🇦', Netherlands: '🇳🇱', Portugal: '🇵🇹',
	Qatar: '🇶🇦', 'Saudi Arabia': '🇸🇦', Singapore: '🇸🇬', Spain: '🇪🇸',
	'South Africa': '🇿🇦', Thailand: '🇹🇭', Turkey: '🇹🇷',
	'United Arab Emirates': '🇦🇪', UAE: '🇦🇪',
	'United Kingdom': '🇬🇧', UK: '🇬🇧', 'Great Britain': '🇬🇧',
	'United States': '🇺🇸', USA: '🇺🇸', 'United States of America': '🇺🇸',
	Argentina: '🇦🇷'
};

function flagFor(country?: string): string {
	if (!country) return '🏁';
	return COUNTRY_TO_FLAG[country] ?? '🏁';
}

// Matches ISO-ish "YYYY-MM-DDTHH:mm:ss" (with optional fractional + offset).
const ISO_TS = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/;

function toIso(e: SportsDbEvent): string {
	// TheSportsDB v1 returns strTimestamp inconsistently — sometimes ISO
	// ("2026-05-30T00:00:00"), sometimes "DD/MM/YYYY HH:mm:ss". Only trust ISO.
	if (e.strTimestamp && ISO_TS.test(e.strTimestamp)) {
		const d = new Date(`${e.strTimestamp.replace(' ', 'T')}Z`);
		if (!Number.isNaN(d.getTime())) return d.toISOString();
	}
	const date = e.dateEvent;
	if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
		const time = e.strTime && /^\d{2}:\d{2}:\d{2}$/.test(e.strTime) && e.strTime !== '00:00:00'
			? e.strTime
			: '12:00:00';
		const d = new Date(`${date}T${time}Z`);
		if (!Number.isNaN(d.getTime())) return d.toISOString();
	}
	return new Date().toISOString();
}

function endIso(startIso: string, durationHours: number): string {
	return new Date(new Date(startIso).getTime() + durationHours * 3600_000).toISOString();
}

/**
 * Fetch combined past + upcoming events for the given category.
 * `eventspastleague.php` returns ~15 last events, `eventsnextleague.php` returns ~15 next.
 */
export async function fetchSportsDbSchedule(
	fetchFn: typeof fetch,
	category: EventCategory
): Promise<EventRecord[] | null> {
	const leagueId = LEAGUE_IDS[category];
	if (!leagueId) return null;

	const [pastRes, nextRes] = await Promise.all([
		fetchFn(`${BASE}/eventspastleague.php?id=${leagueId}`),
		fetchFn(`${BASE}/eventsnextleague.php?id=${leagueId}`)
	]);

	if (!pastRes.ok || !nextRes.ok) {
		throw new Error(`TheSportsDB ${pastRes.status}/${nextRes.status} for ${category}`);
	}

	const past = ((await pastRes.json()) as { events?: SportsDbEvent[] }).events ?? [];
	const next = ((await nextRes.json()) as { events?: SportsDbEvent[] }).events ?? [];

	const durationHours = category === 'wec' ? 24 : 2;
	const seen = new Set<string>();
	const all = [...past, ...next].filter((e) => {
		if (seen.has(e.idEvent)) return false;
		seen.add(e.idEvent);
		return true;
	});

	const out: EventRecord[] = all.map((e) => {
		const startsAt = toIso(e);
		const circuit = [e.strVenue, e.strCity].filter(Boolean).join(', ');
		const round = e.intRound ? `R${e.intRound} · ` : '';
		return {
			id: e.idEvent,
			title: `${round}${e.strEvent}`.trim(),
			category,
			session: 'race',
			circuit: circuit || undefined,
			flag: flagFor(e.strCountry),
			starts_at: startsAt,
			ends_at: endIso(startsAt, durationHours),
			created: '',
			updated: ''
		} satisfies EventRecord;
	});

	out.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
	return out;
}
