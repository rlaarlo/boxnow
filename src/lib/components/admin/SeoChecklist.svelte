<script lang="ts">
	type ChecklistInput = {
		title: string;
		slug: string;
		content: string;
		excerpt: string;
		category: string;
		tags: string;
		hasThumbnail: boolean;
	};

	type Props = { input: ChecklistInput };
	let { input }: Props = $props();

	type Check = { id: string; ok: boolean; warn?: boolean; label: string; hint?: string };

	const items = $derived.by<Check[]>(() => {
		const text = stripHtml(input.content);
		const wordCount = text.split(/\s+/).filter(Boolean).length;
		const headingMatches = (input.content.match(/<h[2-4]\b/gi) ?? []).length;
		const internalLinks = (input.content.match(/href=("|')\/(?!\/)/gi) ?? []).length;
		const slugOk = /^[a-z0-9-]+$/.test(input.slug) && input.slug.length >= 3 && input.slug.length <= 80;
		const tagCount = input.tags
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean).length;

		return [
			{
				id: 'title',
				ok: input.title.length >= 30 && input.title.length <= 65,
				warn: input.title.length > 0 && (input.title.length < 30 || input.title.length > 65),
				label: `Judul ${input.title.length}/30–65 karakter`,
				hint: 'Judul ideal 30–65 karakter agar tidak terpotong di hasil pencarian.'
			},
			{
				id: 'slug',
				ok: slugOk,
				label: 'Slug valid (huruf kecil, angka, tanda hubung)',
				hint: 'Slug pendek dan deskriptif memudahkan dibaca user & mesin pencari.'
			},
			{
				id: 'excerpt',
				ok: input.excerpt.length >= 80 && input.excerpt.length <= 160,
				warn:
					input.excerpt.length > 0 &&
					(input.excerpt.length < 80 || input.excerpt.length > 160),
				label: `Excerpt / meta description ${input.excerpt.length}/80–160`,
				hint: 'Dipakai sebagai meta description di Google & Open Graph.'
			},
			{
				id: 'thumbnail',
				ok: input.hasThumbnail,
				label: 'Thumbnail terisi (untuk OG image & card)',
				hint: 'Tanpa thumbnail, share di sosmed akan kelihatan polos.'
			},
			{
				id: 'category',
				ok: input.category.trim().length > 0,
				label: 'Kategori dipilih'
			},
			{
				id: 'tags',
				ok: tagCount >= 2,
				warn: tagCount === 1,
				label: `Tag ${tagCount} (≥ 2 disarankan)`
			},
			{
				id: 'length',
				ok: wordCount >= 300,
				warn: wordCount > 0 && wordCount < 300,
				label: `Panjang konten ${wordCount} kata (min 300)`
			},
			{
				id: 'headings',
				ok: headingMatches >= 1,
				label: `Heading H2/H3 ditemukan (${headingMatches})`,
				hint: 'Pakai sub-heading agar artikel mudah dipindai.'
			},
			{
				id: 'links',
				ok: internalLinks >= 1,
				label: `Internal link ke halaman lain (${internalLinks})`,
				hint: 'Tautkan ke artikel atau halaman DRSMODE.NET lain.'
			}
		];
	});

	const pass = $derived(items.filter((i) => i.ok).length);
	const total = $derived(items.length);
	const score = $derived(Math.round((pass / total) * 100));

	function stripHtml(html: string): string {
		return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
	}
</script>

<section class="card preset-tonal-surface p-4 space-y-3">
	<header class="flex items-center justify-between gap-3">
		<div>
			<h4 class="text-sm font-semibold">Checklist SEO</h4>
			<p class="text-xs opacity-70">Skor {pass}/{total} ({score}%)</p>
		</div>
		<div
			class="inline-flex h-9 min-w-12 items-center justify-center rounded-full px-3 text-sm font-bold {score >=
			80
				? 'preset-filled-success-500'
				: score >= 50
					? 'preset-filled-warning-500'
					: 'preset-filled-error-500'}"
		>
			{score}
		</div>
	</header>
	<ul class="space-y-1.5 text-sm">
		{#each items as item (item.id)}
			<li class="flex items-start gap-2">
				<span
					aria-hidden="true"
					class="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs {item.ok
						? 'bg-success-500 text-white'
						: item.warn
							? 'bg-warning-500 text-white'
							: 'bg-surface-300-700 opacity-70'}"
				>
					{#if item.ok}
						<i class="fa-solid fa-check"></i>
					{:else if item.warn}
						<i class="fa-solid fa-exclamation"></i>
					{:else}
						<i class="fa-solid fa-circle text-[0.4em]"></i>
					{/if}
				</span>
				<div class="min-w-0">
					<div>{item.label}</div>
					{#if item.hint && !item.ok}
						<div class="text-xs opacity-60">{item.hint}</div>
					{/if}
				</div>
			</li>
		{/each}
	</ul>
</section>
