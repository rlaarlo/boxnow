export type Series = 'f1' | 'motogp' | 'wsbk' | 'wec' | 'formulae' | 'dtm' | 'gt';

export interface SeriesMeta {
	id: Series;
	label: string;
	short: string;
	description: string;
	/** Optional FA icon as fallback when no SVG logo is available. */
	icon: string;
}

export const SERIES_LIST: SeriesMeta[] = [
	{ id: 'f1', label: 'Formula 1', short: 'F1', description: 'Race weekend, qualifying, sprint, dan race.', icon: 'fa-flag-checkered' },
	{ id: 'motogp', label: 'MotoGP', short: 'MotoGP', description: 'Kelas premier balap motor dunia.', icon: 'fa-motorcycle' },
	{ id: 'wsbk', label: 'WSBK', short: 'WSBK', description: 'World Superbike Championship.', icon: 'fa-motorcycle' },
	{ id: 'wec', label: 'WEC', short: 'WEC', description: 'FIA World Endurance Championship.', icon: 'fa-stopwatch' },
	{ id: 'formulae', label: 'Formula E', short: 'FE', description: 'Single-seater listrik FIA.', icon: 'fa-bolt' },
	{ id: 'dtm', label: 'DTM', short: 'DTM', description: 'Deutsche Tourenwagen Masters — GT3 touring car Jerman.', icon: 'fa-car' },
	{ id: 'gt', label: 'GT World Challenge', short: 'GT', description: 'Fanatec GT World Challenge — balap GT3 internasional.', icon: 'fa-car-side' }
];

export function isSeries(v: string | null | undefined): v is Series {
	return (
		v === 'f1' ||
		v === 'motogp' ||
		v === 'wsbk' ||
		v === 'wec' ||
		v === 'formulae' ||
		v === 'dtm' ||
		v === 'gt'
	);
}
