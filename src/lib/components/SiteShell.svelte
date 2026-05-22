<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import AdSlot from './AdSlot.svelte';
	import { env as publicEnv } from '$env/dynamic/public';
	import logoUrl from '$lib/assets/drsmode.png';

	let { children } = $props();

	const navLinks = [
		{ href: '/', label: 'Berita' },
		{ href: '/jadwal', label: 'Jadwal' },
		{ href: '/kategori', label: 'Kategori' }
	];

	function isActive(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}

	function handleLogout() {
		auth.logout();
		goto('/');
	}
</script>

<header class="bg-surface-100-900 border-surface-200-800 border-b-[1px] sticky top-0 z-40">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
		<a href="/" class="flex items-center gap-2" aria-label="DRSMODE.NET — Beranda">
			<img src={logoUrl} alt="DRSMODE.NET" class="h-7 sm:h-8 w-auto" width="98" height="28" />
			<span class="text-xs opacity-50 hidden sm:inline">Motorsport</span>
		</a>

		<nav class="flex items-center gap-1 sm:gap-2" aria-label="Utama">
			{#each navLinks as link (link.href)}
				<a
					href={link.href}
					class="btn btn-sm {isActive(link.href) ? 'preset-filled-primary-500' : 'preset-tonal'}"
					aria-current={isActive(link.href) ? 'page' : undefined}
				>
					{link.label}
				</a>
			{/each}

			<a
				href="/search"
				class="btn btn-sm {isActive('/search') ? 'preset-filled-primary-500' : 'preset-tonal'}"
				aria-label="Cari"
			>
				<span aria-hidden="true">🔍</span>
				<span class="hidden sm:inline ml-1">Cari</span>
			</a>

			{#if auth.isAuthenticated && auth.isAdmin}
				<a href="/admin" class="btn btn-sm preset-tonal-primary">Admin</a>
				<button class="btn btn-sm preset-tonal" onclick={handleLogout}>Logout</button>
			{/if}
		</nav>
	</div>
</header>

<main class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
	{@render children()}
</main>

<footer class="border-surface-200-800 border-t-[1px] mt-12">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-sm opacity-70 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
		<p>© {new Date().getFullYear()} DRSMODE.NET — Berita & Jadwal Motorsport.</p>
		<nav class="flex gap-3" aria-label="Footer">
			<a href="/" class="hover:opacity-100">Berita</a>
			<a href="/jadwal" class="hover:opacity-100">Jadwal</a>
			<a href="/sitemap.xml" class="hover:opacity-100">Sitemap</a>
		</nav>
	</div>
</footer>

<!-- Fixed ad rails di luar container (tepi viewport, hanya muncul jika ada ruang sisa) -->
<aside
	class="hidden 2xl:block fixed top-24 left-4 w-[160px] h-[600px] z-30 pointer-events-auto"
	aria-label="Iklan kiri"
>
	<AdSlot
		slot={publicEnv.PUBLIC_ADSENSE_SLOT_SIDEBAR ?? ''}
		format="auto"
		minHeight={600}
		class="h-full"
	/>
</aside>

<aside
	class="hidden 2xl:block fixed top-24 right-4 w-[160px] h-[600px] z-30 pointer-events-auto"
	aria-label="Iklan kanan"
>
	<AdSlot
		slot={publicEnv.PUBLIC_ADSENSE_SLOT_SIDEBAR ?? ''}
		format="auto"
		minHeight={600}
		class="h-full"
	/>
</aside>
