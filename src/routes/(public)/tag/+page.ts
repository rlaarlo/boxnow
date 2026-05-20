import type { PageLoad } from './$types';
import { listTagFacets } from '$lib/services/public';

export const load: PageLoad = async () => {
	try {
		const tags = await listTagFacets();
		return { tags };
	} catch {
		return { tags: [] };
	}
};
