import { pb } from '$lib/pocketbase';
import type { UserRecord, PostRecord } from '$lib/types';

export function slugify(input: string): string {
	return input
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-');
}

// ---- Users ----
export async function listUsers(): Promise<UserRecord[]> {
	return await pb.collection('users').getFullList<UserRecord>({ sort: '-created' });
}

export async function updateUserRole(id: string, role: 'member' | 'admin'): Promise<UserRecord> {
	return await pb.collection('users').update<UserRecord>(id, { role });
}

// ---- Posts ----
export async function listPosts(): Promise<PostRecord[]> {
	return await pb.collection('posts').getFullList<PostRecord>({ sort: '-created' });
}

export type PostInput = {
	title: string;
	slug: string;
	content: string;
	excerpt: string;
	category: string;
	tags: string;
	published: boolean;
	pinned: boolean;
	thumbnail?: File | null;
};

function buildPostFormData(data: PostInput, authorId?: string): FormData {
	const fd = new FormData();
	fd.append('title', data.title);
	fd.append('slug', data.slug);
	fd.append('content', data.content);
	fd.append('excerpt', data.excerpt);
	fd.append('category', data.category);
	fd.append('tags', data.tags);
	fd.append('published', String(data.published));
	fd.append('pinned', String(data.pinned));
	if (authorId) fd.append('author', authorId);
	if (data.thumbnail) fd.append('thumbnail', data.thumbnail);
	return fd;
}

export async function createPost(data: PostInput, authorId: string): Promise<PostRecord> {
	return await pb.collection('posts').create<PostRecord>(buildPostFormData(data, authorId));
}

export async function updatePost(id: string, data: PostInput): Promise<PostRecord> {
	return await pb.collection('posts').update<PostRecord>(id, buildPostFormData(data));
}

export async function togglePostPublished(id: string, published: boolean): Promise<PostRecord> {
	return await pb.collection('posts').update<PostRecord>(id, { published });
}

export async function togglePostPinned(id: string, pinned: boolean): Promise<PostRecord> {
	return await pb.collection('posts').update<PostRecord>(id, { pinned });
}

export async function deletePost(id: string): Promise<boolean> {
	return await pb.collection('posts').delete(id);
}

// ---- Categories (derived from post.category strings) ----
export type CategoryStat = {
	value: string;
	slug: string;
	total: number;
	published: number;
};

export async function listCategoryStats(): Promise<CategoryStat[]> {
	const posts = await pb
		.collection('posts')
		.getFullList<PostRecord>({ fields: 'id,category,published' });
	const map = new Map<string, CategoryStat>();
	for (const p of posts) {
		const v = (p.category ?? '').trim();
		if (!v) continue;
		const key = v.toLowerCase();
		const existing = map.get(key);
		if (existing) {
			existing.total += 1;
			if (p.published) existing.published += 1;
		} else {
			map.set(key, {
				value: v,
				slug: slugify(v),
				total: 1,
				published: p.published ? 1 : 0
			});
		}
	}
	return Array.from(map.values()).sort((a, b) =>
		a.value.toLowerCase().localeCompare(b.value.toLowerCase())
	);
}

async function findPostsByCategory(value: string): Promise<PostRecord[]> {
	const safe = value.replace(/"/g, '\\"');
	return await pb
		.collection('posts')
		.getFullList<PostRecord>({ filter: `category = "${safe}"`, fields: 'id,category' });
}

export async function renameCategory(oldValue: string, newValue: string): Promise<number> {
	const next = newValue.trim();
	if (!next) throw new Error('Nama kategori baru tidak boleh kosong');
	if (next === oldValue) return 0;
	const posts = await findPostsByCategory(oldValue);
	await Promise.all(
		posts.map((p) => pb.collection('posts').update(p.id, { category: next }))
	);
	return posts.length;
}

export async function deleteCategory(value: string): Promise<number> {
	const posts = await findPostsByCategory(value);
	await Promise.all(
		posts.map((p) => pb.collection('posts').update(p.id, { category: '' }))
	);
	return posts.length;
}

// ---- Media (image uploads) ----
export async function uploadMedia(file: File, uploadedBy?: string): Promise<string> {
	const fd = new FormData();
	fd.set('file', file);
	if (uploadedBy) fd.set('uploaded_by', uploadedBy);
	const record = await pb.collection('media').create(fd);
	return pb.files.getURL(record, record.file as string);
}

// ---- Stats ----
export async function getStats() {
	const safeCount = async (fn: () => Promise<{ totalItems: number }>) => {
		try {
			return (await fn()).totalItems;
		} catch {
			return 0;
		}
	};

	const [usersTotal, postsTotal, postsPublished, eventsTotal, totalAdmins] = await Promise.all([
		safeCount(() => pb.collection('users').getList(1, 1, { fields: 'id' })),
		safeCount(() => pb.collection('posts').getList(1, 1, { fields: 'id' })),
		safeCount(() =>
			pb.collection('posts').getList(1, 1, { filter: 'published = true', fields: 'id' })
		),
		safeCount(() => pb.collection('events').getList(1, 1, { fields: 'id' })),
		safeCount(() =>
			pb.collection('users').getList(1, 1, { filter: 'role = "admin"', fields: 'id' })
		)
	]);

	return {
		totalMembers: Math.max(0, usersTotal - totalAdmins),
		totalAdmins,
		totalPosts: postsTotal,
		publishedPosts: postsPublished,
		totalEvents: eventsTotal
	};
}
