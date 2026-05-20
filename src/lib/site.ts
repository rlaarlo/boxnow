// Site-wide configuration. Values can be overridden via PUBLIC_SITE_URL / PUBLIC_SITE_NAME.
import { env } from '$env/dynamic/public';

export const SITE = {
	name: env.PUBLIC_SITE_NAME || 'Boxnow',
	url: (env.PUBLIC_SITE_URL || 'http://localhost:5173').replace(/\/$/, ''),
	defaultTitle: 'Boxnow — Berita & Jadwal Motorsport (F1, MotoGP, WEC, Formula E)',
	defaultDescription:
		'Boxnow: portal berita, analisis, dan jadwal balap motorsport — Formula 1, MotoGP, WEC, Formula E. Jadwal lengkap & countdown sesi race weekend.',
	locale: 'id_ID',
	twitterHandle: env.PUBLIC_TWITTER_HANDLE || ''
};

export function absoluteUrl(path: string): string {
	if (!path) return SITE.url;
	if (/^https?:\/\//i.test(path)) return path;
	return `${SITE.url}${path.startsWith('/') ? '' : '/'}${path}`;
}
