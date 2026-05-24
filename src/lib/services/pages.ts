import { pb } from '$lib/pocketbase';

export type PageRecord = {
	id: string;
	slug: string;
	content: string;
	updated: string;
};

/** Load a static page by slug. Returns null if not found. */
export async function getPage(slug: string): Promise<PageRecord | null> {
	try {
		return await pb
			.collection('pages')
			.getFirstListItem<PageRecord>(`slug = "${slug}"`);
	} catch {
		return null;
	}
}

/** Upsert page content by slug (create if missing, update if exists). */
export async function savePage(slug: string, content: string): Promise<PageRecord> {
	const existing = await getPage(slug);
	if (existing) {
		return await pb.collection('pages').update<PageRecord>(existing.id, { content });
	}
	return await pb.collection('pages').create<PageRecord>({ slug, content });
}
