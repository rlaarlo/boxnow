<script lang="ts">
	import { page } from '$app/state';
	import Seo from '$lib/components/Seo.svelte';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import { resolveSeo, breadcrumbJsonLd } from '$lib/seo';
	import { absoluteUrl } from '$lib/site';

	let { data } = $props();
	const categories = $derived(data.categories);

	const seo = $derived(
		resolveSeo(
			{
				title: 'Semua Kategori',
				description: 'Telusuri artikel motorsport DRSMODE.NET berdasarkan kategori.'
			},
			page.url.pathname
		)
	);

	const jsonLd = $derived([
		breadcrumbJsonLd([
			{ name: 'Beranda', url: absoluteUrl('/') },
			{ name: 'Kategori', url: absoluteUrl('/kategori') }
		])
	]);
</script>

<Seo {seo} {jsonLd} />

<div class="space-y-6">
	<Breadcrumb items={[{ name: 'Beranda', href: '/' }, { name: 'Kategori' }]} />
	<header class="space-y-2">
		<h1 class="h1">Kategori</h1>
		<p class="opacity-70 text-sm">{categories.length} kategori tersedia.</p>
	</header>

	{#if categories.length === 0}
		<div class="text-center py-12 opacity-60">Belum ada kategori.</div>
	{:else}
		<ul class="flex flex-wrap gap-2">
			{#each categories as c (c.slug)}
				<li>
					<a
						href="/kategori/{c.slug}"
						class="inline-flex items-center gap-2 rounded-full border-[1px] border-surface-200-800 bg-surface-100-900 px-4 py-2 text-sm hover:bg-surface-200-800"
					>
						<span class="font-semibold">{c.value}</span>
						<span class="opacity-60">{c.count}</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>
