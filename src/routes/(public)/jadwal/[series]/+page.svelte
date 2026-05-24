<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/state';
	import Seo from '$lib/components/Seo.svelte';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import Flag from '$lib/components/Flag.svelte';
	import {
		nextWeekend,
		statusOfSession,
		statusOfWeekend,
		type F1Session,
		type F1Status,
		type F1Weekend
	} from '$lib/services/openf1';
	import { eventStatus } from '$lib/services/events';
	import type { EventRecord } from '$lib/types';
	import { resolveSeo, breadcrumbJsonLd, sportsEventJsonLd } from '$lib/seo';
	import { absoluteUrl } from '$lib/site';
	import { SERIES_LIST, type Series } from '$lib/services/series';
	import { circuitInfo, flagToCountry } from '$lib/services/circuits';

	let { data } = $props();
	const series = $derived(data.series as Series);
	const seriesMeta = $derived(SERIES_LIST.find((s) => s.id === series) ?? SERIES_LIST[0]);
	const weekends = $derived(data.weekends);
	const events = $derived(data.events);
	const year = $derived(data.year);

	let now = $state(Date.now());
	let tick: ReturnType<typeof setInterval> | null = null;
	let expanded = $state<number | null>(null);
	let mapModal = $state<{ url: string; title: string } | null>(null);

	function openMap(url: string | undefined, title: string) {
		if (!url) return;
		mapModal = { url, title };
	}
	function closeMap() {
		mapModal = null;
	}
	function onWindowKey(e: KeyboardEvent) {
		if (e.key === 'Escape' && mapModal) closeMap();
	}

	const next = $derived(nextWeekend(weekends, now));
	const upcoming = $derived(weekends.filter((w) => statusOfWeekend(w, now) !== 'past'));
	const past = $derived(weekends.filter((w) => statusOfWeekend(w, now) === 'past').reverse());
	const completedCount = $derived(past.length);
	const totalSessions = $derived(weekends.reduce((total, weekend) => total + weekend.sessions.length, 0));
	const nextSession = $derived(
		next?.sessions.find((session) => statusOfSession(session, now) !== 'past') ??
			next?.sessions.find((session) => session.session_type === 'Race') ??
			null
	);
	const nextRaceSession = $derived(next?.sessions.find((session) => session.session_type === 'Race') ?? null);

	const nextCircuit = $derived(next ? circuitInfo(next.circuit_short_name) : null);

	// Generic events (MotoGP, WSBK, WEC, FormulaE) from PocketBase
	const upcomingEvents = $derived(
		events.filter((e) => eventStatus(e, now) !== 'ended')
	);
	const pastEvents = $derived(
		events.filter((e) => eventStatus(e, now) === 'ended').reverse()
	);
	const nextEvent = $derived(
		upcomingEvents.find((e) => eventStatus(e, now) === 'live') ??
			upcomingEvents.find((e) => eventStatus(e, now) === 'soon') ??
			upcomingEvents[0] ??
			null
	);

	const nextEventCountry = $derived(nextEvent ? flagToCountry(nextEvent.flag) : null);
	const nextEventCircuit = $derived(
		nextEvent ? circuitInfo(nextEvent.circuit ?? nextEvent.title) : null
	);

	// Headline stats per series
	const statTotal = $derived(series === 'f1' ? weekends.length : events.length);
	const statSessions = $derived(series === 'f1' ? totalSessions : upcomingEvents.length);
	const statDone = $derived(series === 'f1' ? completedCount : pastEvents.length);

	const SESSION_CODE: Record<string, string> = {
		Practice: 'FP',
		Qualifying: 'Q',
		Race: 'R'
	};

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString('id-ID', {
			weekday: 'short',
			day: 'numeric',
			month: 'short'
		});
	}

	function fmtTime(iso: string): string {
		return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
	}

	function fmtDateRange(a: string, b: string): string {
		const da = new Date(a);
		const db = new Date(b);
		const month = db.toLocaleDateString('id-ID', { month: 'short' });
		if (da.getMonth() === db.getMonth()) {
			return `${da.getDate()}–${db.getDate()} ${month}`;
		}
		return `${da.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} – ${db.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`;
	}

	function fmtFullDate(iso: string): string {
		return new Date(iso).toLocaleDateString('id-ID', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	function countdown(iso: string): string {
		let diff = Math.max(0, new Date(iso).getTime() - now);
		const days = Math.floor(diff / 86_400_000);
		diff -= days * 86_400_000;
		const h = Math.floor(diff / 3_600_000);
		diff -= h * 3_600_000;
		const m = Math.floor(diff / 60_000);
		diff -= m * 60_000;
		const s = Math.floor(diff / 1000);
		const pad = (n: number) => n.toString().padStart(2, '0');
		if (days > 0) return `${days} hari ${pad(h)}:${pad(m)}:${pad(s)}`;
		if (h > 0) return `${h}j ${pad(m)}m ${pad(s)}d`;
		return `${m}m ${pad(s)}d`;
	}

	function sessionLabel(s: F1Session): string {
		const n = s.session_name;
		if (n.startsWith('Practice ')) return 'FP' + n.replace('Practice ', '');
		if (n === 'Sprint Qualifying') return 'Sprint Quali';
		return n;
	}

	function sessionCode(s: F1Session): string {
		if (s.session_name === 'Sprint') return 'S';
		if (s.session_name === 'Sprint Qualifying') return 'SQ';
		if (s.session_name.startsWith('Practice ')) return 'FP' + s.session_name.replace('Practice ', '');
		return SESSION_CODE[s.session_type] ?? 'F1';
	}

	function statusLabel(status: F1Status): string {
		if (status === 'live') return 'Live';
		if (status === 'past') return 'Selesai';
		return 'Akan datang';
	}

	function statusClass(status: F1Status): string {
		if (status === 'live') return 'preset-filled-error-500';
		if (status === 'past') return 'preset-tonal-surface';
		return 'preset-tonal-primary';
	}

	function sessionCountdown(s: F1Session): string | null {
		const startsIn = new Date(s.date_start).getTime() - now;
		if (startsIn <= 0 || startsIn >= 24 * 3600 * 1000) return null;
		return countdown(s.date_start);
	}

	function weekendLocation(w: F1Weekend): string {
		return `${w.circuit_short_name}, ${w.location}`;
	}

	function toggle(key: number) {
		expanded = expanded === key ? null : key;
	}

	function eventSessionLabel(s: EventRecord['session']): string {
		switch (s) {
			case 'practice':
				return 'Practice';
			case 'qualifying':
				return 'Qualifying';
			case 'sprint':
				return 'Sprint';
			case 'race':
				return 'Race';
			default:
				return 'Sesi';
		}
	}

	function eventSessionCode(s: EventRecord['session']): string {
		switch (s) {
			case 'practice':
				return 'FP';
			case 'qualifying':
				return 'Q';
			case 'sprint':
				return 'S';
			case 'race':
				return 'R';
			default:
				return '•';
		}
	}

	function eventStatusLabel(s: ReturnType<typeof eventStatus>): string {
		if (s === 'live') return 'Live';
		if (s === 'soon') return 'Segera';
		if (s === 'ended') return 'Selesai';
		return 'Akan datang';
	}

	function eventStatusClass(s: ReturnType<typeof eventStatus>): string {
		if (s === 'live') return 'preset-filled-error-500';
		if (s === 'soon') return 'preset-filled-warning-500';
		if (s === 'ended') return 'preset-tonal-surface';
		return 'preset-tonal-primary';
	}

	function eventCountdown(e: EventRecord): string | null {
		const startsIn = new Date(e.starts_at).getTime() - now;
		if (startsIn <= 0 || startsIn >= 24 * 3600 * 1000) return null;
		return countdown(e.starts_at);
	}

	onMount(() => {
		if (next) expanded = next.meeting_key;
		tick = setInterval(() => (now = Date.now()), 1000);
	});

	onDestroy(() => {
		if (tick) clearInterval(tick);
	});

	const seo = $derived(
		resolveSeo(
			{
				title:
					series === 'f1'
						? `Jadwal F1 ${year} — Semua Race Weekend`
						: `Jadwal ${seriesMeta.label} ${year}`,
				description:
					series === 'f1'
						? `Jadwal lengkap Formula 1 ${year}: practice, qualifying, sprint, dan race. Waktu lokal Indonesia (WIB) dengan countdown sesi berikutnya.`
						: `Jadwal ${seriesMeta.label} ${year} — ${seriesMeta.description} Waktu lokal Indonesia (WIB).`,
				type: 'website'
			},
			page.url.pathname
		)
	);

	const jsonLd = $derived([
		breadcrumbJsonLd([
			{ name: 'Beranda', url: absoluteUrl('/') },
			{ name: 'Jadwal Motorsport', url: absoluteUrl('/jadwal') },
			{ name: `${seriesMeta.label} ${year}`, url: seo.canonical }
		]),
		// Emit SportsEvent for upcoming F1 race sessions (limit to first 10 weekends)
		...(series === 'f1'
			? upcoming.slice(0, 10).flatMap((w) =>
					w.sessions
						.filter((s) => s.session_type === 'Race' || s.session_name === 'Sprint')
						.map((s) =>
							sportsEventJsonLd({
								url: seo.canonical,
								name: `${w.country_name} GP — ${sessionLabel(s)}`,
								startDate: s.date_start,
								endDate: s.date_end,
								location: `${w.circuit_short_name}, ${w.location}`,
								sport: 'Formula 1',
								eventStatus: statusOfSession(s, now) === 'live' ? 'Live' : 'Scheduled'
							})
						)
				)
			: upcomingEvents.slice(0, 10).map((e) =>
					sportsEventJsonLd({
						url: seo.canonical,
						name: e.title,
						startDate: e.starts_at,
						endDate: e.ends_at ?? e.starts_at,
						location: e.circuit ?? '',
						sport: seriesMeta.label,
						eventStatus: eventStatus(e, now) === 'live' ? 'Live' : 'Scheduled'
					})
				))
	]);
</script>

<Seo {seo} {jsonLd} />

<div class="mx-auto max-w-6xl space-y-6">
	<Breadcrumb
		items={[
			{ name: 'Beranda', href: '/' },
			{ name: 'Jadwal Motorsport', href: '/jadwal' },
			{ name: `${seriesMeta.label} ${year}` }
		]}
	/>
	<header class="grid gap-5 py-2 sm:py-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
		<div class="space-y-3">
			<div class="space-y-2">
				<p class="text-xs font-semibold uppercase opacity-60">{seriesMeta.label}</p>
				<h1 class="h1 leading-tight">Jadwal {seriesMeta.short} {year}</h1>
				<p class="max-w-2xl text-sm leading-6 opacity-75 sm:text-base">
					{seriesMeta.description} Semua waktu ditampilkan dalam zona waktu lokal kamu.
				</p>
				<p>
					<a
						href="/jadwal/{series}/calendar.ics"
						class="inline-flex items-center gap-2 rounded-md border-[1px] border-surface-200-800 bg-surface-100-900 px-3 py-1.5 text-xs font-semibold hover:bg-surface-200-800"
						download
					>
						<span aria-hidden="true"><i class="fa-solid fa-calendar-days"></i></span>
						<span>Tambah ke kalender (.ics)</span>
					</a>
				</p>
			</div>
		</div>

		<div class="grid grid-cols-3 gap-2 sm:gap-3">
			<div class="rounded-lg border-[1px] border-surface-200-800 bg-surface-100-900 p-3">
				<div class="text-xs opacity-60">{series === 'f1' ? 'Weekend' : 'Total'}</div>
				<div class="mt-1 text-2xl font-bold tabular-nums">{statTotal}</div>
			</div>
			<div class="rounded-lg border-[1px] border-surface-200-800 bg-surface-100-900 p-3">
				<div class="text-xs opacity-60">{series === 'f1' ? 'Sesi' : 'Akan datang'}</div>
				<div class="mt-1 text-2xl font-bold tabular-nums">{statSessions}</div>
			</div>
			<div class="rounded-lg border-[1px] border-surface-200-800 bg-surface-100-900 p-3">
				<div class="text-xs opacity-60">Selesai</div>
				<div class="mt-1 text-2xl font-bold tabular-nums">{statDone}</div>
			</div>
		</div>
	</header>

	<nav aria-label="Pilih kategori motorsport" class="-mx-1 overflow-x-auto">
		<ul class="flex min-w-max gap-2 px-1">
			{#each SERIES_LIST as s (s.id)}
				{@const active = s.id === series}
				<li>
					<a
						href="/jadwal/{s.id}"
						aria-current={active ? 'page' : undefined}
						class="inline-flex items-center gap-2 rounded-full border-[1px] px-4 py-2 text-sm font-semibold transition-colors {active
							? 'border-primary-500 bg-primary-500 text-white'
							: 'border-surface-200-800 bg-surface-100-900 hover:bg-surface-200-800'}"
					>
						{s.short}
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	{#if series === 'f1'}

	{#if weekends.length === 0}
		<section class="card preset-tonal-error border-[1px] border-error-500 p-5">
			<h2 class="h5">Jadwal belum tersedia</h2>
			<p class="mt-2 text-sm opacity-80">
				Data OpenF1 belum bisa dimuat saat ini. Coba muat ulang halaman beberapa saat lagi.
			</p>
		</section>
	{:else}
		{#if next}
			{@const status = statusOfWeekend(next, now)}
			<section
				class="overflow-hidden rounded-lg border-[1px] border-surface-200-800 bg-surface-100-900 shadow-sm"
				aria-labelledby="next-weekend-title"
			>
				<div class="grid gap-0 lg:grid-cols-[minmax(0,1fr)_20rem]">
					<div class="p-5 sm:p-6 lg:p-7">
						<div class="flex flex-wrap items-center gap-2">
							<span class="badge {statusClass(status)} text-xs">{status === 'live' ? 'Akhir pekan ini' : 'Berikutnya'}</span>
							<span class="text-xs opacity-60">{fmtDateRange(next.starts_at, next.ends_at)}</span>
						</div>

						<div class="mt-5 flex items-start gap-4">
							<div
								class="grid h-16 w-16 shrink-0 place-items-center rounded-lg border-[1px] border-surface-200-800 bg-surface-200-800 sm:h-20 sm:w-20"
								aria-hidden="true"
							>
								<Flag code={next.country_code} title={next.country_name} size="xl" />
							</div>
							<div class="min-w-0 space-y-2">
								<p class="text-sm font-medium opacity-70">{next.country_name} Grand Prix</p>
								<h2 id="next-weekend-title" class="h2 leading-tight">{next.circuit_short_name}</h2>
								<p class="text-sm opacity-70">{next.location}</p>
							</div>
						</div>

						{#if nextCircuit?.layout}
							<figure class="mt-5 rounded-lg border-[1px] border-surface-200-800 bg-surface-50-950 p-3">
								<img
									src={nextCircuit.layout}
									alt="Layout sirkuit {next.circuit_short_name}"
									loading="lazy"
									class="mx-auto max-h-44 w-full object-contain"
									onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
								/>
								<figcaption class="mt-2 text-center text-xs opacity-60">
									Layout {next.circuit_short_name}
								</figcaption>
							</figure>
						{/if}

						<div class="mt-6 grid gap-3 sm:grid-cols-2">
							<div class="rounded-lg bg-surface-50-950 p-4">
								<div class="text-xs opacity-60">Sesi berikutnya</div>
								{#if nextSession}
									<div class="mt-1 font-semibold">{sessionLabel(nextSession)}</div>
									<div class="mt-1 text-xs opacity-70">
										{fmtDate(nextSession.date_start)} · {fmtTime(nextSession.date_start)}
									</div>
								{:else}
									<div class="mt-1 font-semibold">Weekend selesai</div>
									<div class="mt-1 text-xs opacity-70">Semua sesi sudah berlangsung</div>
								{/if}
							</div>

							<div class="rounded-lg bg-surface-50-950 p-4">
								<div class="text-xs opacity-60">Race utama</div>
								{#if nextRaceSession}
									<div class="mt-1 font-semibold">{fmtFullDate(nextRaceSession.date_start)}</div>
									<div class="mt-1 text-xs opacity-70">Pukul {fmtTime(nextRaceSession.date_start)}</div>
								{:else}
									<div class="mt-1 font-semibold">Belum terjadwal</div>
									<div class="mt-1 text-xs opacity-70">Menunggu data race</div>
								{/if}
							</div>
						</div>
					</div>

					<aside class="border-t-[1px] border-surface-200-800 bg-surface-50-950 p-5 sm:p-6 lg:border-l-[1px] lg:border-t-0">
						<div class="text-xs font-semibold uppercase opacity-60">Countdown race</div>
						{#if status === 'live'}
							<div class="mt-3 flex items-center gap-2 text-error-500">
								<span class="h-2 w-2 rounded-full bg-error-500 animate-pulse" aria-hidden="true"></span>
								<span class="font-semibold">Weekend berlangsung</span>
							</div>
							<p class="mt-3 text-sm leading-6 opacity-75">Cek urutan sesi di bawah untuk status terbaru.</p>
						{:else if nextRaceSession}
							<div class="mt-3 text-3xl font-bold tabular-nums text-primary-500 sm:text-4xl">
								{countdown(nextRaceSession.date_start)}
							</div>
							<p class="mt-3 text-sm leading-6 opacity-75">
								{fmtDate(nextRaceSession.date_start)} pukul {fmtTime(nextRaceSession.date_start)}
							</p>
						{:else}
							<div class="mt-3 text-2xl font-bold">TBA</div>
							<p class="mt-3 text-sm leading-6 opacity-75">Sesi race belum tersedia dari OpenF1.</p>
						{/if}

						<a href="https://api.openf1.org" target="_blank" rel="noreferrer" class="anchor mt-6 inline-block text-sm">
							Data OpenF1
						</a>
					</aside>
				</div>
			</section>
		{/if}

		<section class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
			<div class="space-y-3">
				<div class="flex flex-wrap items-end justify-between gap-3 px-1">
					<div>
						<h2 class="h4">Race Weekend</h2>
						<p class="mt-1 text-sm opacity-70">{upcoming.length} tersisa di musim {year}</p>
					</div>
				</div>

				{#if upcoming.length > 0}
					<div class="space-y-3">
						{#each upcoming as w (w.meeting_key)}
							{@const wStatus = statusOfWeekend(w, now)}
							{@const isOpen = expanded === w.meeting_key}
						{@const wCircuit = circuitInfo(w.circuit_short_name)}
						<article
							class="overflow-hidden rounded-lg border-[1px] border-surface-200-800 bg-surface-100-900 transition-colors"
							class:border-error-500={wStatus === 'live'}
						>
							<div class="flex items-stretch">
								<button
									type="button"
									onclick={() => toggle(w.meeting_key)}
									class="grid flex-1 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4 text-left transition-colors hover:bg-surface-200-800 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-500 sm:gap-4 sm:p-5"
									aria-expanded={isOpen}
									aria-controls="weekend-{w.meeting_key}"
								>
									<span
										class="grid h-12 w-12 place-items-center rounded-lg bg-surface-200-800"
										aria-hidden="true"
									>
										<Flag code={w.country_code} title={w.country_name} size="lg" />
									</span>
									<span class="min-w-0">
										<span class="flex flex-wrap items-center gap-2">
											<span class="font-semibold">{w.country_name} GP</span>
											<span class="badge {statusClass(wStatus)} text-[10px]">{statusLabel(wStatus)}</span>
										</span>
										<span class="mt-1 block truncate text-xs opacity-65 sm:text-sm">
											{weekendLocation(w)} · {fmtDateRange(w.starts_at, w.ends_at)}
										</span>
									</span>
									<span class="grid h-8 w-8 place-items-center rounded-full bg-surface-200-800 text-sm opacity-70" aria-hidden="true">
										<i class="fa-solid {isOpen ? 'fa-chevron-up' : 'fa-chevron-down'}"></i>
									</span>
								</button>
								{#if wCircuit.layout}
									<button
										type="button"
										onclick={() => openMap(wCircuit.layout, w.circuit_short_name)}
										class="grid w-12 shrink-0 place-items-center border-l-[1px] border-surface-200-800 text-surface-700-300 transition hover:bg-primary-500 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-500 sm:w-14"
										aria-label="Lihat layout sirkuit {w.circuit_short_name}"
										title="Lihat layout sirkuit"
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
											<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/>
											<circle cx="12" cy="12" r="3"/>
										</svg>
									</button>
								{/if}
							</div>

							{#if isOpen}
								<div id="weekend-{w.meeting_key}" class="border-t-[1px] border-surface-200-800">
									<ul class="divide-y divide-surface-200-800">
											{#each w.sessions as s (s.session_key)}
												{@const sStatus = statusOfSession(s, now)}
												{@const nearCountdown = sessionCountdown(s)}
												<li
													class="grid gap-3 px-4 py-3 text-sm sm:grid-cols-[3.5rem_minmax(0,1fr)_7rem_auto] sm:items-center sm:px-5"
													class:opacity-55={sStatus === 'past'}
												>
													<div class="flex items-center gap-3 sm:block">
														<span class="inline-grid h-9 w-9 place-items-center rounded-md bg-surface-200-800 text-xs font-bold">
															{sessionCode(s)}
														</span>
														<span class="font-semibold sm:hidden">{sessionLabel(s)}</span>
													</div>

													<div class="min-w-0">
														<div class="hidden font-semibold sm:block">{sessionLabel(s)}</div>
														<time class="text-xs opacity-70" datetime={s.date_start}>{fmtDate(s.date_start)}</time>
													</div>

													<time class="font-mono text-xs tabular-nums sm:text-right" datetime={s.date_start}>
														{fmtTime(s.date_start)}
													</time>

													<div class="flex justify-start sm:justify-end">
														{#if sStatus === 'live'}
															<span class="badge preset-filled-error-500 text-[10px]">Live</span>
														{:else if nearCountdown}
															<span class="badge preset-filled-warning-500 text-[10px] tabular-nums">{nearCountdown}</span>
														{:else}
															<span class="badge {statusClass(sStatus)} text-[10px]">{statusLabel(sStatus)}</span>
														{/if}
													</div>
												</li>
											{/each}
										</ul>
									</div>
								{/if}
							</article>
						{/each}
					</div>
				{:else}
					<div class="rounded-lg border-[1px] border-surface-200-800 bg-surface-100-900 p-5 text-sm opacity-75">
						Semua race weekend musim ini sudah selesai.
					</div>
				{/if}
			</div>

			<aside class="space-y-3 lg:sticky lg:top-24">
				<div class="rounded-lg border-[1px] border-surface-200-800 bg-surface-100-900 p-4">
					<h2 class="h6">Ringkasan</h2>
					<dl class="mt-4 space-y-3 text-sm">
						<div class="flex items-center justify-between gap-3">
							<dt class="opacity-65">Akan datang</dt>
							<dd class="font-semibold tabular-nums">{upcoming.length}</dd>
						</div>
						<div class="flex items-center justify-between gap-3">
							<dt class="opacity-65">Selesai</dt>
							<dd class="font-semibold tabular-nums">{completedCount}</dd>
						</div>
						<div class="flex items-center justify-between gap-3">
							<dt class="opacity-65">Total sesi</dt>
							<dd class="font-semibold tabular-nums">{totalSessions}</dd>
						</div>
					</dl>
				</div>

				{#if past.length > 0}
					<details class="overflow-hidden rounded-lg border-[1px] border-surface-200-800 bg-surface-100-900">
						<summary class="cursor-pointer p-4 text-sm font-semibold hover:bg-surface-200-800">
							Weekend selesai ({past.length})
						</summary>
						<div class="max-h-[26rem] overflow-y-auto border-t-[1px] border-surface-200-800">
							<ul class="divide-y divide-surface-200-800">
								{#each past as w (w.meeting_key)}
									<li class="flex items-center gap-3 p-3 opacity-70">
										<Flag code={w.country_code} title={w.country_name} size="md" />
										<div class="min-w-0 flex-1">
											<div class="truncate text-sm font-medium">{w.country_name} GP</div>
											<div class="text-xs opacity-70">{fmtDateRange(w.starts_at, w.ends_at)}</div>
										</div>
									</li>
								{/each}
							</ul>
						</div>
					</details>
				{/if}
			</aside>
		</section>
	{/if}
	{:else}
		{#if events.length === 0}
			<section class="card preset-tonal border-[1px] border-surface-200-800 p-5">
				<h2 class="h5">Jadwal {seriesMeta.label} belum tersedia</h2>
				<p class="mt-2 text-sm opacity-80">
					Belum ada event {seriesMeta.label} {year} yang dipublikasikan. Cek kembali nanti, atau pilih kategori lain di atas.
				</p>
			</section>
		{:else}
			{#if nextEvent}
				{@const nextStatus = eventStatus(nextEvent, now)}
				<section
					class="overflow-hidden rounded-lg border-[1px] border-surface-200-800 bg-surface-100-900 shadow-sm"
					aria-labelledby="next-event-title"
				>
					<div class="grid gap-0 lg:grid-cols-[minmax(0,1fr)_20rem]">
						<div class="p-5 sm:p-6 lg:p-7">
							<div class="flex flex-wrap items-center gap-2">
								<span class="badge {eventStatusClass(nextStatus)} text-xs">
									{nextStatus === 'live' ? 'Sedang berlangsung' : nextStatus === 'soon' ? 'Segera dimulai' : 'Berikutnya'}
								</span>
								<span class="text-xs opacity-60">{fmtFullDate(nextEvent.starts_at)}</span>
							</div>

							<div class="mt-5 flex items-start gap-4">
								<div
									class="grid h-16 w-16 shrink-0 place-items-center rounded-lg border-[1px] border-surface-200-800 bg-surface-200-800 sm:h-20 sm:w-20"
									aria-hidden="true"
								>
									<Flag code={nextEvent.flag} title={nextEventCountry} size="xl" />
								</div>
								<div class="min-w-0 space-y-2">
									<p class="text-sm font-medium opacity-70">{eventSessionLabel(nextEvent.session)}</p>
									<h2 id="next-event-title" class="h2 leading-tight">{nextEvent.title}</h2>
									{#if nextEvent.circuit}
										<p class="text-sm opacity-70">{nextEvent.circuit}</p>
									{/if}
									{#if nextEventCountry}
										<p class="text-xs opacity-65">Negara: {nextEventCountry}</p>
									{/if}
								</div>
							</div>

							{#if nextEventCircuit?.layout}
								<figure class="mt-5 rounded-lg border-[1px] border-surface-200-800 bg-surface-50-950 p-3">
									<img
										src={nextEventCircuit.layout}
										alt="Layout sirkuit {nextEvent.circuit ?? nextEvent.title}"
										loading="lazy"
										class="mx-auto max-h-44 w-full object-contain"
										onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
									/>
									<figcaption class="mt-2 text-center text-xs opacity-60">
										Layout sirkuit
									</figcaption>
								</figure>
							{/if}
						</div>

						<aside class="border-t-[1px] border-surface-200-800 bg-surface-50-950 p-5 sm:p-6 lg:border-l-[1px] lg:border-t-0">
							<div class="text-xs font-semibold uppercase opacity-60">Countdown</div>
							{#if nextStatus === 'live'}
								<div class="mt-3 flex items-center gap-2 text-error-500">
									<span class="h-2 w-2 rounded-full bg-error-500 animate-pulse" aria-hidden="true"></span>
									<span class="font-semibold">Sedang berlangsung</span>
								</div>
								<p class="mt-3 text-sm leading-6 opacity-75">Sesi sudah dimulai sejak {fmtTime(nextEvent.starts_at)}.</p>
							{:else}
								<div class="mt-3 text-3xl font-bold tabular-nums text-primary-500 sm:text-4xl">
									{countdown(nextEvent.starts_at)}
								</div>
								<p class="mt-3 text-sm leading-6 opacity-75">
									{fmtDate(nextEvent.starts_at)} pukul {fmtTime(nextEvent.starts_at)}
								</p>
							{/if}
						</aside>
					</div>
				</section>
			{/if}

			<section class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
				<div class="space-y-3">
					<div class="flex flex-wrap items-end justify-between gap-3 px-1">
						<div>
							<h2 class="h4">Event {seriesMeta.label}</h2>
							<p class="mt-1 text-sm opacity-70">{upcomingEvents.length} akan datang di musim {year}</p>
						</div>
					</div>

					{#if upcomingEvents.length > 0}
						<ul class="divide-y divide-surface-200-800 overflow-hidden rounded-lg border-[1px] border-surface-200-800 bg-surface-100-900">
							{#each upcomingEvents as ev (ev.id)}
								{@const eStatus = eventStatus(ev, now)}
								{@const nearCountdown = eventCountdown(ev)}
								{@const evCountry = flagToCountry(ev.flag)}
								{@const evCircuit = circuitInfo(ev.circuit ?? ev.title)}
								<li
									class="grid gap-3 px-4 py-3 text-sm sm:grid-cols-[3.5rem_minmax(0,1fr)_8rem_auto] sm:items-center sm:px-5"
								>
									<div class="flex items-center gap-3 sm:block">
										<span class="inline-grid h-9 w-9 place-items-center rounded-md bg-surface-200-800 text-xs font-bold">
											{eventSessionCode(ev.session)}
										</span>
										<span class="sm:hidden"><Flag code={ev.flag} title={evCountry} size="md" /></span>
									</div>
									<div class="min-w-0">
										<div class="flex flex-wrap items-center gap-2">
											<span class="hidden sm:inline"><Flag code={ev.flag} title={evCountry} size="md" /></span>
											<span class="font-semibold">{ev.title}</span>
										</div>
										{#if ev.circuit || evCountry}
											<div class="text-xs opacity-65">
												{ev.circuit ?? ''}{#if ev.circuit && evCountry} · {/if}{evCountry ?? ''}
											</div>
										{/if}
										<div class="mt-1 flex items-center gap-2">
											<time class="text-xs opacity-70" datetime={ev.starts_at}>{fmtDate(ev.starts_at)}</time>
											{#if evCircuit.layout}
												<button
													type="button"
													onclick={() => openMap(evCircuit.layout, ev.circuit ?? ev.title)}
													class="inline-grid h-6 w-6 place-items-center rounded-full bg-surface-200-800 text-xs opacity-80 transition hover:bg-primary-500 hover:text-white hover:opacity-100"
													aria-label="Lihat layout sirkuit {ev.circuit ?? ev.title}"
													title="Lihat layout sirkuit"
												>
													<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
														<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/>
														<circle cx="12" cy="12" r="3"/>
													</svg>
												</button>
											{/if}
										</div>
									</div>
									<time class="font-mono text-xs tabular-nums sm:text-right" datetime={ev.starts_at}>
										{fmtTime(ev.starts_at)}
									</time>
									<div class="flex justify-start sm:justify-end">
										{#if nearCountdown && eStatus !== 'live'}
											<span class="badge preset-filled-warning-500 text-[10px] tabular-nums">{nearCountdown}</span>
										{:else}
											<span class="badge {eventStatusClass(eStatus)} text-[10px]">{eventStatusLabel(eStatus)}</span>
										{/if}
									</div>
								</li>
							{/each}
						</ul>
					{:else}
						<div class="rounded-lg border-[1px] border-surface-200-800 bg-surface-100-900 p-5 text-sm opacity-75">
							Semua event {seriesMeta.label} musim ini sudah selesai.
						</div>
					{/if}
				</div>

				<aside class="space-y-3 lg:sticky lg:top-24">
					<div class="rounded-lg border-[1px] border-surface-200-800 bg-surface-100-900 p-4">
						<h2 class="h6">Ringkasan</h2>
						<dl class="mt-4 space-y-3 text-sm">
							<div class="flex items-center justify-between gap-3">
								<dt class="opacity-65">Akan datang</dt>
								<dd class="font-semibold tabular-nums">{upcomingEvents.length}</dd>
							</div>
							<div class="flex items-center justify-between gap-3">
								<dt class="opacity-65">Selesai</dt>
								<dd class="font-semibold tabular-nums">{pastEvents.length}</dd>
							</div>
							<div class="flex items-center justify-between gap-3">
								<dt class="opacity-65">Total event</dt>
								<dd class="font-semibold tabular-nums">{events.length}</dd>
							</div>
						</dl>
					</div>

					{#if pastEvents.length > 0}
						<details class="overflow-hidden rounded-lg border-[1px] border-surface-200-800 bg-surface-100-900">
							<summary class="cursor-pointer p-4 text-sm font-semibold hover:bg-surface-200-800">
								Event selesai ({pastEvents.length})
							</summary>
							<div class="max-h-[26rem] overflow-y-auto border-t-[1px] border-surface-200-800">
								<ul class="divide-y divide-surface-200-800">
									{#each pastEvents as ev (ev.id)}
										<li class="flex items-center gap-3 p-3 opacity-70">
											<Flag code={ev.flag} title={flagToCountry(ev.flag)} size="md" />
											<div class="min-w-0 flex-1">
												<div class="truncate text-sm font-medium">{ev.title}</div>
												<div class="text-xs opacity-70">{fmtDate(ev.starts_at)}</div>
											</div>
										</li>
									{/each}
								</ul>
							</div>
						</details>
					{/if}
				</aside>
			</section>
		{/if}
	{/if}
</div>

<svelte:window onkeydown={onWindowKey} />

{#if mapModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
		onclick={closeMap}
		role="dialog"
		aria-modal="true"
		aria-label="Layout sirkuit {mapModal.title}"
	>
		<div
			class="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl bg-surface-50-950 shadow-2xl"
			onclick={(e) => e.stopPropagation()}
		>
			<header class="flex items-center justify-between gap-3 border-b-[1px] border-surface-200-800 px-5 py-3">
				<h3 class="h6 truncate">Layout sirkuit · {mapModal.title}</h3>
				<button
					type="button"
					onclick={closeMap}
					class="grid h-9 w-9 place-items-center rounded-full bg-surface-200-800 text-lg hover:bg-error-500 hover:text-white focus-visible:outline-2 focus-visible:outline-primary-500"
					aria-label="Tutup"
				>
					×
				</button>
			</header>
			<div class="flex items-center justify-center bg-surface-100-900 p-4 sm:p-6">
				<img
					src={mapModal.url}
					alt="Layout sirkuit {mapModal.title}"
					class="max-h-[70vh] w-auto max-w-full object-contain"
				/>
			</div>
		</div>
	</div>
{/if}
