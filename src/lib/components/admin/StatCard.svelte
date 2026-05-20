<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		label: string;
		value: number | string;
		hint?: string;
		icon?: Snippet;
		accent?: 'primary' | 'success' | 'warning' | 'error';
	};

	let { label, value, hint, icon, accent = 'primary' }: Props = $props();

	const accentClass: Record<NonNullable<Props['accent']>, string> = {
		primary: 'preset-tonal-primary',
		success: 'preset-tonal-success',
		warning: 'preset-tonal-warning',
		error: 'preset-tonal-error'
	};
</script>

<div class="card preset-filled-surface-100-900 border-surface-200-800 border-[1px] p-4 space-y-3">
	<div class="flex items-center justify-between">
		<span class="text-sm opacity-70">{label}</span>
		{#if icon}
			<span class="badge {accentClass[accent]} aspect-square w-9 h-9 grid place-items-center">
				{@render icon()}
			</span>
		{/if}
	</div>
	<div class="text-3xl font-bold">{value}</div>
	{#if hint}
		<div class="text-xs opacity-60">{hint}</div>
	{/if}
</div>
