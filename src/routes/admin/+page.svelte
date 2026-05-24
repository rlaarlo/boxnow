<script lang="ts">
	import StatCard from '$lib/components/admin/StatCard.svelte';
	import Flag from '$lib/components/Flag.svelte';
	import { getStats } from '$lib/services/admin';
	import { listAllEvents, eventStatus } from '$lib/services/events';
	import type { EventRecord } from '$lib/types';

	let stats = $state({
		totalMembers: 0,
		totalAdmins: 0,
		totalPosts: 0,
		publishedPosts: 0,
		totalEvents: 0
	});
	let recentEvents = $state<EventRecord[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function load() {
		loading = true;
		error = null;
		try {
			const [s, evs] = await Promise.all([getStats(), listAllEvents()]);
			stats = s;
			recentEvents = evs.slice(0, 5);
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'Gagal memuat data';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		load();
	});

	function fmt(iso: string): string {
		return new Date(iso).toLocaleString('id-ID', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head><title>Dashboard — Admin</title></svelte:head>

<div class="space-y-6">
	<div>
		<h2 class="h3">Dashboard</h2>
		<p class="opacity-70 text-sm">Ringkasan blog & jadwal motorsport.</p>
	</div>

	{#if error}
		<div class="card preset-tonal-error p-3 text-sm">{error}</div>
	{/if}

	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<StatCard
			label="Artikel Published"
			value={loading ? '...' : `${stats.publishedPosts} / ${stats.totalPosts}`}
			hint="Dari total artikel"
			accent="primary"
		/>
		<StatCard
			label="Total Events"
			value={loading ? '...' : stats.totalEvents}
			hint="Jadwal terdaftar"
			accent="success"
		/>
		<StatCard
			label="Members"
			value={loading ? '...' : stats.totalMembers}
			hint="Member terdaftar"
			accent="warning"
		/>
		<StatCard
			label="Admin"
			value={loading ? '...' : stats.totalAdmins}
			hint="Pengelola platform"
			accent="error"
		/>
	</div>

	<div class="card preset-filled-surface-100-900 border-surface-200-800 border-[1px] p-5">
		<div class="flex items-center justify-between mb-4">
			<h3 class="h5">Event Terbaru</h3>
			<a href="/admin/events" class="text-sm anchor">Lihat semua <i class="fa-solid fa-arrow-right"></i></a>
		</div>
		{#if loading}
			<p class="opacity-60 text-sm">Memuat...</p>
		{:else if recentEvents.length === 0}
			<p class="opacity-60 text-sm">
				Belum ada event. <a href="/admin/events" class="anchor">Tambahkan sekarang <i class="fa-solid fa-arrow-right"></i></a>
			</p>
		{:else}
			<ul class="space-y-2">
				{#each recentEvents as ev (ev.id)}
					{@const st = eventStatus(ev)}
					<li
						class="flex items-center justify-between py-2 border-b-[1px] border-surface-200-800 last:border-0"
					>
						<div class="min-w-0">
							<div class="font-medium truncate flex items-center gap-2">
								<Flag code={ev.flag} size="sm" />
								<span class="truncate">{ev.title}</span>
							</div>
							<div class="text-xs opacity-60">{fmt(ev.starts_at)}</div>
						</div>
						<span
							class="badge text-xs uppercase shrink-0 {st === 'live'
								? 'preset-filled-error-500'
								: st === 'soon'
									? 'preset-filled-warning-500'
									: st === 'ended'
										? 'preset-tonal-surface'
										: 'preset-tonal-primary'}"
						>
							{st}
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
