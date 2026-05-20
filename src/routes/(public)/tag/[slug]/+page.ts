import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { findTagBySlug, listPublicPostsPaged } from '$lib/services/public';

export const load: PageLoad = async ({ params, url }) => {
	const facet = await findTagBySlug(params.slug);
	if (!facet) throw error(404, 'Tag tidak ditemukan');
	const pageParam = Number(url.searchParams.get('page') ?? '1');
	const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
	const result = await listPublicPostsPaged({ page, perPage: 12, tag: params.slug });
	return { facet, ...result };
};
