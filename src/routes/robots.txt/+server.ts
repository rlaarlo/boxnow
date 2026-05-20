import type { RequestHandler } from './$types';
import { SITE } from '$lib/site';

export const prerender = false;

export const GET: RequestHandler = () => {
	const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /login
Disallow: /register

Sitemap: ${SITE.url}/sitemap.xml
`;
	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
