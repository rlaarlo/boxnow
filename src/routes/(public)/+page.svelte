<script lang="ts">
	import { page } from '$app/state';
	import Seo from '$lib/components/Seo.svelte';
	import AdSlot from '$lib/components/AdSlot.svelte';
	import PostGrid from '$lib/components/PostGrid.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import { env as publicEnv } from '$env/dynamic/public';
	import { resolveSeo, websiteJsonLd, breadcrumbJsonLd } from '$lib/seo';
	import { absoluteUrl, SITE } from '$lib/site';

	let { data } = $props();
	const items = $derived(data.items);
	const currentPage = $derived(data.page);
	const totalPages = $derived(data.totalPages);

	function pageHref(n: number) {
		return n <= 1 ? '/' : `/?page=${n}`;
	}

	const seo = $derived(
		resolveSeo(
			{
				title: currentPage > 1 ? `Halaman ${currentPage}` : undefined,
				description:
					'Berita, analisis, dan jadwal motorsport: Formula 1, MotoGP, WEC, Formula E. Update dari Boxnow.',
				type: 'website',
				canonical: pageHref(currentPage),
				prev: currentPage > 1 ? pageHref(currentPage - 1) : undefined,
				next: currentPage < totalPages ? pageHref(currentPage + 1) : undefined
			},
			page.url.pathname
		)
	);

	const jsonLd = $derived([
		websiteJsonLd(),
		breadcrumbJsonLd([{ name: 'Beranda', url: absoluteUrl('/') }])
	]);
</script>

<Seo {seo} {jsonLd} />

<div class="space-y-6">
	<section class="text-center py-6 sm:py-10">
		<h1 class="h1">{SITE.name}</h1>
		<p class="opacity-70 mt-2">Berita & jadwal motorsport: F1, MotoGP, WEC, Formula E.</p>
	</section>

	<AdSlot slot={publicEnv.PUBLIC_ADSENSE_SLOT_INARTICLE ?? ''} format="auto" minHeight={90} />

	<PostGrid posts={items} />

	<Pagination page={currentPage} {totalPages} buildHref={pageHref} />
</div>
