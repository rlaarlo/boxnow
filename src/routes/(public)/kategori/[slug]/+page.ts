import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { findCategoryBySlug, listPublicPostsPaged } from '$lib/services/public';

export const load: PageLoad = async ({ params, url }) => {
	const facet = await findCategoryBySlug(params.slug);
	if (!facet) throw error(404, 'Kategori tidak ditemukan');
	const pageParam = Number(url.searchParams.get('page') ?? '1');
	const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
	const result = await listPublicPostsPaged({ page, perPage: 12, category: params.slug });
	return { facet, ...result };
};
