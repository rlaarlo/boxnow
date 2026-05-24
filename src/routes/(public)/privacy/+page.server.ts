import type { PageServerLoad } from './$types';
import { getPage } from '$lib/services/pages';

export const load: PageServerLoad = async () => {
	const record = await getPage('privacy');
	return { content: record?.content ?? null };
};
