<script lang="ts">
	type Props = {
		page: number;
		totalPages: number;
		buildHref: (page: number) => string;
	};
	let { page, totalPages, buildHref }: Props = $props();

	const pages = $derived.by(() => {
		if (totalPages <= 1) return [] as (number | '…')[];
		const window = 1;
		const set = new Set<number>([1, totalPages, page]);
		for (let i = page - window; i <= page + window; i++) {
			if (i > 1 && i < totalPages) set.add(i);
		}
		const sorted = Array.from(set).sort((a, b) => a - b);
		const out: (number | '…')[] = [];
		let prev = 0;
		for (const n of sorted) {
			if (prev && n - prev > 1) out.push('…');
			out.push(n);
			prev = n;
		}
		return out;
	});
</script>

{#if totalPages > 1}
	<nav aria-label="Halaman" class="flex justify-center pt-4">
		<ul class="flex flex-wrap items-center gap-1 text-sm">
			<li>
				{#if page > 1}
					<a
						href={buildHref(page - 1)}
						rel="prev"
						aria-label="Halaman sebelumnya"
						class="inline-flex h-9 min-w-9 items-center justify-center rounded-md border-[1px] border-surface-200-800 bg-surface-100-900 px-3 hover:bg-surface-200-800"
					>
						<i class="fa-solid fa-chevron-left"></i>
					</a>
				{:else}
					<span
						aria-disabled="true"
						class="inline-flex h-9 min-w-9 items-center justify-center rounded-md border-[1px] border-surface-200-800 px-3 opacity-40"
					>
						<i class="fa-solid fa-chevron-left"></i>
					</span>
				{/if}
			</li>
			{#each pages as item, i (i)}
				<li>
					{#if item === '…'}
						<span class="px-2 opacity-60"><i class="fa-solid fa-ellipsis"></i></span>
					{:else if item === page}
						<span
							aria-current="page"
							class="inline-flex h-9 min-w-9 items-center justify-center rounded-md bg-primary-500 px-3 font-semibold text-white"
						>
							{item}
						</span>
					{:else}
						<a
							href={buildHref(item)}
							class="inline-flex h-9 min-w-9 items-center justify-center rounded-md border-[1px] border-surface-200-800 bg-surface-100-900 px-3 hover:bg-surface-200-800"
						>
							{item}
						</a>
					{/if}
				</li>
			{/each}
			<li>
				{#if page < totalPages}
					<a
						href={buildHref(page + 1)}
						rel="next"
						aria-label="Halaman berikutnya"
						class="inline-flex h-9 min-w-9 items-center justify-center rounded-md border-[1px] border-surface-200-800 bg-surface-100-900 px-3 hover:bg-surface-200-800"
					>
						<i class="fa-solid fa-chevron-right"></i>
					</a>
				{:else}
					<span
						aria-disabled="true"
						class="inline-flex h-9 min-w-9 items-center justify-center rounded-md border-[1px] border-surface-200-800 px-3 opacity-40"
					>
						<i class="fa-solid fa-chevron-right"></i>
					</span>
				{/if}
			</li>
		</ul>
	</nav>
{/if}
