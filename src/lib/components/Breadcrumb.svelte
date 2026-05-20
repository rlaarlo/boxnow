<script module lang="ts">
	export type BreadcrumbItem = { name: string; href?: string };
</script>

<script lang="ts">
	type Props = { items: BreadcrumbItem[]; class?: string };
	let { items, class: klass = '' }: Props = $props();
</script>

<nav aria-label="Breadcrumb" class={klass}>
	<ol
		class="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs sm:text-sm opacity-80"
	>
		{#each items as item, i (i)}
			{@const last = i === items.length - 1}
			<li class="flex min-w-0 items-center gap-x-1.5">
				{#if last || !item.href}
					<span
						class="truncate max-w-[60vw] sm:max-w-none"
						aria-current={last ? 'page' : undefined}
					>
						{item.name}
					</span>
				{:else}
					<a
						href={item.href}
						class="anchor truncate max-w-[40vw] sm:max-w-none"
					>
						{item.name}
					</a>
				{/if}
				{#if !last}
					<span aria-hidden="true" class="opacity-50">/</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>
