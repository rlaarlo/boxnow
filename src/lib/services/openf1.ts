// Service for OpenF1 API — https://api.openf1.org

export interface F1Session {
	session_key: number;
	session_type: 'Practice' | 'Qualifying' | 'Race' | string;
	session_name: string; // "Practice 1", "Sprint Qualifying", "Sprint", "Qualifying", "Race"
	date_start: string; // ISO
	date_end: string;
	meeting_key: number; // groups sessions of same Grand Prix
	circuit_short_name: string;
	country_code: string; // 3-letter ISO
	country_name: string;
	location: string;
	gmt_offset: string;
	year: number;
	is_cancelled: boolean;
}

export interface F1Weekend {
	meeting_key: number;
	country_name: string;
	country_code: string;
	circuit_short_name: string;
	location: string;
	flag: string;
	starts_at: string; // earliest session
	ends_at: string;
	sessions: F1Session[];
}

// ISO 3166-1 alpha-3 → flag emoji (regional indicators of alpha-2)
const ALPHA3_TO_ALPHA2: Record<string, string> = {
	BRN: 'BH', SAU: 'SA', AUS: 'AU', JPN: 'JP', CHN: 'CN', USA: 'US', ITA: 'IT',
	MON: 'MC', CAN: 'CA', ESP: 'ES', AUT: 'AT', GBR: 'GB', HUN: 'HU', BEL: 'BE',
	NED: 'NL', AZE: 'AZ', SGP: 'SG', MEX: 'MX', BRA: 'BR', QAT: 'QA', UAE: 'AE',
	FRA: 'FR', GER: 'DE', RUS: 'RU', POR: 'PT', TUR: 'TR'
};

export function flagFor(alpha3: string): string {
	const a2 = ALPHA3_TO_ALPHA2[alpha3];
	if (!a2) return '🏁';
	const A = 0x1f1e6;
	return String.fromCodePoint(A + (a2.charCodeAt(0) - 65)) + String.fromCodePoint(A + (a2.charCodeAt(1) - 65));
}

let _cache: { year: number; data: F1Session[]; ts: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min

export async function fetchF1Sessions(year = new Date().getFullYear()): Promise<F1Session[]> {
	const now = Date.now();
	if (_cache && _cache.year === year && now - _cache.ts < CACHE_TTL_MS) {
		return _cache.data;
	}
	const res = await fetch(`https://api.openf1.org/v1/sessions?year=${year}`);
	if (!res.ok) throw new Error(`OpenF1 ${res.status}`);
	const data = (await res.json()) as F1Session[];
	_cache = { year, data, ts: now };
	return data;
}

/** Group sessions by meeting_key (= Grand Prix weekend) and sort. */
export function groupByWeekend(sessions: F1Session[]): F1Weekend[] {
	const map = new Map<number, F1Session[]>();
	for (const s of sessions) {
		if (s.is_cancelled) continue;
		const arr = map.get(s.meeting_key) ?? [];
		arr.push(s);
		map.set(s.meeting_key, arr);
	}
	const weekends: F1Weekend[] = [];
	for (const [meeting_key, list] of map) {
		list.sort((a, b) => a.date_start.localeCompare(b.date_start));
		const first = list[0];
		const last = list[list.length - 1];
		weekends.push({
			meeting_key,
			country_name: first.country_name,
			country_code: first.country_code,
			circuit_short_name: first.circuit_short_name,
			location: first.location,
			flag: flagFor(first.country_code),
			starts_at: first.date_start,
			ends_at: last.date_end,
			sessions: list
		});
	}
	weekends.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
	return weekends;
}

export type F1Status = 'live' | 'upcoming' | 'past';

export function statusOfWeekend(w: F1Weekend, now = Date.now()): F1Status {
	const start = new Date(w.starts_at).getTime();
	const end = new Date(w.ends_at).getTime();
	if (now < start) return 'upcoming';
	if (now < end + 4 * 60 * 60 * 1000) return 'live';
	return 'past';
}

export function statusOfSession(s: F1Session, now = Date.now()): F1Status {
	const start = new Date(s.date_start).getTime();
	const end = new Date(s.date_end).getTime();
	if (now < start) return 'upcoming';
	if (now < end) return 'live';
	return 'past';
}

/** Find next/current weekend (live first, else first future). */
export function nextWeekend(weekends: F1Weekend[], now = Date.now()): F1Weekend | null {
	const live = weekends.find((w) => statusOfWeekend(w, now) === 'live');
	if (live) return live;
	return weekends.find((w) => statusOfWeekend(w, now) === 'upcoming') ?? null;
}
