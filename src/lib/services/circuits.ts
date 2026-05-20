// Country + circuit-layout lookup for jadwal pages.
// Layout images are served from /static/circuits/ — sourced from racingcircuits.info
// (see src/lib/assets/racingcircuits for the original archive + metadata).

const COUNTRY_ID: Record<string, string> = {
	AE: 'Uni Emirat Arab',
	AR: 'Argentina',
	AT: 'Austria',
	AU: 'Australia',
	AZ: 'Azerbaijan',
	BE: 'Belgia',
	BH: 'Bahrain',
	BR: 'Brasil',
	CA: 'Kanada',
	CN: 'China',
	CZ: 'Ceko',
	DE: 'Jerman',
	ES: 'Spanyol',
	FI: 'Finlandia',
	FR: 'Prancis',
	GB: 'Inggris',
	HU: 'Hungaria',
	ID: 'Indonesia',
	IN: 'India',
	IT: 'Italia',
	JP: 'Jepang',
	MA: 'Maroko',
	MC: 'Monako',
	MX: 'Meksiko',
	MY: 'Malaysia',
	NL: 'Belanda',
	PT: 'Portugal',
	QA: 'Qatar',
	RU: 'Rusia',
	SA: 'Arab Saudi',
	SG: 'Singapura',
	TH: 'Thailand',
	TR: 'Turki',
	US: 'Amerika Serikat',
	ZA: 'Afrika Selatan'
};

/** Convert a regional-indicator flag emoji (e.g. "🇮🇹") to Indonesian country name. */
export function flagToCountry(flag?: string | null): string | null {
	if (!flag) return null;
	const cp1 = flag.codePointAt(0);
	const cp2 = flag.codePointAt(2);
	if (!cp1 || !cp2) return null;
	const A = 0x1f1e6;
	const a = String.fromCharCode(65 + (cp1 - A));
	const b = String.fromCharCode(65 + (cp2 - A));
	return COUNTRY_ID[a + b] ?? null;
}

export interface CircuitInfo {
	country?: string;
	layout?: string;
}

/** Local circuit map. Files live in /static/circuits/. */
const L = (file: string) => `/circuits/${file}`;

/**
 * Keyed by lowercase token that should appear in the circuit / GP name.
 * First matching key wins, so put more specific tokens first.
 */
const CIRCUITS: Array<[string, CircuitInfo]> = [
	// — Formula 1 —
	['sakhir', { country: 'Bahrain', layout: L('bahrain.png') }],
	['bahrain', { country: 'Bahrain', layout: L('bahrain.png') }],
	['jeddah', { country: 'Arab Saudi', layout: L('jeddah.png') }],
	['melbourne', { country: 'Australia', layout: L('melbourne.png') }],
	['albert park', { country: 'Australia', layout: L('melbourne.png') }],
	['suzuka', { country: 'Jepang', layout: L('suzuka.png') }],
	['shanghai', { country: 'China', layout: L('shanghai.png') }],
	['miami', { country: 'Amerika Serikat', layout: L('miami.png') }],
	['imola', { country: 'Italia', layout: L('imola.png') }],
	['monaco', { country: 'Monako', layout: L('monaco.png') }],
	['monte carlo', { country: 'Monako', layout: L('monaco.png') }],
	['montreal', { country: 'Kanada', layout: L('montreal.png') }],
	['gilles villeneuve', { country: 'Kanada', layout: L('montreal.png') }],
	['catalunya', { country: 'Spanyol', layout: L('barcelona.png') }],
	['barcelona', { country: 'Spanyol', layout: L('barcelona.png') }],
	['red bull ring', { country: 'Austria', layout: L('red-bull-ring.png') }],
	['spielberg', { country: 'Austria', layout: L('red-bull-ring.png') }],
	['silverstone', { country: 'Inggris', layout: L('silverstone.png') }],
	['hungaroring', { country: 'Hungaria', layout: L('hungaroring.png') }],
	['spa', { country: 'Belgia', layout: L('spa.png') }],
	['francorchamps', { country: 'Belgia', layout: L('spa.png') }],
	['zandvoort', { country: 'Belanda', layout: L('zandvoort.png') }],
	['monza', { country: 'Italia', layout: L('monza.png') }],
	['baku', { country: 'Azerbaijan', layout: L('baku.png') }],
	['marina bay', { country: 'Singapura', layout: L('singapore.png') }],
	['singapore', { country: 'Singapura', layout: L('singapore.png') }],
	['austin', { country: 'Amerika Serikat', layout: L('cota.jpg') }],
	['cota', { country: 'Amerika Serikat', layout: L('cota.jpg') }],
	['americas', { country: 'Amerika Serikat', layout: L('cota.jpg') }],
	['mexico', { country: 'Meksiko', layout: L('mexico-city.png') }],
	['hermanos rodriguez', { country: 'Meksiko', layout: L('mexico-city.png') }],
	['interlagos', { country: 'Brasil', layout: L('interlagos.png') }],
	['são paulo', { country: 'Brasil', layout: L('interlagos.png') }],
	['sao paulo', { country: 'Brasil', layout: L('interlagos.png') }],
	['las vegas', { country: 'Amerika Serikat', layout: L('las-vegas.png') }],
	['lusail', { country: 'Qatar', layout: L('lusail.png') }],
	['losail', { country: 'Qatar', layout: L('lusail.png') }],
	['qatar', { country: 'Qatar', layout: L('lusail.png') }],
	['yas marina', { country: 'Uni Emirat Arab', layout: L('yas-marina.png') }],
	['abu dhabi', { country: 'Uni Emirat Arab', layout: L('yas-marina.png') }],
	// — MotoGP / WSBK extras —
	['portimão', { country: 'Portugal', layout: L('portimao.png') }],
	['portimao', { country: 'Portugal', layout: L('portimao.png') }],
	['algarve', { country: 'Portugal', layout: L('portimao.png') }],
	['termas', { country: 'Argentina', layout: L('termas.png') }],
	['río hondo', { country: 'Argentina', layout: L('termas.png') }],
	['rio hondo', { country: 'Argentina', layout: L('termas.png') }],
	['mandalika', { country: 'Indonesia', layout: L('mandalika.png') }],
	['motegi', { country: 'Jepang', layout: L('motegi.png') }],
	['phillip island', { country: 'Australia', layout: L('phillip-island.png') }],
	['sepang', { country: 'Malaysia', layout: L('sepang.png') }],
	['buriram', { country: 'Thailand', layout: L('buriram.png') }],
	['chang', { country: 'Thailand', layout: L('buriram.png') }],
	['jerez', { country: 'Spanyol', layout: L('jerez.png') }],
	['mugello', { country: 'Italia', layout: L('mugello.png') }],
	['bugatti', { country: 'Prancis', layout: L('le-mans-bugatti.png') }],
	['le mans', { country: 'Prancis', layout: L('le-mans-bugatti.png') }],
	['sachsenring', { country: 'Jerman', layout: L('sachsenring.png') }],
	['assen', { country: 'Belanda', layout: L('assen.png') }],
	['misano', { country: 'Italia', layout: L('misano.png') }],
	['motorland', { country: 'Spanyol', layout: L('motorland-aragon.png') }],
	['aragón', { country: 'Spanyol', layout: L('motorland-aragon.png') }],
	['aragon', { country: 'Spanyol', layout: L('motorland-aragon.png') }]
];

/** Look up circuit info by free-form name string (circuit, venue, or GP name). */
export function circuitInfo(name?: string | null): CircuitInfo {
	if (!name) return {};
	const n = name.toLowerCase();
	for (const [key, info] of CIRCUITS) {
		if (n.includes(key)) return info;
	}
	return {};
}
