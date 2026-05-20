<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import Seo from '$lib/components/Seo.svelte';
	import { resolveSeo } from '$lib/seo';

	let { children } = $props();

	const seo = $derived(resolveSeo({}, page.url.pathname));
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<Seo {seo} />
{@render children()}
