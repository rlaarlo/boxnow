import type { PageLoad } from './$types';
import { listPublicPostsPaged } from '$lib/services/public';
import { listNextEvents } from '$lib/services/events';
import type { EventRecord } from '$lib/types';

export const load: PageLoad = async ({ url }) => {
	const pageParam = Number(url.searchParams.get('page') ?? '1');
	const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
	const [postsResult, upcomingEvents] = await Promise.all([
		listPublicPostsPaged({ page, perPage: 12 }).catch(() => ({
			items: [],
			page: 1,
			perPage: 12,
			totalItems: 0,
			totalPages: 1
		})),
		page === 1 ? listNextEvents(5).catch(() => [] as EventRecord[]) : Promise.resolve([] as EventRecord[])
	]);
	return { ...postsResult, upcomingEvents };
};
