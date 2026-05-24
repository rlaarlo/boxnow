<script lang="ts">
	import { page } from '$app/state';
	import Seo from '$lib/components/Seo.svelte';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import { resolveSeo, breadcrumbJsonLd } from '$lib/seo';
	import { absoluteUrl } from '$lib/site';
	import { SERIES_LIST, type Series } from '$lib/services/series';
	import f1Logo from '$lib/assets/F1.svg';
	import feLogo from '$lib/assets/Formula-E.svg';
	import motogpLight from '$lib/assets/motogp-light.svg';
	import motogpDark from '$lib/assets/motogp-dark.svg';
	import wsbkLight from '$lib/assets/WorldSBK_light.svg';
	import wsbkDark from '$lib/assets/WorldSBK_dark.svg';
	import wecLight from '$lib/assets/WEC_light.svg';
	import wecDark from '$lib/assets/WEC_dark.svg';
	import dtmLogo from '$lib/assets/DTM.svg';
	import gtLight from '$lib/assets/gt-light.svg';
	import gtDark from '$lib/assets/gt-dark.svg';

	const seriesLogos: Partial<Record<Series, { light: string; dark: string; class?: string }>> = {
		f1: { light: f1Logo, dark: f1Logo, class: 'h-5 w-auto' },
		formulae: { light: feLogo, dark: feLogo, class: 'h-9 w-auto' },
		motogp: { light: motogpLight, dark: motogpDark, class: 'h-5 w-auto' },
		wsbk: { light: wsbkLight, dark: wsbkDark, class: 'h-5 w-auto' },
		wec: { light: wecLight, dark: wecDark, class: 'h-5 w-auto' },
		dtm: { light: dtmLogo, dark: dtmLogo, class: 'h-5 w-auto' },
		gt: { light: gtLight, dark: gtDark, class: 'h-5 w-auto' }
	};

	const year = new Date().getFullYear();

	const seo = $derived(
		resolveSeo(
			{
				title: `Jadwal Motorsport ${year} — F1, MotoGP, WSBK, WEC, Formula E`,
				description: `Pilih kategori motorsport favoritmu: jadwal lengkap Formula 1, MotoGP, WSBK, WEC, dan Formula E ${year} dengan countdown real-time dalam waktu lokal Indonesia (WIB).`,
				type: 'website'
			},
			page.url.pathname
		)
	);

	const jsonLd = $derived([
		breadcrumbJsonLd([
			{ name: 'Beranda', url: absoluteUrl('/') },
			{ name: `Jadwal Motorsport ${year}`, url: seo.canonical }
		])
	]);
</script>

<Seo {seo} {jsonLd} />

<div class="mx-auto max-w-6xl space-y-8">
	<Breadcrumb
		items={[
			{ name: 'Beranda', href: '/' },
			{ name: `Jadwal Motorsport ${year}` }
		]}
	/>
	<header class="space-y-3 py-2 sm:py-5">
		<div class="space-y-2">
			<p class="text-xs font-semibold uppercase opacity-60">Kalender {year}</p>
			<h1 class="h1 leading-tight">Jadwal Motorsport</h1>
			<p class="max-w-2xl text-sm leading-6 opacity-75 sm:text-base">
				Pilih kategori untuk melihat jadwal lengkap, countdown sesi berikutnya, dan daftar event yang
				sudah berlangsung. Semua waktu otomatis disesuaikan dengan zona waktu lokal kamu.
			</p>
		</div>
	</header>

	<section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each SERIES_LIST as s (s.id)}
			<a
				href="/jadwal/{s.id}"
				class="group flex flex-col gap-3 rounded-lg border-[1px] border-surface-200-800 bg-surface-100-900 p-5 transition-colors hover:border-primary-500 hover:bg-surface-200-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
			>
				<div class="flex items-center justify-between gap-3">
					<span
						class="inline-flex h-10 min-w-[3rem] items-center justify-center rounded-md bg-surface-200-800 px-2.5 text-base font-bold tracking-wide text-primary-500 group-hover:bg-surface-50-950 overflow-hidden"
						aria-hidden="true"
					>
						{#if seriesLogos[s.id]}
							<img src={seriesLogos[s.id]!.light} alt="" class="{seriesLogos[s.id]!.class ?? 'h-5 w-auto'} block dark:hidden" />
							<img src={seriesLogos[s.id]!.dark} alt="" class="{seriesLogos[s.id]!.class ?? 'h-5 w-auto'} hidden dark:block" />
						{:else}
							<i class="fa-solid {s.icon} text-lg"></i>
						{/if}
					</span>
					<span class="text-sm opacity-60 transition-transform group-hover:translate-x-0.5"><i class="fa-solid fa-arrow-right"></i></span>
				</div>
				<div>
					<h2 class="h5 leading-snug">{s.label}</h2>
					<p class="mt-1 text-sm leading-6 opacity-75">{s.description}</p>
				</div>
				<span class="mt-auto text-xs font-medium text-primary-500">Lihat jadwal {year} <i class="fa-solid fa-arrow-right"></i></span>
			</a>
		{/each}
	</section>
</div>
