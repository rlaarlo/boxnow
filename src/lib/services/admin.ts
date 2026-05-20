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

export async function deletePost(id: string): Promise<boolean> {
	return await pb.collection('posts').delete(id);
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
