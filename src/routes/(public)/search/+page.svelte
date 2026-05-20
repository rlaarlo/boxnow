<script lang="ts">
	import { page } from '$app/state';
	import Seo from '$lib/components/Seo.svelte';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import PostGrid from '$lib/components/PostGrid.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import { resolveSeo, breadcrumbJsonLd } from '$lib/seo';
	import { absoluteUrl } from '$lib/site';

	let { data } = $props();
	const q = $derived(data.q);
	const items = $derived(data.items);
	const currentPage = $derived(data.page);
	const totalPages = $derived(data.totalPages);

	let query = $state('');
	$effect(() => {
		query = data.q;
	});

	function pageHref(n: number) {
		const params = new URLSearchParams();
		if (q) params.set('q', q);
		if (n > 1) params.set('page', String(n));
		const qs = params.toString();
		return qs ? `/search?${qs}` : '/search';
	}

	const seo = $derived(
		resolveSeo(
			{
				title: q ? `Pencarian: ${q}` : 'Pencarian',
				description: q
					? `Hasil pencarian untuk "${q}" di Boxnow.`
					: 'Cari artikel motorsport di Boxnow.',
				noindex: true,
				canonical: pageHref(currentPage)
			},
			page.url.pathname
		)
	);

	const jsonLd = $derived([
		breadcrumbJsonLd([
			{ name: 'Beranda', url: absoluteUrl('/') },
			{ name: 'Pencarian', url: absoluteUrl('/search') }
		])
	]);
</script>

<Seo {seo} {jsonLd} />

<div class="space-y-6">
	<Breadcrumb items={[{ name: 'Beranda', href: '/' }, { name: 'Pencarian' }]} />
	<header class="space-y-3">
		<h1 class="h1">Pencarian</h1>
		<form method="get" action="/search" class="flex gap-2 max-w-xl">
			<input
				type="search"
				name="q"
				class="input flex-1"
				placeholder="Cari judul, tag, kategori..."
				bind:value={query}
				aria-label="Kata kunci"
			/>
			<button type="submit" class="btn preset-filled-primary-500">Cari</button>
		</form>
	</header>

	{#if q}
		<p class="text-sm opacity-70">
			{data.totalItems} hasil untuk <span class="font-semibold">"{q}"</span>
		</p>
		<PostGrid posts={items} emptyText="Tidak ada artikel yang cocok." />
		<Pagination page={currentPage} {totalPages} buildHref={pageHref} />
	{:else}
		<p class="opacity-60 text-sm">Masukkan kata kunci untuk mulai mencari.</p>
	{/if}
</div>
