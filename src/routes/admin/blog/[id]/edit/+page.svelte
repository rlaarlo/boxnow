<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import PostEditor from '$lib/components/admin/PostEditor.svelte';
	import { updatePost, type PostInput } from '$lib/services/admin';
	import { pb } from '$lib/pocketbase';
	import type { PostRecord } from '$lib/types';

	let post = $state<PostRecord | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	$effect(() => {
		const id = page.params.id;
		if (!id) return;
		loading = true;
		error = null;
		pb.collection('posts')
			.getOne<PostRecord>(id)
			.then((p) => {
				post = p;
			})
			.catch((err: unknown) => {
				error = err instanceof Error ? err.message : 'Gagal memuat artikel';
			})
			.finally(() => {
				loading = false;
			});
	});

	async function handleSave(data: PostInput, id?: string) {
		if (!id) return;
		await updatePost(id, data);
		await goto('/admin/blog');
	}

	function cancel() {
		goto('/admin/blog');
	}
</script>

<svelte:head><title>Edit Artikel — Admin</title></svelte:head>

<div class="space-y-3">
	<a href="/admin/blog" class="text-sm opacity-70 hover:opacity-100 inline-flex items-center gap-1">
		<span aria-hidden="true"><i class="fa-solid fa-arrow-left"></i></span> Kembali ke daftar artikel
	</a>

	{#if loading}
		<div class="opacity-60 text-sm py-8 text-center">Memuat artikel...</div>
	{:else if error}
		<div class="card preset-tonal-error p-3 text-sm">{error}</div>
	{:else if post}
		{#key post.id}
			<PostEditor {post} onsave={handleSave} oncancel={cancel} />
		{/key}
	{/if}
</div>
