<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PostRecord } from '$lib/types';
	import {
		listPosts,
		togglePostPublished,
		togglePostPinned,
		deletePost as deletePostApi
	} from '$lib/services/admin';
	import { getPostThumbnailUrl } from '$lib/services/public';

	type StatusFilter = 'all' | 'published' | 'draft';
	type SortKey = 'title' | 'category' | 'created';
	type SortDir = 'asc' | 'desc';

	let posts = $state<PostRecord[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let search = $state('');
	let status = $state<StatusFilter>('all');
	let category = $state<string>('all');
	let sortKey = $state<SortKey>('created');
	let sortDir = $state<SortDir>('desc');
	let page = $state(1);
	let pageSize = $state(10);
	let selected = $state<Set<string>>(new Set());
	let bulkAction = $state<'' | 'publish' | 'unpublish' | 'delete'>('');

	async function load() {
		loading = true;
		error = null;
		try {
			posts = await listPosts();
			selected = new Set();
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'Gagal memuat artikel';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		load();
	});

	const categories = $derived(
		Array.from(new Set(posts.map((p) => p.category).filter(Boolean))).sort()
	);

	const counts = $derived({
		all: posts.length,
		published: posts.filter((p) => p.published).length,
		draft: posts.filter((p) => !p.published).length
	});

	const filtered = $derived.by(() => {
		const q = search.trim().toLowerCase();
		let list = posts.filter((p) => {
			if (status === 'published' && !p.published) return false;
			if (status === 'draft' && p.published) return false;
			if (category !== 'all' && p.category !== category) return false;
			if (!q) return true;
			return (
				p.title.toLowerCase().includes(q) ||
				p.slug.toLowerCase().includes(q) ||
				(p.excerpt ?? '').toLowerCase().includes(q) ||
				(p.tags ?? '').toLowerCase().includes(q)
			);
		});
		list = [...list].sort((a, b) => {
			let av: string | number = '';
			let bv: string | number = '';
			if (sortKey === 'title') {
				av = a.title.toLowerCase();
				bv = b.title.toLowerCase();
			} else if (sortKey === 'category') {
				av = (a.category ?? '').toLowerCase();
				bv = (b.category ?? '').toLowerCase();
			} else {
				av = new Date(a.created).getTime();
				bv = new Date(b.created).getTime();
			}
			if (av < bv) return sortDir === 'asc' ? -1 : 1;
			if (av > bv) return sortDir === 'asc' ? 1 : -1;
			return 0;
		});
		return list;
	});

	const totalPages = $derived(Math.max(1, Math.ceil(filtered.length / pageSize)));
	const currentPage = $derived(Math.min(page, totalPages));
	const paged = $derived(
		filtered.slice((currentPage - 1) * pageSize, (currentPage - 1) * pageSize + pageSize)
	);

	$effect(() => {
		void search;
		void status;
		void category;
		void pageSize;
		page = 1;
	});

	const allOnPageSelected = $derived(
		paged.length > 0 && paged.every((p) => selected.has(p.id))
	);
	const someOnPageSelected = $derived(paged.some((p) => selected.has(p.id)));

	function toggleSelectAllOnPage() {
		const next = new Set(selected);
		if (allOnPageSelected) {
			paged.forEach((p) => next.delete(p.id));
		} else {
			paged.forEach((p) => next.add(p.id));
		}
		selected = next;
	}

	function toggleSelect(id: string) {
		const next = new Set(selected);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selected = next;
	}

	function setSort(k: SortKey) {
		if (sortKey === k) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = k;
			sortDir = k === 'created' ? 'desc' : 'asc';
		}
	}

	function sortIndicator(k: SortKey) {
		if (sortKey !== k) return 'fa-sort';
		return sortDir === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
	}

	function openCreate() {
		goto('/admin/blog/new');
	}

	function openEdit(p: PostRecord) {
		goto(`/admin/blog/${p.id}/edit`);
	}

	async function togglePublished(p: PostRecord) {
		try {
			const updated = await togglePostPublished(p.id, !p.published);
			posts = posts.map((x) => (x.id === p.id ? updated : x));
		} catch (err: unknown) {
			alert(err instanceof Error ? err.message : 'Gagal update status');
		}
	}

	async function togglePinned(p: PostRecord) {
		try {
			const updated = await togglePostPinned(p.id, !p.pinned);
			posts = posts.map((x) => (x.id === p.id ? updated : x));
		} catch (err: unknown) {
			alert(err instanceof Error ? err.message : 'Gagal update pin');
		}
	}

	async function handleDelete(id: string) {
		if (!confirm('Hapus artikel ini?')) return;
		try {
			await deletePostApi(id);
			posts = posts.filter((p) => p.id !== id);
			const next = new Set(selected);
			next.delete(id);
			selected = next;
		} catch (err: unknown) {
			alert(err instanceof Error ? err.message : 'Gagal hapus');
		}
	}

	async function applyBulk() {
		if (!bulkAction || selected.size === 0) return;
		const ids = Array.from(selected);
		if (bulkAction === 'delete' && !confirm(`Hapus ${ids.length} artikel terpilih?`)) return;
		try {
			if (bulkAction === 'publish' || bulkAction === 'unpublish') {
				const newVal = bulkAction === 'publish';
				const updates = await Promise.all(ids.map((id) => togglePostPublished(id, newVal)));
				const map = new Map(updates.map((u) => [u.id, u]));
				posts = posts.map((p) => map.get(p.id) ?? p);
			} else if (bulkAction === 'delete') {
				await Promise.all(ids.map((id) => deletePostApi(id)));
				posts = posts.filter((p) => !selected.has(p.id));
			}
			selected = new Set();
			bulkAction = '';
		} catch (err: unknown) {
			alert(err instanceof Error ? err.message : 'Gagal menjalankan bulk action');
		}
	}

	function formatDate(iso: string) {
		const d = new Date(iso);
		return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
	}

	function formatTime(iso: string) {
		const d = new Date(iso);
		return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
	}

	function tagList(tags: string | undefined) {
		return (tags ?? '')
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean);
	}
</script>

<svelte:head><title>Blog — Admin</title></svelte:head>

<div class="space-y-5">
	<div class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h2 class="h3">Blog</h2>
			<p class="opacity-70 text-sm">Kelola semua artikel — cari, filter, dan publish.</p>
		</div>
		<button class="btn preset-filled-primary-500" onclick={openCreate}>
			<i class="fa-solid fa-plus"></i>
			<span>Tulis Artikel</span>
		</button>
	</div>

	{#if error}
		<div class="card preset-tonal-error p-3 text-sm">{error}</div>
	{/if}

	<!-- Status tabs (WP-style) -->
	<div class="flex flex-wrap items-center gap-1 border-b border-surface-200-800 text-sm">
		{#each [
			{ key: 'all' as StatusFilter, label: 'Semua', n: counts.all },
			{ key: 'published' as StatusFilter, label: 'Published', n: counts.published },
			{ key: 'draft' as StatusFilter, label: 'Draft', n: counts.draft }
		] as t (t.key)}
			<button
				class="px-3 py-2 -mb-px border-b-2 transition-colors {status === t.key
					? 'border-primary-500 text-primary-500 font-medium'
					: 'border-transparent opacity-70 hover:opacity-100'}"
				onclick={() => (status = t.key)}
			>
				{t.label}
				<span class="badge preset-tonal text-[10px] ml-1 align-middle">{t.n}</span>
			</button>
		{/each}
	</div>

	<!-- Toolbar -->
	<div class="flex flex-wrap items-center gap-2">
		<div class="flex items-center gap-2">
			<select class="select" bind:value={bulkAction}>
				<option value="">Bulk action</option>
				<option value="publish">Publish</option>
				<option value="unpublish">Unpublish</option>
				<option value="delete">Hapus</option>
			</select>
			<button
				class="btn preset-tonal"
				disabled={!bulkAction || selected.size === 0}
				onclick={applyBulk}
			>
				Apply{selected.size ? ` (${selected.size})` : ''}
			</button>
		</div>

		<select class="select" bind:value={category}>
			<option value="all">Semua kategori</option>
			{#each categories as c (c)}
				<option value={c}>{c}</option>
			{/each}
		</select>

		<div class="ml-auto flex items-center gap-2">
			<input
				class="input w-64 max-w-full"
				type="search"
				placeholder="Cari judul, slug, tag..."
				bind:value={search}
			/>
		</div>
	</div>

	<!-- Table -->
	<div class="table-wrap card preset-filled-surface-100-900 border-surface-200-800 border-[1px] overflow-x-auto">
		<table class="table w-full text-sm">
			<thead>
				<tr>
					<th class="w-10">
						<input
							type="checkbox"
							class="checkbox"
							checked={allOnPageSelected}
							indeterminate={!allOnPageSelected && someOnPageSelected}
							onchange={toggleSelectAllOnPage}
							aria-label="Pilih semua di halaman ini"
						/>
					</th>
					<th class="w-16">Thumb</th>
					<th>
						<button class="inline-flex items-center gap-1 opacity-90 hover:opacity-100" onclick={() => setSort('title')}>
							Judul <i class="fa-solid {sortIndicator('title')} opacity-60"></i>
						</button>
					</th>
					<th class="hidden md:table-cell">
						<button class="inline-flex items-center gap-1 opacity-90 hover:opacity-100" onclick={() => setSort('category')}>
							Kategori <i class="fa-solid {sortIndicator('category')} opacity-60"></i>
						</button>
					</th>
					<th class="hidden lg:table-cell">Tags</th>
					<th class="w-28">Status</th>
					<th class="hidden md:table-cell w-32">
						<button class="inline-flex items-center gap-1 opacity-90 hover:opacity-100" onclick={() => setSort('created')}>
							Tanggal <i class="fa-solid {sortIndicator('created')} opacity-60"></i>
						</button>
					</th>
					<th class="w-48 text-right">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#if loading}
					<tr><td colspan="8" class="text-center py-8 opacity-60">Memuat...</td></tr>
				{:else if paged.length === 0}
					<tr>
						<td colspan="8" class="text-center py-10 opacity-60">
							{posts.length === 0
								? 'Belum ada artikel. Klik "Tulis Artikel" untuk mulai.'
								: 'Tidak ada artikel yang cocok dengan filter.'}
						</td>
					</tr>
				{:else}
					{#each paged as post (post.id)}
						{@const thumb = getPostThumbnailUrl(post)}
						{@const isSelected = selected.has(post.id)}
						{@const tags = tagList(post.tags)}
						<tr class="group transition-colors hover:bg-surface-200-800/40 {isSelected ? 'bg-primary-500/5' : ''}">
							<td>
								<input
									type="checkbox"
									class="checkbox"
									checked={isSelected}
									onchange={() => toggleSelect(post.id)}
									aria-label="Pilih {post.title}"
								/>
							</td>
							<td>
								<div class="size-12 rounded-md overflow-hidden bg-surface-200-800 flex items-center justify-center">
									{#if thumb}
										<img src={thumb} alt="" class="size-full object-cover" loading="lazy" />
									{:else}
										<span class="text-xs opacity-50">—</span>
									{/if}
								</div>
							</td>
							<td>
								<div class="space-y-1 min-w-0">
									<button
										class="text-sm font-medium text-left transition-colors hover:text-primary-500 truncate block max-w-[28rem] inline-flex items-center gap-1.5"
										onclick={() => openEdit(post)}
										title={post.title}
									>
										{#if post.pinned}
											<i class="fa-solid fa-thumbtack text-primary-500 text-xs" aria-label="Pinned" title="Pinned"></i>
										{/if}
										<span class="truncate">{post.title}</span>
									</button>
									<div class="text-xs opacity-60 truncate max-w-[28rem]">/{post.slug}</div>
									<div class="flex gap-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
										<button class="hover:text-primary-500" onclick={() => openEdit(post)}>Edit</button>
										<button
											class="hover:text-{post.published ? 'warning' : 'success'}-500"
											onclick={() => togglePublished(post)}
										>
											{post.published ? 'Unpublish' : 'Publish'}
										</button>
										<a
											class="hover:text-primary-500"
											href={`/blog/${post.slug}`}
											target="_blank"
											rel="noopener"
										>
											Lihat
										</a>
										<button class="hover:text-error-500" onclick={() => handleDelete(post.id)}>
											Hapus
										</button>
									</div>
								</div>
							</td>
							<td class="hidden md:table-cell">
								{#if post.category}
									<span class="badge preset-tonal">{post.category}</span>
								{:else}
									<span class="opacity-40">—</span>
								{/if}
							</td>
							<td class="hidden lg:table-cell">
								<div class="flex flex-wrap gap-1 max-w-[16rem]">
									{#each tags.slice(0, 3) as tag (tag)}
										<span class="badge preset-tonal-surface text-[10px]">#{tag}</span>
									{/each}
									{#if tags.length > 3}
										<span class="text-[10px] opacity-60">+{tags.length - 3}</span>
									{/if}
								</div>
							</td>
							<td>
								<span class="inline-flex items-center gap-1.5 text-xs">
									<span
										class="size-2 rounded-full {post.published ? 'bg-success-500' : 'bg-warning-500'}"
									></span>
									{post.published ? 'Published' : 'Draft'}
								</span>
							</td>
							<td class="hidden md:table-cell text-xs">
								<div>{formatDate(post.created)}</div>
								<div class="opacity-50">{formatTime(post.created)}</div>
							</td>
							<td class="text-right">
								<div class="inline-flex items-center gap-1">
									<button
										class="btn btn-sm preset-tonal-{post.pinned ? 'primary' : 'surface'}"
										onclick={() => togglePinned(post)}
										title={post.pinned ? 'Lepas pin' : 'Pin artikel'}
										aria-label={post.pinned ? 'Lepas pin' : 'Pin artikel'}
									>
										<i class="fa-solid fa-thumbtack {post.pinned ? '' : 'opacity-50'}"></i>
									</button>
									<button
										class="btn btn-sm preset-tonal-primary"
										onclick={() => openEdit(post)}
										title="Edit"
									>
										Edit
									</button>
									<button
										class="btn btn-sm preset-tonal-{post.published ? 'warning' : 'success'}"
										onclick={() => togglePublished(post)}
										title={post.published ? 'Unpublish' : 'Publish'}
									>
										{post.published ? 'Unpub' : 'Pub'}
									</button>
									<button
										class="btn btn-sm preset-tonal-error"
										onclick={() => handleDelete(post.id)}
										title="Hapus"
										aria-label="Hapus"
									>
										<i class="fa-solid fa-xmark"></i>
									</button>
								</div>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	<!-- Footer / Pagination -->
	{#if !loading && filtered.length > 0}
		<div class="flex flex-wrap items-center justify-between gap-3 text-sm">
			<div class="opacity-70">
				Menampilkan
				<strong>{(currentPage - 1) * pageSize + 1}</strong>–<strong
					>{Math.min(currentPage * pageSize, filtered.length)}</strong
				>
				dari <strong>{filtered.length}</strong> artikel
			</div>
			<div class="flex items-center gap-2">
				<label class="flex items-center gap-2">
					<span class="opacity-70">Per halaman</span>
					<select class="select select-sm" bind:value={pageSize}>
						<option value={10}>10</option>
						<option value={20}>20</option>
						<option value={50}>50</option>
					</select>
				</label>
				<div class="flex items-center gap-1">
					<button
						class="btn btn-sm preset-tonal"
						disabled={currentPage <= 1}
						onclick={() => (page = currentPage - 1)}
						aria-label="Halaman sebelumnya"
					>
						<i class="fa-solid fa-chevron-left"></i>
					</button>
					<span class="px-2">{currentPage} / {totalPages}</span>
					<button
						class="btn btn-sm preset-tonal"
						disabled={currentPage >= totalPages}
						onclick={() => (page = currentPage + 1)}
						aria-label="Halaman berikutnya"
					>
						<i class="fa-solid fa-chevron-right"></i>
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
