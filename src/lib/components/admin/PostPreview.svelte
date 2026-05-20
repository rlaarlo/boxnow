<script lang="ts">
	type Props = {
		title: string;
		excerpt: string;
		content: string;
		category: string;
		tags: string;
		thumbnailUrl: string | null;
	};
	let { title, excerpt, content, category, tags, thumbnailUrl }: Props = $props();

	const tagList = $derived(
		tags
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean)
	);
</script>

<article class="space-y-6">
	<header class="space-y-3">
		<h1 class="h1 leading-tight">{title || 'Tanpa judul'}</h1>
		{#if excerpt}
			<p class="opacity-75">{excerpt}</p>
		{/if}
		<div class="flex flex-wrap items-center gap-2 text-sm opacity-70">
			{#if category}
				<span class="badge preset-tonal">{category}</span>
			{/if}
			<span>Preview · tidak disimpan</span>
		</div>
	</header>

	{#if thumbnailUrl}
		<img src={thumbnailUrl} alt={title} class="rounded-lg w-full aspect-video object-cover" />
	{/if}

	{#if content.trim()}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		<div class="prose prose-invert max-w-none">
			{@html content}
		</div>
	{:else}
		<p class="opacity-50 italic">Konten kosong.</p>
	{/if}

	{#if tagList.length}
		<footer class="flex flex-wrap gap-2 pt-4 border-t-[1px] border-surface-200-800">
			{#each tagList as tag (tag)}
				<span class="badge preset-tonal-surface">#{tag}</span>
			{/each}
		</footer>
	{/if}
</article>
