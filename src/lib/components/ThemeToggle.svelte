<script lang="ts">
	import { onMount } from 'svelte';

	let { compact = false }: { compact?: boolean } = $props();

	let mode = $state<'light' | 'dark'>('dark');

	onMount(() => {
		mode = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
	});

	function toggle() {
		mode = mode === 'dark' ? 'light' : 'dark';
		const root = document.documentElement;
		root.classList.toggle('dark', mode === 'dark');
		root.setAttribute('data-mode', mode);
		try {
			localStorage.setItem('theme', mode);
		} catch {
			// ignore
		}
	}
</script>

<button
	type="button"
	class="btn btn-sm preset-tonal"
	onclick={toggle}
	aria-label={mode === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
	title={mode === 'dark' ? 'Mode terang' : 'Mode gelap'}
>
	<i class="fa-solid {mode === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>
	{#if !compact}
		<span class="hidden sm:inline ml-1">{mode === 'dark' ? 'Terang' : 'Gelap'}</span>
	{/if}
</button>
