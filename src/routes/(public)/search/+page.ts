import type { PageLoad } from './$types';
import { listPublicPostsPaged } from '$lib/services/public';

export const load: PageLoad = async ({ url }) => {
	const q = (url.searchParams.get('q') ?? '').trim();
	const pageParam = Number(url.searchParams.get('page') ?? '1');
	const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
	if (!q) {
		return { q: '', items: [], page: 1, perPage: 12, totalItems: 0, totalPages: 1 };
	}
	try {
		const result = await listPublicPostsPaged({ page, perPage: 12, q });
		return { q, ...result };
	} catch {
		return { q, items: [], page: 1, perPage: 12, totalItems: 0, totalPages: 1 };
	}
};
