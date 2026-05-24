<script lang="ts">
	import { page } from '$app/state';
	import Seo from '$lib/components/Seo.svelte';
	import { resolveSeo } from '$lib/seo';

	let { data } = $props();

	const seo = $derived(
		resolveSeo(
			{
				title: 'DMCA & Hak Cipta',
				description:
					'Kebijakan DMCA DRSMODE.NET. Situs ini tidak meng-host konten video atau siaran motorsport. Panduan pelaporan pelanggaran hak cipta.'
			},
			page.url.pathname
		)
	);
</script>

<Seo {seo} />

<article class="max-w-3xl mx-auto py-6 prose dark:prose-invert">
	{#if data.content}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html data.content}
	{:else}
		<h1>DMCA & Hak Cipta</h1>
		<p class="opacity-60">Konten halaman belum tersedia.</p>
	{/if}
</article>
