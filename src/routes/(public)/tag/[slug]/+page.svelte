<script lang="ts">
	import { page } from '$app/state';
	import Seo from '$lib/components/Seo.svelte';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import PostGrid from '$lib/components/PostGrid.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import { resolveSeo, breadcrumbJsonLd } from '$lib/seo';
	import { absoluteUrl } from '$lib/site';

	let { data } = $props();
	const facet = $derived(data.facet);
	const items = $derived(data.items);
	const currentPage = $derived(data.page);
	const totalPages = $derived(data.totalPages);

	function pageHref(n: number) {
		const base = `/tag/${facet.slug}`;
		return n <= 1 ? base : `${base}?page=${n}`;
	}

	const seo = $derived(
		resolveSeo(
			{
				title:
					currentPage > 1
						? `Tag: ${facet.value} (halaman ${currentPage})`
						: `Tag: ${facet.value}`,
				description: `Artikel motorsport dengan tag ${facet.value}.`,
				canonical: pageHref(currentPage),
				prev: currentPage > 1 ? pageHref(currentPage - 1) : undefined,
				next: currentPage < totalPages ? pageHref(currentPage + 1) : undefined
			},
			page.url.pathname
		)
	);

	const jsonLd = $derived([
		breadcrumbJsonLd([
			{ name: 'Beranda', url: absoluteUrl('/') },
			{ name: 'Tag', url: absoluteUrl('/tag') },
			{ name: facet.value, url: absoluteUrl(`/tag/${facet.slug}`) }
		])
	]);
</script>

<Seo {seo} {jsonLd} />

<div class="space-y-6">
	<Breadcrumb
		items={[
			{ name: 'Beranda', href: '/' },
			{ name: 'Tag', href: '/tag' },
			{ name: `#${facet.value}` }
		]}
	/>
	<header class="space-y-2">
		<p class="text-xs font-semibold uppercase opacity-60">Tag</p>
		<h1 class="h1">#{facet.value}</h1>
		<p class="opacity-70 text-sm">{data.totalItems} artikel</p>
	</header>

	<PostGrid posts={items} emptyText="Belum ada artikel dengan tag ini." />

	<Pagination page={currentPage} {totalPages} buildHref={pageHref} />
</div>
