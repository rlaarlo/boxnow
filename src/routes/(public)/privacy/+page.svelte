<script lang="ts">
	import { page } from '$app/state';
	import Seo from '$lib/components/Seo.svelte';
	import { resolveSeo } from '$lib/seo';

	let { data } = $props();

	const seo = $derived(
		resolveSeo(
			{
				title: 'Kebijakan Privasi',
				description:
					'Kebijakan privasi DRSMODE.NET mengenai pengumpulan data, cookie, konten pihak ketiga, dan hak pengguna.'
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
		<h1>Kebijakan Privasi</h1>
		<p class="opacity-60">Konten halaman belum tersedia.</p>
	{/if}
</article>
