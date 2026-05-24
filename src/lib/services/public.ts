import { pb } from '$lib/pocketbase';
import type { PostRecord } from '$lib/types';
import { slugify } from '$lib/services/admin';

export async function listPublicPosts(): Promise<PostRecord[]> {
	const items = await pb.collection('posts').getFullList<PostRecord>({
		filter: 'published = true',
		sort: '-created',
		expand: 'author'
	});
	return items.sort((a, b) => {
		const pa = a.pinned ? 1 : 0;
		const pb_ = b.pinned ? 1 : 0;
		if (pa !== pb_) return pb_ - pa;
		return new Date(b.created).getTime() - new Date(a.created).getTime();
	});
}

export async function getPostBySlug(slug: string): Promise<PostRecord | null> {
	try {
		return await pb
			.collection('posts')
			.getFirstListItem<PostRecord>(`slug = "${slug}" && published = true`, {
				expand: 'author'
			});
	} catch {
		return null;
	}
}

export function getPostThumbnailUrl(post: PostRecord): string | null {
	if (!post.thumbnail) return null;
	return pb.files.getURL(post, post.thumbnail);
}

export function postTags(post: PostRecord): string[] {
	return (post.tags ?? '')
		.split(',')
		.map((t) => t.trim())
		.filter(Boolean);
}

export type PostListFilter = {
	category?: string;
	tag?: string;
	q?: string;
	exclude?: string;
};

function matchesFilter(post: PostRecord, f: PostListFilter): boolean {
	if (f.exclude && post.id === f.exclude) return false;
	if (f.category && slugify(post.category ?? '') !== f.category) return false;
	if (f.tag) {
		const tags = postTags(post).map((t) => slugify(t));
		if (!tags.includes(f.tag)) return false;
	}
	if (f.q) {
		const q = f.q.trim().toLowerCase();
		if (!q) return true;
		const hay =
			`${post.title} ${post.excerpt ?? ''} ${post.tags ?? ''} ${post.category ?? ''}`.toLowerCase();
		if (!hay.includes(q)) return false;
	}
	return true;
}

export type Paginated<T> = {
	items: T[];
	page: number;
	perPage: number;
	totalItems: number;
	totalPages: number;
};

export async function listPublicPostsPaged(
	opts: { page?: number; perPage?: number } & PostListFilter = {}
): Promise<Paginated<PostRecord>> {
	const perPage = Math.max(1, Math.min(50, opts.perPage ?? 12));
	const requested = Math.max(1, opts.page ?? 1);
	const all = await listPublicPosts();
	const filtered = all.filter((p) => matchesFilter(p, opts));
	const totalItems = filtered.length;
	const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
	const page = Math.min(requested, totalPages);
	const start = (page - 1) * perPage;
	return {
		items: filtered.slice(start, start + perPage),
		page,
		perPage,
		totalItems,
		totalPages
	};
}

export async function getRelatedPosts(post: PostRecord, limit = 4): Promise<PostRecord[]> {
	const all = (await listPublicPosts()).filter((p) => p.id !== post.id);
	const cat = slugify(post.category ?? '');
	const tags = postTags(post).map((t) => slugify(t));

	const score = (p: PostRecord): number => {
		let s = 0;
		if (cat && slugify(p.category ?? '') === cat) s += 5;
		const pTags = postTags(p).map((t) => slugify(t));
		for (const t of tags) if (pTags.includes(t)) s += 2;
		return s;
	};

	return [...all]
		.map((p) => ({ p, s: score(p) }))
		.sort((a, b) => {
			if (b.s !== a.s) return b.s - a.s;
			return new Date(b.p.created).getTime() - new Date(a.p.created).getTime();
		})
		.slice(0, limit)
		.map((x) => x.p);
}

export type Facet = { value: string; slug: string; count: number };

export async function listCategoryFacets(): Promise<Facet[]> {
	const all = await listPublicPosts();
	const map = new Map<string, Facet>();
	for (const p of all) {
		const v = (p.category ?? '').trim();
		if (!v) continue;
		const s = slugify(v);
		const existing = map.get(s);
		if (existing) existing.count += 1;
		else map.set(s, { value: v, slug: s, count: 1 });
	}
	return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export async function listTagFacets(): Promise<Facet[]> {
	const all = await listPublicPosts();
	const map = new Map<string, Facet>();
	for (const p of all) {
		for (const tag of postTags(p)) {
			const s = slugify(tag);
			const existing = map.get(s);
			if (existing) existing.count += 1;
			else map.set(s, { value: tag, slug: s, count: 1 });
		}
	}
	return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export async function findCategoryBySlug(slug: string): Promise<Facet | null> {
	const all = await listCategoryFacets();
	return all.find((c) => c.slug === slug) ?? null;
}

export async function findTagBySlug(slug: string): Promise<Facet | null> {
	const all = await listTagFacets();
	return all.find((t) => t.slug === slug) ?? null;
}
