<script lang="ts">
	import SiteShell from '$lib/components/SiteShell.svelte';
	let { children } = $props();
</script>

<SiteShell>
	{@render children()}
</SiteShell>
