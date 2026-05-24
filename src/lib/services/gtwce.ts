// GT World Challenge Europe schedule via SRO's per-event iCal feed.
// The season HTML page exposes "Save Date" buttons that link to
// /feed/get_event_calendar?meeting_id=<id>; each download is a single VEVENT.
import type { EventRecord } from '$lib/types';

const CALENDAR_URL = 'https://www.gt-world-challenge-europe.com/calendar';
const EVENT_ICS_URL = (id: string) =>
	`https://www.gt-world-challenge-europe.com/feed/get_event_calendar?meeting_id=${id}`;

const COUNTRY_TO_FLAG: Record<string, string> = {
	Austria: '🇦🇹', Belgium: '🇧🇪', France: '🇫🇷', Germany: '🇩🇪',
	Hungary: '🇭🇺', Italy: '🇮🇹', Monaco: '🇲🇨', Netherlands: '🇳🇱',
	Portugal: '🇵🇹', Spain: '🇪🇸', 'United Kingdom': '🇬🇧', UK: '🇬🇧',
	'Great Britain': '🇬🇧', Britain: '🇬🇧', Czechia: '🇨🇿',
	'Czech Republic': '🇨🇿', Switzerland: '🇨🇭', Poland: '🇵🇱'
};

function flagFor(country: string | undefined): string {
	if (!country) return '🏁';
	return COUNTRY_TO_FLAG[country.trim()] ?? '🏁';
}

/** Strip iCal field escaping: \\, \n, \, \; */
function unescapeIcs(v: string): string {
	return v.replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}

/** Unfold RFC5545 line folding (CRLF + space/tab continues previous line). */
function unfold(text: string): string[] {
	return text.replace(/\r\n[ \t]/g, '').replace(/\r/g, '').split('\n');
}

function dateOnlyToIso(yyyymmdd: string, hour = 9): string {
	const y = yyyymmdd.slice(0, 4);
	const m = yyyymmdd.slice(4, 6);
	const d = yyyymmdd.slice(6, 8);
	return new Date(`${y}-${m}-${d}T${hour.toString().padStart(2, '0')}:00:00Z`).toISOString();
}

interface ParsedVEvent {
	uid?: string;
	summary?: string;
	location?: string;
	description?: string;
	dtstart?: string; // YYYYMMDD (all-day) — feed uses VALUE=DATE
	dtend?: string;
}

function parseFirstVEvent(ics: string): ParsedVEvent | null {
	const lines = unfold(ics);
	let inEvent = false;
	const ev: ParsedVEvent = {};
	for (const raw of lines) {
		const line = raw.trim();
		if (line === 'BEGIN:VEVENT') {
			inEvent = true;
			continue;
		}
		if (line === 'END:VEVENT') break;
		if (!inEvent) continue;
		const colon = line.indexOf(':');
		if (colon < 0) continue;
		const keyPart = line.slice(0, colon);
		const value = line.slice(colon + 1);
		const [name] = keyPart.split(';');
		const upper = name.toUpperCase();
		if (upper === 'UID') ev.uid = value;
		else if (upper === 'SUMMARY') ev.summary = unescapeIcs(value);
		else if (upper === 'LOCATION') ev.location = unescapeIcs(value);
		else if (upper === 'DESCRIPTION') ev.description = unescapeIcs(value);
		else if (upper === 'DTSTART') ev.dtstart = value;
		else if (upper === 'DTEND') ev.dtend = value;
	}
	return ev.dtstart ? ev : null;
}

async function listMeetingIds(fetchFn: typeof fetch): Promise<string[]> {
	const res = await fetchFn(CALENDAR_URL);
	if (!res.ok) throw new Error(`GTWCE calendar ${res.status}`);
	const html = await res.text();
	const ids = new Set<string>();
	for (const m of html.matchAll(/meeting_id=(\d+)/g)) ids.add(m[1]);
	return [...ids];
}

async function fetchEvent(fetchFn: typeof fetch, id: string): Promise<EventRecord | null> {
	const res = await fetchFn(EVENT_ICS_URL(id));
	if (!res.ok) return null;
	const ics = await res.text();
	const ev = parseFirstVEvent(ics);
	if (!ev || !ev.dtstart) return null;

	// DTSTART is YYYYMMDD (VALUE=DATE). DTEND is exclusive — subtract 1 day for display end.
	const startYmd = ev.dtstart.slice(0, 8);
	const endYmd = ev.dtend ? ev.dtend.slice(0, 8) : startYmd;
	const startsAt = dateOnlyToIso(startYmd, 9);
	// Treat last race day (DTEND exclusive → minus 1 day), end at 18:00 UTC.
	const endDate = new Date(dateOnlyToIso(endYmd, 0));
	endDate.setUTCDate(endDate.getUTCDate() - 1);
	endDate.setUTCHours(18);
	const endsAt = endDate.toISOString();

	const [country, circuitCity] = (ev.location ?? '').split(',').map((s) => s.trim());
	const circuit = circuitCity || country || undefined;
	const title = ev.description?.trim() || ev.summary?.trim() || `Round ${id}`;

	return {
		id: ev.uid || `GTWCEU-${id}`,
		title,
		category: 'gt',
		session: 'race',
		circuit,
		flag: flagFor(country),
		starts_at: startsAt,
		ends_at: endsAt,
		created: '',
		updated: ''
	} satisfies EventRecord;
}

export async function fetchGtWceSchedule(
	fetchFn: typeof fetch,
	year = new Date().getFullYear()
): Promise<EventRecord[]> {
	const ids = await listMeetingIds(fetchFn);
	if (ids.length === 0) return [];
	const results = await Promise.all(ids.map((id) => fetchEvent(fetchFn, id).catch(() => null)));
	const events = results.filter((e): e is EventRecord => e !== null);
	const filtered = events.filter((e) => new Date(e.starts_at).getUTCFullYear() === year);
	filtered.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
	return filtered;
}
