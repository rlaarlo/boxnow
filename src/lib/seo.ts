import { SITE, absoluteUrl } from './site';

export type SeoMeta = {
	title?: string;
	description?: string;
	canonical?: string; // absolute or path
	image?: string; // absolute or path
	type?: 'website' | 'article';
	publishedTime?: string;
	modifiedTime?: string;
	noindex?: boolean;
	prev?: string; // absolute or path
	next?: string; // absolute or path
};

export type ResolvedSeo = {
	title: string;
	description: string;
	canonical: string;
	image: string;
	type: 'website' | 'article';
	publishedTime?: string;
	modifiedTime?: string;
	noindex: boolean;
	prev?: string;
	next?: string;
};

export function resolveSeo(meta: SeoMeta = {}, pathname = '/'): ResolvedSeo {
	const title = meta.title
		? `${meta.title} — ${SITE.name}`
		: SITE.defaultTitle;
	const description = meta.description ?? SITE.defaultDescription;
	const canonical = absoluteUrl(meta.canonical ?? pathname);
	const image = absoluteUrl(meta.image ?? '/og-default.png');
	return {
		title,
		description,
		canonical,
		image,
		type: meta.type ?? 'website',
		publishedTime: meta.publishedTime,
		modifiedTime: meta.modifiedTime,
		noindex: meta.noindex ?? false,
		prev: meta.prev ? absoluteUrl(meta.prev) : undefined,
		next: meta.next ? absoluteUrl(meta.next) : undefined
	};
}

/** Build JSON-LD object for an Article (blog post). */
export function articleJsonLd(opts: {
	url: string;
	headline: string;
	description: string;
	image?: string;
	datePublished: string;
	dateModified?: string;
	authorName?: string;
}) {
	return {
		'@context': 'https://schema.org',
		'@type': 'Article',
		mainEntityOfPage: { '@type': 'WebPage', '@id': opts.url },
		headline: opts.headline,
		description: opts.description,
		image: opts.image ? [opts.image] : undefined,
		datePublished: opts.datePublished,
		dateModified: opts.dateModified ?? opts.datePublished,
		author: opts.authorName
			? { '@type': 'Person', name: opts.authorName }
			: { '@type': 'Organization', name: SITE.name },
		publisher: {
			'@type': 'Organization',
			name: SITE.name,
			url: SITE.url
		}
	};
}

/** BreadcrumbList JSON-LD. items = ordered [{name, url}] */
export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((it, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: it.name,
			item: it.url
		}))
	};
}

/** SportsEvent JSON-LD for race sessions. */
export function sportsEventJsonLd(opts: {
	url?: string;
	name: string;
	startDate: string;
	endDate?: string;
	location?: string;
	sport?: string;
	performerName?: string;
	eventStatus?: 'Scheduled' | 'Live' | 'Completed' | 'Cancelled';
}) {
	const status: Record<string, string> = {
		Scheduled: 'https://schema.org/EventScheduled',
		Live: 'https://schema.org/EventScheduled',
		Completed: 'https://schema.org/EventScheduled',
		Cancelled: 'https://schema.org/EventCancelled'
	};
	return {
		'@context': 'https://schema.org',
		'@type': 'SportsEvent',
		name: opts.name,
		startDate: opts.startDate,
		endDate: opts.endDate ?? opts.startDate,
		eventStatus: status[opts.eventStatus ?? 'Scheduled'],
		eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
		sport: opts.sport ?? 'Motorsport',
		url: opts.url,
		location: opts.location
			? {
					'@type': 'Place',
					name: opts.location
				}
			: { '@type': 'VirtualLocation', url: SITE.url }
	};
}

export function websiteJsonLd() {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: SITE.name,
		url: SITE.url,
		potentialAction: {
			'@type': 'SearchAction',
			target: `${SITE.url}/search?q={search_term_string}`,
			'query-input': 'required name=search_term_string'
		}
	};
}
