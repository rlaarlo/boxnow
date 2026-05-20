export type Series = 'f1' | 'motogp' | 'wsbk' | 'wec' | 'formulae';

export interface SeriesMeta {
	id: Series;
	label: string;
	short: string;
	description: string;
}

export const SERIES_LIST: SeriesMeta[] = [
	{ id: 'f1', label: 'Formula 1', short: 'F1', description: 'Race weekend, qualifying, sprint, dan race.' },
	{ id: 'motogp', label: 'MotoGP', short: 'MotoGP', description: 'Kelas premier balap motor dunia.' },
	{ id: 'wsbk', label: 'WSBK', short: 'WSBK', description: 'World Superbike Championship.' },
	{ id: 'wec', label: 'WEC', short: 'WEC', description: 'FIA World Endurance Championship.' },
	{ id: 'formulae', label: 'Formula E', short: 'FE', description: 'Single-seater listrik FIA.' }
];

export function isSeries(v: string | null | undefined): v is Series {
	return v === 'f1' || v === 'motogp' || v === 'wsbk' || v === 'wec' || v === 'formulae';
}
