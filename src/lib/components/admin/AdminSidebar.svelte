<script lang="ts">
	import { page } from '$app/state';
	import logoLight from '$lib/assets/logo-drsmode-menu-light.svg';
	import logoDark from '$lib/assets/logo-drsmode-menu-dark.svg';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	const links = [
		{ href: '/admin', label: 'Dashboard', icon: 'fa-gauge-high' },
		{ href: '/admin/events', label: 'Jadwal', icon: 'fa-flag-checkered' },
		{ href: '/admin/blog', label: 'Blog', icon: 'fa-pen-to-square' },
		{ href: '/admin/ads', label: 'Iklan', icon: 'fa-rectangle-ad' },
		{ href: '/admin/users', label: 'Users', icon: 'fa-users' }
	];

	function isActive(href: string) {
		if (href === '/admin') return page.url.pathname === '/admin';
		return page.url.pathname.startsWith(href);
	}
</script>

<aside
	class="hidden md:flex flex-col w-60 shrink-0 min-h-screen backdrop-blur-md bg-white/70 dark:bg-slate-950/60 border-r border-slate-200/70 dark:border-white/10"
>
	<div class="p-5 border-b-[1px] border-surface-200-800">
		<a href="/" class="flex items-center gap-2" aria-label="DRSMODE.NET — Beranda">
			<img src={logoLight} alt="DRSMODE.NET" class="h-7 w-auto block dark:hidden" width="98" height="28" />
			<img src={logoDark} alt="" aria-hidden="true" class="h-7 w-auto hidden dark:block" width="98" height="28" />
			<span class="badge preset-tonal-primary text-xs">Admin</span>
		</a>
	</div>

	<nav class="flex-1 p-3 space-y-1">
		{#each links as link (link.href)}
			<a
				href={link.href}
				class="flex items-center gap-3 px-3 py-2 rounded-md transition {isActive(link.href)
					? 'preset-filled-primary-500'
					: 'hover:preset-tonal-surface'}"
			>
				<span class="w-5 text-center"><i class="fa-solid {link.icon}"></i></span>
				<span>{link.label}</span>
			</a>
		{/each}
	</nav>

	<div class="p-3 border-t-[1px] border-surface-200-800 space-y-2">
		<ThemeToggle />
		<a href="/" class="btn btn-sm preset-tonal w-full"><i class="fa-solid fa-arrow-left mr-1"></i> Kembali ke Site</a>
	</div>
</aside>
