<script lang="ts">
	import { onMount } from 'svelte';
	import { env } from '$env/dynamic/public';

	type Props = {
		slot: string;
		format?: 'auto' | 'fluid' | 'rectangle';
		layout?: string;
		responsive?: boolean;
		minHeight?: number;
		class?: string;
	};

	let {
		slot,
		format = 'auto',
		layout = '',
		responsive = true,
		minHeight = 100,
		class: cls = ''
	}: Props = $props();

	const client = env.PUBLIC_ADSENSE_CLIENT ?? '';
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
		if (!client || !slot) return;
		try {
			// @ts-expect-error - adsbygoogle injected by external script
			(window.adsbygoogle = window.adsbygoogle || []).push({});
		} catch (err) {
			console.warn('[AdSlot] push failed:', err);
		}
	});
</script>

{#if client && slot}
	<div class="ad-slot {cls}" style:min-height="{minHeight}px">
		{#if mounted}
			<ins
				class="adsbygoogle"
				style="display:block"
				data-ad-client={client}
				data-ad-slot={slot}
				data-ad-format={format}
				data-ad-layout={layout || undefined}
				data-full-width-responsive={responsive ? 'true' : 'false'}
			></ins>
		{/if}
	</div>
{:else}
	<div
		class="ad-slot ad-placeholder {cls}"
		style:min-height="{minHeight}px"
		title="AdSense belum dikonfigurasi (PUBLIC_ADSENSE_CLIENT)"
	>
		<span class="text-xs opacity-40">Ad Space</span>
	</div>
{/if}

<style>
	.ad-slot {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}
	.ad-placeholder {
		border: 1px dashed rgb(255 255 255 / 0.1);
		border-radius: 0.5rem;
		background: rgb(255 255 255 / 0.02);
	}
</style>
