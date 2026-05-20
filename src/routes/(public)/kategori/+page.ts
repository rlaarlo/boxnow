import type { PageLoad } from './$types';
import { listCategoryFacets } from '$lib/services/public';

export const load: PageLoad = async () => {
	try {
		const categories = await listCategoryFacets();
		return { categories };
	} catch {
		return { categories: [] };
	}
};
