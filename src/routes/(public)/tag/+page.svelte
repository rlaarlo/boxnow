<script lang="ts">
	import { page } from '$app/state';
	import Seo from '$lib/components/Seo.svelte';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import { resolveSeo, breadcrumbJsonLd } from '$lib/seo';
	import { absoluteUrl } from '$lib/site';

	let { data } = $props();
	const tags = $derived(data.tags);

	const seo = $derived(
		resolveSeo(
			{
				title: 'Semua Tag',
				description: 'Daftar tag artikel motorsport DRSMODE.NET.'
			},
			page.url.pathname
		)
	);

	const jsonLd = $derived([
		breadcrumbJsonLd([
			{ name: 'Beranda', url: absoluteUrl('/') },
			{ name: 'Tag', url: absoluteUrl('/tag') }
		])
	]);
</script>

<Seo {seo} {jsonLd} />

<div class="space-y-6">
	<Breadcrumb items={[{ name: 'Beranda', href: '/' }, { name: 'Tag' }]} />
	<header class="space-y-2">
		<h1 class="h1">Tag</h1>
		<p class="opacity-70 text-sm">{tags.length} tag tersedia.</p>
	</header>

	{#if tags.length === 0}
		<div class="text-center py-12 opacity-60">Belum ada tag.</div>
	{:else}
		<ul class="flex flex-wrap gap-2">
			{#each tags as t (t.slug)}
				<li>
					<a
						href="/tag/{t.slug}"
						class="inline-flex items-center gap-2 rounded-full border-[1px] border-surface-200-800 bg-surface-100-900 px-4 py-2 text-sm hover:bg-surface-200-800"
					>
						<span class="font-semibold">#{t.value}</span>
						<span class="opacity-60">{t.count}</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>
