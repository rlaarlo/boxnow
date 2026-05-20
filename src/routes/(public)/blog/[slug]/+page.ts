import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getPostBySlug, getRelatedPosts } from '$lib/services/public';

export const load: PageLoad = async ({ params }) => {
	const post = await getPostBySlug(params.slug);
	if (!post) {
		throw error(404, 'Artikel tidak ditemukan');
	}
	let related: Awaited<ReturnType<typeof getRelatedPosts>> = [];
	try {
		related = await getRelatedPosts(post, 4);
	} catch {
		related = [];
	}
	return { post, related };
};
