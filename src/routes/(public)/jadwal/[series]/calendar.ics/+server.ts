import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { groupByWeekend, type F1Session, type F1Weekend } from '$lib/services/openf1';
import { fetchMotoGpSchedule } from '$lib/services/motogp';
import { fetchSportsDbSchedule } from '$lib/services/sportsdb';
import { pb } from '$lib/pocketbase';
import type { EventRecord, EventCategory } from '$lib/types';
import { isSeries, SERIES_LIST, type Series } from '$lib/services/series';
import { SITE } from '$lib/site';

function pad(n: number, len = 2) {
	return n.toString().padStart(len, '0');
}

function toIcsDate(iso: string): string {
	const d = new Date(iso);
	return (
		`${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
		`${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
	);
}

function escapeIcs(s: string): string {
	return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function foldLine(line: string): string {
	// RFC5545: lines must not exceed 75 octets; fold with CRLF + space
	if (line.length <= 75) return line;
	const parts: string[] = [];
	let i = 0;
	while (i < line.length) {
		parts.push((i === 0 ? '' : ' ') + line.slice(i, i + 73));
		i += 73;
	}
	return parts.join('\r\n');
}

type IcsEvent = {
	uid: string;
	start: string;
	end: string;
	summary: string;
	location?: string;
	description?: string;
};

function buildIcs(name: string, events: IcsEvent[]): string {
	const lines: string[] = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//DRSMODE.NET//Jadwal Motorsport//ID',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		foldLine(`X-WR-CALNAME:${escapeIcs(name)}`),
		'X-WR-TIMEZONE:UTC'
	];
	const stamp = toIcsDate(new Date().toISOString());
	for (const ev of events) {
		lines.push('BEGIN:VEVENT');
		lines.push(`UID:${ev.uid}`);
		lines.push(`DTSTAMP:${stamp}`);
		lines.push(`DTSTART:${toIcsDate(ev.start)}`);
		lines.push(`DTEND:${toIcsDate(ev.end)}`);
		lines.push(foldLine(`SUMMARY:${escapeIcs(ev.summary)}`));
		if (ev.location) lines.push(foldLine(`LOCATION:${escapeIcs(ev.location)}`));
		if (ev.description) lines.push(foldLine(`DESCRIPTION:${escapeIcs(ev.description)}`));
		lines.push(`URL:${SITE.url}/jadwal`);
		lines.push('END:VEVENT');
	}
	lines.push('END:VCALENDAR');
	return lines.join('\r\n');
}

function f1Events(weekends: F1Weekend[]): IcsEvent[] {
	const out: IcsEvent[] = [];
	for (const w of weekends) {
		for (const s of w.sessions) {
			const end = s.date_end ?? s.date_start;
			out.push({
				uid: `f1-${s.session_key}@boxnow`,
				start: s.date_start,
				end,
				summary: `F1 ${w.country_name} GP — ${sessionLabel(s)}`,
				location: `${w.circuit_short_name}, ${w.location}`,
				description: `Sesi ${s.session_name} pada ${w.country_name} GP ${new Date(w.starts_at).getUTCFullYear()}.`
			});
		}
	}
	return out;
}

function sessionLabel(s: F1Session): string {
	if (s.session_name.startsWith('Practice ')) return 'FP' + s.session_name.replace('Practice ', '');
	return s.session_name;
}

function pbEventEnd(e: EventRecord): string {
	if (e.ends_at) return e.ends_at;
	const start = new Date(e.starts_at).getTime();
	const durMs = e.session === 'race' ? 2 * 60 * 60 * 1000 : 90 * 60 * 1000;
	return new Date(start + durMs).toISOString();
}

function pbEvents(seriesLabel: string, events: EventRecord[]): IcsEvent[] {
	return events.map((e) => ({
		uid: `${e.id}@boxnow`,
		start: e.starts_at,
		end: pbEventEnd(e),
		summary: `${seriesLabel} — ${e.title}`,
		location: e.circuit ?? undefined,
		description: e.title
	}));
}

async function loadF1(fetchFn: typeof fetch, year: number): Promise<F1Weekend[]> {
	const res = await fetchFn(`https://api.openf1.org/v1/sessions?year=${year}`);
	if (!res.ok) throw new Error(`OpenF1 ${res.status}`);
	const sessions = (await res.json()) as F1Session[];
	return groupByWeekend(sessions);
}

async function loadCategoryEvents(
	fetchFn: typeof fetch,
	category: EventCategory,
	year: number
): Promise<EventRecord[]> {
	if (category === 'motogp') {
		try {
			const api = await fetchMotoGpSchedule(fetchFn, year);
			if (api.length > 0) return api;
		} catch {
			// ignore
		}
	}
	try {
		const sdb = await fetchSportsDbSchedule(fetchFn, category);
		if (sdb && sdb.length > 0) return sdb;
	} catch {
		// ignore
	}
	try {
		return await pb.collection('events').getFullList<EventRecord>({
			filter: `category = "${category}"`,
			sort: 'starts_at'
		});
	} catch {
		return [];
	}
}

export const GET: RequestHandler = async ({ params, fetch }) => {
	if (!isSeries(params.series)) throw error(404, 'Seri tidak ditemukan');
	const series: Series = params.series;
	const meta = SERIES_LIST.find((s) => s.id === series)!;
	const year = new Date().getFullYear();

	let events: IcsEvent[] = [];
	if (series === 'f1') {
		try {
			const weekends = await loadF1(fetch, year);
			events = f1Events(weekends);
		} catch {
			events = [];
		}
	} else {
		const list = await loadCategoryEvents(fetch, series, year);
		events = pbEvents(meta.label, list);
	}

	const ics = buildIcs(`${meta.label} ${year}`, events);

	return new Response(ics, {
		headers: {
			'content-type': 'text/calendar; charset=utf-8',
			'content-disposition': `attachment; filename="${series}-${year}.ics"`,
			'cache-control': 'public, max-age=600, s-maxage=1800'
		}
	});
};
