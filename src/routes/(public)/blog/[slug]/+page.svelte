<script lang="ts">
	import { page } from '$app/state';
	import Seo from '$lib/components/Seo.svelte';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import AdSlot from '$lib/components/AdSlot.svelte';
	import PostCard from '$lib/components/PostCard.svelte';
	import { env as publicEnv } from '$env/dynamic/public';
	import { getPostThumbnailUrl, postTags } from '$lib/services/public';
	import { resolveSeo, articleJsonLd, breadcrumbJsonLd } from '$lib/seo';
	import { absoluteUrl } from '$lib/site';
	import { slugify } from '$lib/services/admin';

	let { data } = $props();
	const post = $derived(data.post);
	const related = $derived(data.related ?? []);
	const thumb = $derived(getPostThumbnailUrl(post));
	const categorySlug = $derived(post.category ? slugify(post.category) : '');
	const tags = $derived(postTags(post));

	function addHeadingIds(html: string | undefined | null): string {
		if (!html) return '';
		const targets = new Set<string>();
		const re = /href=["']#([^"'#\s]+)["']/gi;
		let m: RegExpExecArray | null;
		while ((m = re.exec(html))) targets.add(m[1].toLowerCase());

		return html.replace(/<(h[2-4])([^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag, attrs: string, inner: string) => {
			if (/\sid\s*=/i.test(attrs)) return match;
			const text = inner.replace(/<[^>]+>/g, '').trim();
			if (!text) return match;
			const slug = slugify(text);
			let id = slug;
			for (const t of targets) {
				if (slug === t || slug.startsWith(t + '-') || slug.includes('-' + t + '-') || slug.endsWith('-' + t)) {
					id = t;
					targets.delete(t);
					break;
				}
			}
			return `<${tag}${attrs} id="${id}">${inner}</${tag}>`;
		});
	}
	const processedContent = $derived(addHeadingIds(post.content));

	const seo = $derived(
		resolveSeo(
			{
				title: post.title,
				description: post.excerpt || post.title,
				type: 'article',
				image: thumb ?? undefined,
				publishedTime: post.created,
				modifiedTime: post.updated
			},
			page.url.pathname
		)
	);

	const jsonLd = $derived([
		articleJsonLd({
			url: seo.canonical,
			headline: post.title,
			description: post.excerpt || post.title,
			image: thumb ?? undefined,
			datePublished: post.created,
			dateModified: post.updated
		}),
		breadcrumbJsonLd([
			{ name: 'Beranda', url: absoluteUrl('/') },
			...(post.category
				? [{ name: post.category, url: absoluteUrl(`/kategori/${categorySlug}`) }]
				: []),
			{ name: post.title, url: seo.canonical }
		])
	]);
</script>

<Seo {seo} {jsonLd} />

<article class="max-w-3xl mx-auto space-y-6">
	<Breadcrumb
		items={[
			{ name: 'Beranda', href: '/' },
			...(post.category
				? [{ name: post.category, href: `/kategori/${categorySlug}` }]
				: []),
			{ name: post.title }
		]}
	/>
	<header class="space-y-3">
		<h1 class="text-2xl md:text-3xl font-bold leading-tight">{post.title}</h1>
		<div class="flex flex-wrap items-center gap-2 text-sm opacity-70">
			{#if post.category}
				<a href="/kategori/{categorySlug}" class="badge preset-tonal hover:preset-filled-primary-500">
					{post.category}
				</a>
			{/if}
			<time datetime={post.created}>
				{new Date(post.created).toLocaleDateString('id-ID', {
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				})}
			</time>
		</div>
	</header>

	{#if thumb}
		<img src={thumb} alt={post.title} class="rounded-lg w-full aspect-video object-cover" />
	{/if}

	<AdSlot slot={publicEnv.PUBLIC_ADSENSE_SLOT_INARTICLE ?? ''} format="auto" minHeight={120} />

	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	<div class="prose dark:prose-invert max-w-none">
		{@html processedContent}
	</div>

	<AdSlot slot={publicEnv.PUBLIC_ADSENSE_SLOT_INARTICLE ?? ''} format="auto" minHeight={120} />

	{#if tags.length}
		<footer class="flex flex-wrap gap-2 pt-6 border-t-[1px] border-surface-200-800">
			{#each tags as tag (tag)}
				<a href="/tag/{slugify(tag)}" class="badge preset-tonal-surface hover:preset-filled-primary-500">
					#{tag}
				</a>
			{/each}
		</footer>
	{/if}
</article>

{#if related.length}
	<section class="max-w-5xl mx-auto mt-12 space-y-4">
		<header class="flex items-end justify-between gap-3">
			<h2 class="h4">Artikel terkait</h2>
			{#if post.category}
				<a href="/kategori/{categorySlug}" class="anchor text-sm">
					Lihat semua di {post.category} <i class="fa-solid fa-arrow-right"></i>
				</a>
			{/if}
		</header>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			{#each related as r (r.id)}
				<PostCard post={r} />
			{/each}
		</div>
	</section>
{/if}
