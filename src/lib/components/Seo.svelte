<script lang="ts">
	import type { ResolvedSeo } from '$lib/seo';
	import { SITE } from '$lib/site';

	type Props = { seo: ResolvedSeo; jsonLd?: object | object[] };
	let { seo, jsonLd }: Props = $props();

	const ldArray = $derived(jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []);
</script>

<svelte:head>
	<title>{seo.title}</title>
	<meta name="description" content={seo.description} />
	<link rel="canonical" href={seo.canonical} />
	{#if seo.prev}
		<link rel="prev" href={seo.prev} />
	{/if}
	{#if seo.next}
		<link rel="next" href={seo.next} />
	{/if}
	{#if seo.noindex}
		<meta name="robots" content="noindex,nofollow" />
	{:else}
		<meta name="robots" content="index,follow" />
	{/if}

	<!-- Open Graph -->
	<meta property="og:site_name" content={SITE.name} />
	<meta property="og:locale" content={SITE.locale} />
	<meta property="og:type" content={seo.type} />
	<meta property="og:title" content={seo.title} />
	<meta property="og:description" content={seo.description} />
	<meta property="og:url" content={seo.canonical} />
	<meta property="og:image" content={seo.image} />
	{#if seo.publishedTime}
		<meta property="article:published_time" content={seo.publishedTime} />
	{/if}
	{#if seo.modifiedTime}
		<meta property="article:modified_time" content={seo.modifiedTime} />
	{/if}

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={seo.title} />
	<meta name="twitter:description" content={seo.description} />
	<meta name="twitter:image" content={seo.image} />
	{#if SITE.twitterHandle}
		<meta name="twitter:site" content={SITE.twitterHandle} />
	{/if}

	{#each ldArray as ld, i (i)}
		{@html `<script type="application/ld+json">${JSON.stringify(ld)}</` + `script>`}
	{/each}
</svelte:head>
