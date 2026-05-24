<script lang="ts">
	import { goto } from '$app/navigation';
	import PostEditor from '$lib/components/admin/PostEditor.svelte';
	import { createPost, type PostInput } from '$lib/services/admin';
	import { auth } from '$lib/stores/auth.svelte';

	async function handleSave(data: PostInput) {
		if (!auth.user) throw new Error('Tidak ada user yang login');
		await createPost(data, auth.user.id);
		await goto('/admin/blog');
	}

	function cancel() {
		goto('/admin/blog');
	}
</script>

<svelte:head><title>Tulis Artikel — Admin</title></svelte:head>

<div class="space-y-3">
	<a href="/admin/blog" class="text-sm opacity-70 hover:opacity-100 inline-flex items-center gap-1">
		<span aria-hidden="true"><i class="fa-solid fa-arrow-left"></i></span> Kembali ke daftar artikel
	</a>
	<PostEditor onsave={handleSave} oncancel={cancel} />
</div>
