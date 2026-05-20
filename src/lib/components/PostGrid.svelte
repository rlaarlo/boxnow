<script lang="ts">
	import type { PostRecord } from '$lib/types';
	import PostCard from '$lib/components/PostCard.svelte';

	type Props = { posts: PostRecord[]; emptyText?: string };
	let { posts, emptyText = 'Belum ada artikel.' }: Props = $props();
</script>

{#if posts.length === 0}
	<div class="text-center py-12 opacity-60">{emptyText}</div>
{:else}
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each posts as post (post.id)}
			<PostCard {post} />
		{/each}
	</div>
{/if}
