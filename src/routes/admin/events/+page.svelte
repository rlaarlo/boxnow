<script lang="ts">
	import type { EventRecord } from '$lib/types';
	import {
		listAllEvents,
		createEvent,
		updateEvent,
		deleteEvent,
		eventStatus,
		type EventInput
	} from '$lib/services/events';
	import EventForm from '$lib/components/admin/EventForm.svelte';
	import Flag from '$lib/components/Flag.svelte';
	import { pb } from '$lib/pocketbase';

	type SyncSeries = 'f1' | 'motogp' | 'wsbk' | 'wec' | 'gt';
	type SyncResult = {
		series: SyncSeries;
		total: number;
		created: number;
		updated: number;
		errors: number;
		errorMessages?: string[];
	};

	let events = $state<EventRecord[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let search = $state('');
	let categoryFilter = $state('all');

	let formOpen = $state(false);
	let editing = $state<EventRecord | null>(null);
	let now = $state(Date.now());

	let syncing = $state<SyncSeries | null>(null);
	let syncYear = $state(new Date().getFullYear());
	let syncResult = $state<SyncResult | null>(null);
	let syncError = $state<string | null>(null);

	const filtered = $derived(
		events.filter((e) => {
			const matchSearch = e.title.toLowerCase().includes(search.toLowerCase());
			const matchCat = categoryFilter === 'all' || e.category === categoryFilter;
			return matchSearch && matchCat;
		})
	);

	async function load() {
		loading = true;
		error = null;
		try {
			events = await listAllEvents();
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'Gagal memuat data';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		load();
		const t = setInterval(() => (now = Date.now()), 30_000);
		return () => clearInterval(t);
	});

	function openCreate() {
		editing = null;
		formOpen = true;
	}

	function openEdit(ev: EventRecord) {
		editing = ev;
		formOpen = true;
	}

	async function handleSave(data: EventInput, id?: string) {
		if (id) {
			await updateEvent(id, data);
		} else {
			await createEvent(data);
		}
		await load();
	}

	async function handleDelete(id: string) {
		if (!confirm('Hapus event ini?')) return;
		try {
			await deleteEvent(id);
			events = events.filter((e) => e.id !== id);
		} catch (err: unknown) {
			alert(err instanceof Error ? err.message : 'Gagal hapus');
		}
	}

	async function handleSync(series: SyncSeries) {
		syncing = series;
		syncError = null;
		syncResult = null;
		try {
			const res = await fetch('/admin/events/sync', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ series, year: syncYear, token: pb.authStore.token })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data?.message ?? `HTTP ${res.status}`);
			syncResult = data as SyncResult;
			await load();
		} catch (err: unknown) {
			syncError = err instanceof Error ? err.message : 'Gagal sync';
		} finally {
			syncing = null;
		}
	}

	function fmtDateTime(iso: string): string {
		try {
			return new Date(iso).toLocaleString('id-ID', {
				day: 'numeric',
				month: 'short',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return iso;
		}
	}
</script>

<svelte:head><title>Jadwal — Admin</title></svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="h3">Jadwal Motorsport</h2>
			<p class="opacity-70 text-sm">Kelola jadwal race weekend dan sesi balap.</p>
		</div>
		<button class="btn preset-filled-primary-500" onclick={openCreate}>+ Tambah Event</button>
	</div>

	{#if error}
		<div class="card preset-tonal-error p-3 text-sm">{error}</div>
	{/if}

	<section
		class="card preset-filled-surface-100-900 border-surface-200-800 border-[1px] p-4 space-y-3"
	>
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<h3 class="h5">Sync dari API resmi</h3>
				<p class="text-xs opacity-70">
					Impor / refresh jadwal dari sumber publik. Event yang sudah ada (cocok kategori +
					sesi + waktu mulai) akan di-update, sisanya dibuat baru.
				</p>
			</div>
			<label class="label flex items-center gap-2 text-sm">
				<span>Musim</span>
				<input
					class="input w-24"
					type="number"
					min="2018"
					max="2099"
					bind:value={syncYear}
				/>
			</label>
		</div>

		<div class="flex flex-wrap gap-2">
			<button
				class="btn btn-sm preset-tonal-primary"
				disabled={syncing !== null}
				onclick={() => handleSync('f1')}
			>
				{syncing === 'f1' ? 'Syncing F1…' : 'Sync F1 (OpenF1)'}
			</button>
			<button
				class="btn btn-sm preset-tonal-primary"
				disabled={syncing !== null}
				onclick={() => handleSync('motogp')}
			>
				{syncing === 'motogp' ? 'Syncing MotoGP…' : 'Sync MotoGP'}
			</button>
			<button
				class="btn btn-sm preset-tonal-primary"
				disabled={syncing !== null}
				onclick={() => handleSync('wsbk')}
			>
				{syncing === 'wsbk' ? 'Syncing WSBK…' : 'Sync WSBK (SportsDB)'}
			</button>
			<button
				class="btn btn-sm preset-tonal-primary"
				disabled={syncing !== null}
				onclick={() => handleSync('wec')}
			>
				{syncing === 'wec' ? 'Syncing WEC…' : 'Sync WEC (SportsDB)'}
			</button>
			<button
				class="btn btn-sm preset-tonal-primary"
				disabled={syncing !== null}
				onclick={() => handleSync('gt')}
			>
				{syncing === 'gt' ? 'Syncing GT…' : 'Sync GT World Europe (iCal)'}
			</button>
		</div>

		{#if syncError}
			<div class="card preset-tonal-error p-2 text-xs">{syncError}</div>
		{/if}
		{#if syncResult}
			<div class="card preset-tonal-success p-2 text-xs">
				Sync <strong>{syncResult.series.toUpperCase()}</strong>: total {syncResult.total} ·
				baru {syncResult.created} · diupdate {syncResult.updated}
				{#if syncResult.errors > 0} · error {syncResult.errors}{/if}
				{#if syncResult.errorMessages && syncResult.errorMessages.length > 0}
					<ul class="mt-1 list-disc list-inside opacity-80">
						{#each syncResult.errorMessages as msg}<li>{msg}</li>{/each}
					</ul>
				{/if}
			</div>
		{/if}
	</section>

	<div class="flex flex-wrap gap-3">
		<input
			class="input flex-1 min-w-60"
			type="search"
			placeholder="Cari judul…"
			bind:value={search}
		/>
		<select class="select w-48" bind:value={categoryFilter}>
			<option value="all">Semua Kategori</option>
			<option value="f1">Formula 1</option>
			<option value="motogp">MotoGP</option>
			<option value="wsbk">WSBK</option>
			<option value="wec">WEC</option>
			<option value="formulae">Formula E</option>
			<option value="other">Lainnya</option>
		</select>
	</div>

	<div class="table-wrap card preset-filled-surface-100-900 border-surface-200-800 border-[1px]">
		<table class="table">
			<thead>
				<tr>
					<th>Status</th>
					<th>Title</th>
					<th>Kategori</th>
					<th>Sesi</th>
					<th>Mulai</th>
					<th class="text-right">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#if loading}
					<tr><td colspan="6" class="text-center py-6 opacity-60">Memuat…</td></tr>
				{:else}
					{#each filtered as ev (ev.id)}
						{@const status = eventStatus(ev, now)}
						<tr>
							<td>
								{#if status === 'live'}
									<span class="badge preset-filled-error-500 text-[10px]">LIVE</span>
								{:else if status === 'soon'}
									<span class="badge preset-filled-warning-500 text-[10px]">SOON</span>
								{:else if status === 'upcoming'}
									<span class="badge preset-tonal-primary text-[10px]">UPCOMING</span>
								{:else}
									<span class="badge preset-tonal-surface text-[10px]">ENDED</span>
								{/if}
							</td>
							<td>
								<div class="font-medium flex items-center gap-2">
									<Flag code={ev.flag} size="sm" />
									<span>{ev.title}</span>
								</div>
								{#if ev.circuit}
									<div class="text-xs opacity-60">{ev.circuit}</div>
								{/if}
							</td>
							<td><span class="badge preset-tonal text-xs uppercase">{ev.category}</span></td>
							<td><span class="text-xs">{ev.session}</span></td>
							<td class="text-xs opacity-80">{fmtDateTime(ev.starts_at)}</td>
							<td class="text-right space-x-1">
								<button class="btn btn-sm preset-tonal-primary" onclick={() => openEdit(ev)}>
									Edit
								</button>
								<button class="btn btn-sm preset-tonal-error" onclick={() => handleDelete(ev.id)}>
									Hapus
								</button>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="6" class="text-center py-6 opacity-60">
								Belum ada event. Klik "Tambah Event" untuk mulai.
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>

<EventForm
	bind:open={formOpen}
	event={editing}
	onclose={() => (formOpen = false)}
	onsave={handleSave}
/>
