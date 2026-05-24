<script lang="ts">
	import RichTextEditor from '$lib/components/admin/RichTextEditor.svelte';
	import { getPage, savePage } from '$lib/services/pages';

	type Tab = 'privacy' | 'dmca';

	const DEFAULTS: Record<Tab, string> = {
		privacy: `<h2>Kebijakan Privasi</h2><p>Edit konten kebijakan privasi di sini.</p>`,
		dmca: `<h2>DMCA & Hak Cipta</h2><p>Edit konten DMCA di sini.</p>`
	};

	let activeTab = $state<Tab>('privacy');
	let contents = $state<Record<Tab, string>>({ privacy: '', dmca: '' });
	let loading = $state(true);
	let saving = $state(false);
	let savedTab = $state<Tab | null>(null);
	let error = $state<string | null>(null);

	$effect(() => {
		loadAll();
	});

	async function loadAll() {
		loading = true;
		error = null;
		try {
			const [priv, dmca] = await Promise.all([getPage('privacy'), getPage('dmca')]);
			contents.privacy = priv?.content ?? DEFAULTS.privacy;
			contents.dmca = dmca?.content ?? DEFAULTS.dmca;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Gagal memuat halaman';
		} finally {
			loading = false;
		}
	}

	async function handleSave() {
		saving = true;
		error = null;
		try {
			await savePage(activeTab, contents[activeTab]);
			savedTab = activeTab;
			setTimeout(() => (savedTab = null), 2500);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Gagal menyimpan';
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head><title>Halaman Statis — Admin</title></svelte:head>

<div class="space-y-4 max-w-4xl">
	<div class="flex items-center justify-between gap-4">
		<div>
			<h2 class="h4">Halaman Statis</h2>
			<p class="text-sm opacity-60">Edit konten halaman Kebijakan Privasi dan DMCA.</p>
		</div>
		<button
			class="btn preset-filled-primary-500"
			disabled={saving || loading}
			onclick={handleSave}
		>
			{saving ? 'Menyimpan…' : 'Simpan'}
		</button>
	</div>

	{#if error}
		<div class="card preset-tonal-error p-3 text-sm">{error}</div>
	{/if}

	{#if savedTab}
		<div class="card preset-tonal-success p-3 text-sm">
			Halaman <strong>{savedTab}</strong> berhasil disimpan.
		</div>
	{/if}

	<!-- Tabs -->
	<div class="flex gap-2 border-b border-surface-200-800 pb-1">
		<button
			class="btn btn-sm {activeTab === 'privacy' ? 'preset-filled-primary-500' : 'preset-tonal border border-surface-300-700'}"
			onclick={() => (activeTab = 'privacy')}
		>
			Kebijakan Privasi
		</button>
		<button
			class="btn btn-sm {activeTab === 'dmca' ? 'preset-filled-primary-500' : 'preset-tonal border border-surface-300-700'}"
			onclick={() => (activeTab = 'dmca')}
		>
			DMCA
		</button>
	</div>

	{#if loading}
		<div class="text-sm opacity-60 py-10 text-center">Memuat konten…</div>
	{:else}
		{#key activeTab}
			<div class="card p-0 overflow-hidden">
				<RichTextEditor bind:value={contents[activeTab]} placeholder="Tulis konten halaman…" />
			</div>
		{/key}

		<p class="text-xs opacity-50">
			Pratinjau publik:
			<a href="/{activeTab}" target="_blank" class="anchor">/{activeTab}</a>
		</p>
	{/if}
</div>
