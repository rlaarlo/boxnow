<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import Seo from '$lib/components/Seo.svelte';
	import AdSlot from '$lib/components/AdSlot.svelte';
	import PostGrid from '$lib/components/PostGrid.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import Flag from '$lib/components/Flag.svelte';
	import { env as publicEnv } from '$env/dynamic/public';
	import { resolveSeo, websiteJsonLd, breadcrumbJsonLd } from '$lib/seo';
	import { absoluteUrl } from '$lib/site';
	import { getPostThumbnailUrl } from '$lib/services/public';
	import { eventStatus } from '$lib/services/events';
	import { SERIES_LIST, type Series } from '$lib/services/series';
	import type { EventRecord, EventCategory } from '$lib/types';

	let { data } = $props();
	const items = $derived(data.items);
	const currentPage = $derived(data.page);
	const totalPages = $derived(data.totalPages);
	const upcomingEvents = $derived((data.upcomingEvents ?? []) as EventRecord[]);
	const isFirstPage = $derived(currentPage === 1);

	const leadPost = $derived(items[0]);
	const secondaryPosts = $derived(items.slice(1, 5));
	const restPosts = $derived(items.slice(5));
	const isLeadPinned = $derived(!!leadPost?.pinned);
	const leadThumb = $derived(leadPost ? getPostThumbnailUrl(leadPost) : null);

	function pageHref(n: number) {
		return n <= 1 ? '/' : `/?page=${n}`;
	}

	const SERIES_BY_CATEGORY: Partial<Record<EventCategory, Series>> = {
		f1: 'f1',
		motogp: 'motogp',
		wsbk: 'wsbk',
		wec: 'wec',
		formulae: 'formulae',
		dtm: 'dtm',
		gt: 'gt'
	};

	function seriesLabel(cat: EventCategory): string {
		const id = SERIES_BY_CATEGORY[cat];
		if (!id) return cat.toUpperCase();
		return SERIES_LIST.find((s) => s.id === id)?.short ?? cat.toUpperCase();
	}

	function sessionLabel(s: EventRecord['session']): string {
		switch (s) {
			case 'practice': return 'Practice';
			case 'qualifying': return 'Qualifying';
			case 'sprint': return 'Sprint';
			case 'race': return 'Race';
			default: return 'Sesi';
		}
	}

	let mounted = $state(false);
	onMount(() => { mounted = true; });

	// Sebelum hydration: fallback WIB (audiens Indonesia). Setelah hydration: timezone client.
	const tzOption = $derived(mounted ? undefined : 'Asia/Jakarta');
	const tzLabel = $derived(
		mounted
			? new Intl.DateTimeFormat('id-ID', { timeZoneName: 'short' })
					.formatToParts(new Date())
					.find((p) => p.type === 'timeZoneName')?.value ?? ''
			: 'WIB'
	);

	function fmtDay(iso: string, tz?: string): string {
		return new Date(iso).toLocaleDateString('id-ID', {
			weekday: 'short', day: 'numeric', month: 'short', timeZone: tz
		});
	}

	function fmtTime(iso: string, tz?: string): string {
		return new Date(iso).toLocaleTimeString('id-ID', {
			hour: '2-digit', minute: '2-digit', timeZone: tz
		});
	}

	type Status = ReturnType<typeof eventStatus>;
	function statusBadge(s: Status): { label: string; cls: string } {
		if (s === 'live') return { label: 'Live', cls: 'preset-filled-error-500' };
		if (s === 'soon') return { label: 'Segera', cls: 'preset-filled-warning-500' };
		if (s === 'ended') return { label: 'Selesai', cls: 'preset-tonal-surface' };
		return { label: 'Akan datang', cls: 'preset-tonal-primary' };
	}

	const seo = $derived(
		resolveSeo(
			{
				title: currentPage > 1 ? `Berita Motorsport — Halaman ${currentPage}` : undefined,
				description:
					'Berita, analisis, dan jadwal motorsport: Formula 1, MotoGP, WSBK, WEC, Formula E. Update terbaru dari DRSMODE.NET.',
				type: 'website',
				canonical: pageHref(currentPage),
				prev: currentPage > 1 ? pageHref(currentPage - 1) : undefined,
				next: currentPage < totalPages ? pageHref(currentPage + 1) : undefined
			},
			page.url.pathname
		)
	);

	const jsonLd = $derived([
		websiteJsonLd(),
		breadcrumbJsonLd([{ name: 'Beranda', url: absoluteUrl('/') }])
	]);
</script>

<Seo {seo} {jsonLd} />

<div class="space-y-8">
	{#if isFirstPage}
		<section class="space-y-4 pt-2 sm:pt-4">
			<div class="space-y-2">
				<p class="text-xs font-semibold uppercase tracking-wide text-prim-500 opacity-70">DRSMODE.NET</p>
				<h1 class="h1 leading-tight">Berita Motorsport Terbaru</h1>
				<p class="max-w-2xl text-sm leading-6 opacity-75 sm:text-base">
					Berita, analisis, dan jadwal race weekend dari Formula 1, MotoGP, WSBK, WEC, Formula E, DTM, dan GT World Challenge.
				</p>
			</div>

			<form
				action="/search"
				method="get"
				role="search"
				class="flex w-full max-w-xl items-center gap-2"
			>
				<label class="sr-only" for="home-search">Cari berita motorsport</label>
				<input
					id="home-search"
					type="search"
					name="q"
					placeholder="Cari berita F1, MotoGP, WEC..."
					autocomplete="off"
					class="input flex-1"
				/>
				<button type="submit" class="btn preset-filled-primary-500" aria-label="Cari">
					<i class="fa-solid fa-magnifying-glass"></i>
					<span class="hidden sm:inline ml-1">Cari</span>
				</button>
			</form>

			<nav aria-label="Seri motorsport" class="-mx-1 flex flex-wrap gap-2 px-1">
				<a
					href="/jadwal"
					class="inline-flex items-center gap-2 rounded-full border-[1px] border-surface-200-800 bg-surface-100-900 px-3 py-1.5 text-sm hover:border-primary-500"
				>
					<i class="fa-solid fa-calendar-days opacity-70"></i>
					<span class="font-semibold">Semua Jadwal</span>
				</a>
				{#each SERIES_LIST as s (s.id)}
					<a
						href="/jadwal/{s.id}"
						class="inline-flex items-center gap-2 rounded-full border-[1px] border-surface-200-800 bg-surface-100-900 px-3 py-1.5 text-sm hover:border-primary-500 hover:bg-surface-200-800"
					>
						<i class="fa-solid {s.icon} opacity-70"></i>
						<span class="font-semibold">{s.short}</span>
					</a>
				{/each}
				<a
					href="/kategori"
					class="inline-flex items-center gap-2 rounded-full border-[1px] border-surface-200-800 bg-surface-100-900 px-3 py-1.5 text-sm hover:border-primary-500"
				>
					<i class="fa-solid fa-tags opacity-70"></i>
					<span class="font-semibold">Kategori</span>
				</a>
			</nav>
		</section>

		{#if upcomingEvents.length > 0}
			<section class="overflow-hidden rounded-lg border-[1px] border-surface-200-800 bg-surface-100-900">
				<header class="flex items-center justify-between gap-3 border-b-[1px] border-surface-200-800 px-4 py-3 sm:px-5">
					<div class="flex items-center gap-3 min-w-0">
						<span class="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary-500/10 text-primary-500" aria-hidden="true">
							<i class="fa-solid fa-flag-checkered"></i>
						</span>
						<div class="min-w-0">
							<h2 class="h5 leading-tight">Jadwal Terdekat</h2>
							<p class="text-xs opacity-60 mt-0.5">
								Sesi balap berikutnya
								{#if tzLabel}
									· waktu lokal ({tzLabel})
								{/if}
							</p>
						</div>
					</div>
					<a href="/jadwal" class="anchor text-sm whitespace-nowrap shrink-0">
						Lihat semua <i class="fa-solid fa-arrow-right ml-0.5 text-xs"></i>
					</a>
				</header>
				<ul class="divide-y divide-surface-200-800">
					{#each upcomingEvents as ev (ev.id)}
						{@const st = eventStatus(ev)}
						{@const badge = statusBadge(st)}
						<li>
							<a
								href="/jadwal/{SERIES_BY_CATEGORY[ev.category] ?? ''}"
								class="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-3 transition-colors hover:bg-surface-200-800/40 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:gap-x-4 sm:px-5"
							>
								<span class="inline-flex items-center gap-2">
									{#if ev.flag}
										<Flag code={ev.flag} size="sm" />
									{:else}
										<span class="inline-block h-[15px] w-5 rounded-sm bg-surface-200-800" aria-hidden="true"></span>
									{/if}
									<span class="badge preset-tonal w-14 justify-center text-center text-[11px] font-bold uppercase tracking-wide">{seriesLabel(ev.category)}</span>
								</span>
								<span class="min-w-0">
									<span class="block truncate text-sm font-semibold leading-snug sm:text-[15px]">{ev.title}</span>
									<span class="block truncate text-xs opacity-60">
										{sessionLabel(ev.session)}{#if ev.circuit} · {ev.circuit}{/if}
									</span>
								</span>
								<span class="col-start-2 row-start-2 text-xs tabular-nums opacity-70 sm:col-start-3 sm:row-start-1 sm:text-right sm:text-sm sm:opacity-100">
									<span class="opacity-70">{fmtDay(ev.starts_at, tzOption)}</span>
									<span class="ml-1 font-semibold tabular-nums">{fmtTime(ev.starts_at, tzOption)}</span>
								</span>
								<span class="col-start-3 row-start-1 justify-self-end sm:col-start-4">
									<span class="badge {badge.cls} w-20 justify-center text-center text-[11px] font-semibold uppercase tracking-wide">{badge.label}</span>
								</span>
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	{/if}

	<AdSlot slot={publicEnv.PUBLIC_ADSENSE_SLOT_INARTICLE ?? ''} format="auto" minHeight={90} />

	{#if items.length === 0}
		<div class="text-center py-12 opacity-60">Belum ada artikel.</div>
	{:else if isFirstPage}
		<section class="space-y-5">
			<header class="flex items-end justify-between gap-3">
				<h2 class="h4 leading-tight flex items-center gap-2">
					{#if isLeadPinned}
						<i class="fa-solid fa-thumbtack text-primary-500" aria-hidden="true"></i>
						Pinned Post
					{:else}
						Berita Terbaru
					{/if}
				</h2>
			</header>

			{#if leadPost}
				<a
					href="/blog/{leadPost.slug}"
					class="group grid gap-0 overflow-hidden rounded-lg border-[1px] border-surface-200-800 bg-surface-100-900 transition hover:border-primary-500 sm:grid-cols-[1.4fr_1fr] sm:max-h-[260px]"
				>
					<div class="aspect-video sm:aspect-auto sm:h-full bg-surface-200-800 overflow-hidden">
						{#if leadThumb}
							<img
								src={leadThumb}
								alt={leadPost.title}
								class="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
								loading="eager"
								fetchpriority="high"
							/>
						{:else}
							<div class="grid h-full w-full place-items-center text-4xl opacity-20" aria-hidden="true">📰</div>
						{/if}
					</div>
					<div class="flex flex-col gap-2 p-4 sm:p-5">
						<div class="flex flex-wrap items-center gap-2 text-xs opacity-70">
							{#if leadPost.category}
								<span class="badge preset-filled-primary-500 text-xs">{leadPost.category}</span>
							{/if}
							<time datetime={leadPost.created}>
								{new Date(leadPost.created).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
							</time>
						</div>
						<h3 class="h5 leading-snug line-clamp-2 group-hover:text-primary-500">{leadPost.title}</h3>
						{#if leadPost.excerpt}
							<p class="text-sm opacity-75 line-clamp-3">{leadPost.excerpt}</p>
						{/if}
						<span class="text-xs font-medium text-primary-500 mt-auto pt-1">
							Baca selengkapnya <i class="fa-solid fa-arrow-right"></i>
						</span>
					</div>
				</a>
			{/if}

			{#if secondaryPosts.length > 0}
				<ul class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					{#each secondaryPosts as p (p.id)}
						{@const t = getPostThumbnailUrl(p)}
						<li>
							<a
								href="/blog/{p.slug}"
								class="group flex gap-3 rounded-lg border-[1px] border-surface-200-800 bg-surface-100-900 p-2 transition hover:border-primary-500"
							>
								<div class="h-20 w-28 sm:h-24 sm:w-32 shrink-0 overflow-hidden rounded bg-surface-200-800">
									{#if t}
										<img src={t} alt={p.title} class="h-full w-full object-cover" loading="lazy" />
									{:else}
										<div class="grid h-full w-full place-items-center text-2xl opacity-20" aria-hidden="true">📰</div>
									{/if}
								</div>
								<div class="flex min-w-0 flex-col gap-1 py-1 pr-1">
									{#if p.category}
										<span class="text-[10px] uppercase tracking-wide opacity-60">{p.category}</span>
									{/if}
									<h3 class="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary-500 sm:text-base">{p.title}</h3>
									<time class="text-xs opacity-60 mt-auto" datetime={p.created}>
										{new Date(p.created).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
									</time>
								</div>
							</a>
						</li>
					{/each}
				</ul>
			{/if}

			{#if restPosts.length > 0}
				<div class="space-y-3">
					<h3 class="h5 opacity-80">Lainnya</h3>
					<PostGrid posts={restPosts} />
				</div>
			{/if}
		</section>
	{:else}
		<PostGrid posts={items} />
	{/if}

	<Pagination page={currentPage} {totalPages} buildHref={pageHref} />
</div>

