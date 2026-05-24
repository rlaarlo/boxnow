<script lang="ts">
	import {
		listCategoryStats,
		renameCategory,
		deleteCategory,
		type CategoryStat
	} from '$lib/services/admin';

	let categories = $state<CategoryStat[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let search = $state('');
	let busyKey = $state<string | null>(null);
	let notice = $state<string | null>(null);

	let editing = $state<string | null>(null);
	let editValue = $state('');

	const filtered = $derived(
		search.trim()
			? categories.filter((c) =>
					c.value.toLowerCase().includes(search.trim().toLowerCase())
			  )
			: categories
	);

	const totals = $derived({
		categories: categories.length,
		posts: categories.reduce((s, c) => s + c.total, 0),
		published: categories.reduce((s, c) => s + c.published, 0)
	});

	async function load() {
		loading = true;
		error = null;
		try {
			categories = await listCategoryStats();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Gagal memuat kategori';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		load();
	});

	function startEdit(c: CategoryStat) {
		editing = c.value;
		editValue = c.value;
	}

	function cancelEdit() {
		editing = null;
		editValue = '';
	}

	async function saveRename(c: CategoryStat) {
		const next = editValue.trim();
		if (!next || next === c.value) {
			cancelEdit();
			return;
		}
		busyKey = c.value;
		error = null;
		try {
			const n = await renameCategory(c.value, next);
			notice = `Kategori "${c.value}" diganti menjadi "${next}" pada ${n} artikel.`;
			editing = null;
			editValue = '';
			await load();
			setTimeout(() => (notice = null), 3000);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Gagal mengganti nama kategori';
		} finally {
			busyKey = null;
		}
	}

	async function remove(c: CategoryStat) {
		const ok = confirm(
			`Hapus kategori "${c.value}"? Field kategori pada ${c.total} artikel akan dikosongkan (artikel tetap aman).`
		);
		if (!ok) return;
		busyKey = c.value;
		error = null;
		try {
			const n = await deleteCategory(c.value);
			notice = `Kategori "${c.value}" dihapus dari ${n} artikel.`;
			await load();
			setTimeout(() => (notice = null), 3000);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Gagal menghapus kategori';
		} finally {
			busyKey = null;
		}
	}
</script>

<svelte:head><title>Kategori — Admin</title></svelte:head>

<div class="space-y-6">
	<div class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h2 class="h3">Kategori</h2>
			<p class="opacity-70 text-sm">
				Kategori diambil dari field <code>category</code> pada artikel. Untuk menambah
				kategori baru, isi field kategori saat menulis atau mengedit artikel.
			</p>
		</div>
		<div class="flex gap-2 text-xs">
			<span class="badge preset-tonal">{totals.categories} kategori</span>
			<span class="badge preset-tonal">{totals.posts} artikel</span>
			<span class="badge preset-tonal-primary">{totals.published} publish</span>
		</div>
	</div>

	{#if error}
		<div class="card preset-tonal-error p-3 text-sm">{error}</div>
	{/if}
	{#if notice}
		<div class="card preset-tonal-success p-3 text-sm">{notice}</div>
	{/if}

	<input
		class="input w-full max-w-md"
		type="search"
		placeholder="Cari kategori..."
		bind:value={search}
	/>

	<div class="table-wrap card preset-filled-surface-100-900 border-surface-200-800 border-[1px]">
		<table class="table">
			<thead>
				<tr>
					<th>Nama</th>
					<th>Slug</th>
					<th class="text-right">Artikel</th>
					<th class="text-right">Publish</th>
					<th class="text-right">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#if loading}
					<tr><td colspan="5" class="text-center py-6 opacity-60">Memuat...</td></tr>
				{:else}
					{#each filtered as c (c.slug)}
						<tr>
							<td class="font-medium">
								{#if editing === c.value}
									<input
										class="input input-sm"
										bind:value={editValue}
										disabled={busyKey === c.value}
										onkeydown={(e) => {
											if (e.key === 'Enter') saveRename(c);
											if (e.key === 'Escape') cancelEdit();
										}}
									/>
								{:else}
									{c.value}
								{/if}
							</td>
							<td class="font-mono text-xs opacity-70">
								<a class="anchor" href="/kategori/{c.slug}" target="_blank">/{c.slug}</a>
							</td>
							<td class="text-right">{c.total}</td>
							<td class="text-right">
								<span class="badge preset-tonal text-xs">{c.published}</span>
							</td>
							<td class="text-right">
								<div class="inline-flex gap-2">
									{#if editing === c.value}
										<button
											type="button"
											class="btn btn-sm preset-filled-primary-500"
											disabled={busyKey === c.value}
											onclick={() => saveRename(c)}
										>
											Simpan
										</button>
										<button
											type="button"
											class="btn btn-sm preset-tonal"
											disabled={busyKey === c.value}
											onclick={cancelEdit}
										>
											Batal
										</button>
									{:else}
										<button
											type="button"
											class="btn btn-sm preset-tonal-primary"
											disabled={busyKey === c.value}
											onclick={() => startEdit(c)}
										>
											<i class="fa-solid fa-pen-to-square"></i>
											Rename
										</button>
										<button
											type="button"
											class="btn btn-sm preset-tonal-error"
											disabled={busyKey === c.value}
											onclick={() => remove(c)}
										>
											<i class="fa-solid fa-trash"></i>
											Hapus
										</button>
									{/if}
								</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="5" class="text-center py-6 opacity-60">
								Belum ada kategori. Tambahkan kategori dari halaman tulis artikel.
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	<p class="text-xs opacity-60">
		Tips: rename akan memperbarui seluruh artikel yang menggunakan kategori tersebut.
		Hapus hanya mengosongkan field kategori, artikel tidak ikut terhapus.
	</p>
</div>
