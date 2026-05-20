<script lang="ts">
	import type { PostRecord } from '$lib/types';
	import { getPostThumbnailUrl } from '$lib/services/public';

	type Props = { post: PostRecord };
	let { post }: Props = $props();
	const thumb = $derived(getPostThumbnailUrl(post));
</script>

<a
	href="/blog/{post.slug}"
	class="card preset-filled-surface-100-900 border-surface-200-800 border-[1px] overflow-hidden hover:scale-[1.01] transition group flex flex-col"
>
	<div class="aspect-video bg-surface-200-800 overflow-hidden">
		{#if thumb}
			<img src={thumb} alt={post.title} class="w-full h-full object-cover" loading="lazy" />
		{:else}
			<div class="w-full h-full grid place-items-center text-3xl opacity-20" aria-hidden="true">📰</div>
		{/if}
	</div>
	<div class="p-4 space-y-2 flex-1 flex flex-col">
		<h2 class="h6 leading-tight group-hover:text-primary-500 line-clamp-2">{post.title}</h2>
		{#if post.excerpt}
			<p class="text-sm opacity-70 line-clamp-2">{post.excerpt}</p>
		{/if}
		<div class="flex items-center gap-2 text-xs opacity-60 pt-1 mt-auto">
			{#if post.category}
				<span class="badge preset-tonal text-xs">{post.category}</span>
			{/if}
			<time datetime={post.created}>
				{new Date(post.created).toLocaleDateString('id-ID', {
					year: 'numeric',
					month: 'short',
					day: 'numeric'
				})}
			</time>
		</div>
	</div>
</a>
