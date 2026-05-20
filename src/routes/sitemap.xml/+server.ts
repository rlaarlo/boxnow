import type { RequestHandler } from './$types';
import { listPublicPosts, listCategoryFacets, listTagFacets } from '$lib/services/public';
import { SITE } from '$lib/site';

export const prerender = false;

const STATIC_PATHS: Array<{ path: string; changefreq: string; priority: number }> = [
	{ path: '/', changefreq: 'daily', priority: 1.0 },
	{ path: '/jadwal', changefreq: 'daily', priority: 0.9 },
	{ path: '/jadwal/f1', changefreq: 'hourly', priority: 0.9 },
	{ path: '/jadwal/motogp', changefreq: 'hourly', priority: 0.85 },
	{ path: '/jadwal/wsbk', changefreq: 'hourly', priority: 0.8 },
	{ path: '/jadwal/wec', changefreq: 'hourly', priority: 0.8 },
	{ path: '/jadwal/formulae', changefreq: 'hourly', priority: 0.8 },
	{ path: '/kategori', changefreq: 'weekly', priority: 0.6 },
	{ path: '/tag', changefreq: 'weekly', priority: 0.5 }
];

function xmlEscape(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

export const GET: RequestHandler = async () => {
	let posts: { slug: string; updated: string }[] = [];
	let categories: { slug: string }[] = [];
	let tags: { slug: string }[] = [];
	try {
		const items = await listPublicPosts();
		posts = items.map((p) => ({ slug: p.slug, updated: p.updated }));
	} catch {
		// fallthrough
	}
	try {
		categories = (await listCategoryFacets()).map((c) => ({ slug: c.slug }));
	} catch {
		// fallthrough
	}
	try {
		tags = (await listTagFacets()).map((t) => ({ slug: t.slug }));
	} catch {
		// fallthrough
	}

	const urls = [
		...STATIC_PATHS.map(
			(p) =>
				`<url><loc>${xmlEscape(SITE.url + p.path)}</loc><changefreq>${p.changefreq}</changefreq><priority>${p.priority.toFixed(1)}</priority></url>`
		),
		...posts.map(
			(p) =>
				`<url><loc>${xmlEscape(`${SITE.url}/blog/${p.slug}`)}</loc><lastmod>${xmlEscape(new Date(p.updated).toISOString())}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`
		),
		...categories.map(
			(c) =>
				`<url><loc>${xmlEscape(`${SITE.url}/kategori/${c.slug}`)}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>`
		),
		...tags.map(
			(t) =>
				`<url><loc>${xmlEscape(`${SITE.url}/tag/${t.slug}`)}</loc><changefreq>weekly</changefreq><priority>0.4</priority></url>`
		)
	].join('');

	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=600, s-maxage=3600'
		}
	});
};
