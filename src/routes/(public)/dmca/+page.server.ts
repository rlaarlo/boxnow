import type { PageServerLoad } from './$types';
import { getPage } from '$lib/services/pages';

export const load: PageServerLoad = async () => {
	const record = await getPage('dmca');
	return { content: record?.content ?? null };
};
