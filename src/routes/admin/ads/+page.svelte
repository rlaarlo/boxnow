<script lang="ts">
	import type { AdRecord, AdPlacement, AdProvider } from '$lib/types';
	import {
		listAds,
		createAd,
		updateAd,
		toggleAdActive,
		deleteAd,
		AD_PLACEMENTS,
		AD_PROVIDERS,
		type AdInput
	} from '$lib/services/ads';

	let ads = $state<AdRecord[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let search = $state('');
	let placementFilter = $state<'all' | AdPlacement>('all');

	let formOpen = $state(false);
	let saving = $state(false);
	let editing = $state<AdRecord | null>(null);
	let formError = $state<string | null>(null);

	const emptyForm: AdInput = {
		name: '',
		placement: 'in-article',
		provider: 'adsense',
		adsense_slot: '',
		custom_html: '',
		active: true,
		weight: 0,
		starts_at: '',
		ends_at: '',
		notes: ''
	};

	let form = $state<AdInput>({ ...emptyForm });

	const filtered = $derived(
		ads.filter((a) => {
			const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
			const matchPlacement = placementFilter === 'all' || a.placement === placementFilter;
			return matchSearch && matchPlacement;
		})
	);

	async function load() {
		loading = true;
		error = null;
		try {
			ads = await listAds();
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'Gagal memuat data iklan';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		load();
	});

	function openCreate() {
		editing = null;
		form = { ...emptyForm };
		formError = null;
		formOpen = true;
	}

	function openEdit(ad: AdRecord) {
		editing = ad;
		form = {
			name: ad.name,
			placement: ad.placement,
			provider: ad.provider,
			adsense_slot: ad.adsense_slot ?? '',
			custom_html: ad.custom_html ?? '',
			active: ad.active,
			weight: ad.weight ?? 0,
			starts_at: ad.starts_at ? ad.starts_at.slice(0, 16) : '',
			ends_at: ad.ends_at ? ad.ends_at.slice(0, 16) : '',
			notes: ad.notes ?? ''
		};
		formError = null;
		formOpen = true;
	}

	function closeForm() {
		formOpen = false;
		editing = null;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		formError = null;

		if (!form.name.trim()) {
			formError = 'Nama iklan wajib diisi.';
			return;
		}
		if (form.provider === 'adsense' && !form.adsense_slot?.trim()) {
			formError = 'Slot AdSense wajib diisi untuk provider AdSense.';
			return;
		}
		if (form.provider === 'custom' && !form.custom_html?.trim()) {
			formError = 'Custom HTML wajib diisi untuk provider Custom.';
			return;
		}

		const payload: AdInput = {
			...form,
			weight: Number(form.weight) || 0,
			starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : '',
			ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : ''
		};

		saving = true;
		try {
			if (editing) {
				await updateAd(editing.id, payload);
			} else {
				await createAd(payload);
			}
			await load();
			closeForm();
		} catch (err: unknown) {
			formError = err instanceof Error ? err.message : 'Gagal menyimpan iklan';
		} finally {
			saving = false;
		}
	}

	async function handleToggle(ad: AdRecord) {
		try {
			const updated = await toggleAdActive(ad.id, !ad.active);
			ads = ads.map((a) => (a.id === ad.id ? updated : a));
		} catch (err: unknown) {
			alert(err instanceof Error ? err.message : 'Gagal mengubah status');
		}
	}

	async function handleDelete(ad: AdRecord) {
		if (!confirm(`Hapus iklan "${ad.name}"?`)) return;
		try {
			await deleteAd(ad.id);
			ads = ads.filter((a) => a.id !== ad.id);
		} catch (err: unknown) {
			alert(err instanceof Error ? err.message : 'Gagal menghapus');
		}
	}

	function placementLabel(value: AdPlacement): string {
		return AD_PLACEMENTS.find((p) => p.value === value)?.label ?? value;
	}

	function providerLabel(value: AdProvider): string {
		return AD_PROVIDERS.find((p) => p.value === value)?.label ?? value;
	}
</script>

<svelte:head><title>Iklan — Admin</title></svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between flex-wrap gap-3">
		<div>
			<h2 class="h3">Manajemen Iklan</h2>
			<p class="opacity-70 text-sm">
				Kelola unit iklan AdSense atau custom HTML berdasarkan placement.
			</p>
		</div>
		<button class="btn preset-filled-primary-500" onclick={openCreate}>+ Tambah Iklan</button>
	</div>

	{#if error}
		<div class="card preset-tonal-error p-3 text-sm">{error}</div>
	{/if}

	<div class="flex flex-wrap gap-3">
		<input
			class="input flex-1 min-w-60"
			type="search"
			placeholder="Cari nama iklan…"
			bind:value={search}
		/>
		<select class="select w-56" bind:value={placementFilter}>
			<option value="all">Semua Placement</option>
			{#each AD_PLACEMENTS as p (p.value)}
				<option value={p.value}>{p.label}</option>
			{/each}
		</select>
	</div>

	<div class="table-wrap card preset-filled-surface-100-900 border-surface-200-800 border-[1px]">
		<table class="table">
			<thead>
				<tr>
					<th>Status</th>
					<th>Nama</th>
					<th>Placement</th>
					<th>Provider</th>
					<th class="text-right">Bobot</th>
					<th class="text-right">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#if loading}
					<tr><td colspan="6" class="text-center py-6 opacity-60">Memuat…</td></tr>
				{:else}
					{#each filtered as ad (ad.id)}
						<tr>
							<td>
								{#if ad.active}
									<span class="badge preset-filled-success-500 text-[10px]">AKTIF</span>
								{:else}
									<span class="badge preset-tonal-surface text-[10px]">NONAKTIF</span>
								{/if}
							</td>
							<td>
								<div class="font-medium">{ad.name}</div>
								{#if ad.notes}
									<div class="text-xs opacity-60 truncate max-w-xs">{ad.notes}</div>
								{/if}
							</td>
							<td>
								<span class="badge preset-tonal text-xs">{placementLabel(ad.placement)}</span>
							</td>
							<td>
								<span class="text-xs">{providerLabel(ad.provider)}</span>
								{#if ad.provider === 'adsense' && ad.adsense_slot}
									<div class="text-[10px] opacity-50 font-mono">{ad.adsense_slot}</div>
								{/if}
							</td>
							<td class="text-right text-xs">{ad.weight ?? 0}</td>
							<td class="text-right space-x-1">
								<button
									class="btn btn-sm {ad.active ? 'preset-tonal-warning' : 'preset-tonal-success'}"
									onclick={() => handleToggle(ad)}
								>
									{ad.active ? 'Nonaktifkan' : 'Aktifkan'}
								</button>
								<button class="btn btn-sm preset-tonal-primary" onclick={() => openEdit(ad)}>
									Edit
								</button>
								<button class="btn btn-sm preset-tonal-error" onclick={() => handleDelete(ad)}>
									Hapus
								</button>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="6" class="text-center py-6 opacity-60">
								Belum ada iklan. Klik "Tambah Iklan" untuk membuat unit baru.
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>

{#if formOpen}
	<div
		class="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto p-4"
		role="presentation"
		onclick={(e) => {
			if (e.target === e.currentTarget) closeForm();
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') closeForm();
		}}
	>
		<div class="card preset-filled-surface-100-900 border-surface-200-800 border-[1px] w-full max-w-2xl my-8">
			<form onsubmit={handleSubmit} class="p-5 space-y-4">
				<div class="flex items-center justify-between">
					<h3 class="h4">{editing ? 'Edit Iklan' : 'Tambah Iklan'}</h3>
					<button type="button" class="btn btn-sm preset-tonal" onclick={closeForm} aria-label="Tutup"><i class="fa-solid fa-xmark"></i></button>
				</div>

				{#if formError}
					<div class="card preset-tonal-error p-2 text-sm">{formError}</div>
				{/if}

				<label class="label">
					<span>Nama</span>
					<input
						class="input"
						type="text"
						required
						placeholder="Misal: Header Banner Desktop"
						bind:value={form.name}
					/>
				</label>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<label class="label">
						<span>Placement</span>
						<select class="select" bind:value={form.placement}>
							{#each AD_PLACEMENTS as p (p.value)}
								<option value={p.value}>{p.label}</option>
							{/each}
						</select>
					</label>

					<label class="label">
						<span>Provider</span>
						<select class="select" bind:value={form.provider}>
							{#each AD_PROVIDERS as p (p.value)}
								<option value={p.value}>{p.label}</option>
							{/each}
						</select>
					</label>
				</div>

				{#if form.provider === 'adsense'}
					<label class="label">
						<span>AdSense Slot ID</span>
						<input
							class="input font-mono"
							type="text"
							placeholder="1234567890"
							bind:value={form.adsense_slot}
						/>
						<span class="text-xs opacity-60">
							Pastikan <code>PUBLIC_ADSENSE_CLIENT</code> sudah di-set di environment.
						</span>
					</label>
				{:else}
					<label class="label">
						<span>Custom HTML</span>
						<textarea
							class="textarea font-mono text-xs"
							rows="6"
							placeholder="<a href='...'><img src='...' /></a>"
							bind:value={form.custom_html}
						></textarea>
						<span class="text-xs opacity-60">
							HTML akan di-render apa adanya. Hanya isi dari sumber yang terpercaya.
						</span>
					</label>
				{/if}

				<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<label class="label">
						<span>Bobot</span>
						<input
							class="input"
							type="number"
							min="0"
							placeholder="0"
							bind:value={form.weight}
						/>
						<span class="text-xs opacity-60">Lebih tinggi = lebih sering.</span>
					</label>

					<label class="label">
						<span>Mulai</span>
						<input class="input" type="datetime-local" bind:value={form.starts_at} />
					</label>

					<label class="label">
						<span>Berakhir</span>
						<input class="input" type="datetime-local" bind:value={form.ends_at} />
					</label>
				</div>

				<label class="label">
					<span>Catatan (opsional)</span>
					<input
						class="input"
						type="text"
						placeholder="Misal: kampanye sponsor X bulan Juni"
						bind:value={form.notes}
					/>
				</label>

				<label class="flex items-center gap-2">
					<input type="checkbox" class="checkbox" bind:checked={form.active} />
					<span>Aktifkan iklan ini</span>
				</label>

				<div class="flex justify-end gap-2 pt-2">
					<button type="button" class="btn preset-tonal" onclick={closeForm} disabled={saving}>
						Batal
					</button>
					<button type="submit" class="btn preset-filled-primary-500" disabled={saving}>
						{saving ? 'Menyimpan…' : editing ? 'Simpan Perubahan' : 'Buat Iklan'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
