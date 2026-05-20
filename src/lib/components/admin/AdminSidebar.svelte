<script lang="ts">
	import { page } from '$app/state';

	const links = [
		{ href: '/admin', label: 'Dashboard', icon: '◫' },
		{ href: '/admin/events', label: 'Jadwal', icon: '🏁' },
		{ href: '/admin/blog', label: 'Blog', icon: '✎' },
		{ href: '/admin/users', label: 'Users', icon: '☺' }
	];

	function isActive(href: string) {
		if (href === '/admin') return page.url.pathname === '/admin';
		return page.url.pathname.startsWith(href);
	}
</script>

<aside
	class="bg-surface-100-900 border-surface-200-800 hidden md:flex flex-col w-60 shrink-0 border-r-[1px] min-h-screen"
>
	<div class="p-5 border-b-[1px] border-surface-200-800">
		<a href="/" class="flex items-center gap-2">
			<span class="text-xl font-bold">Boxnow</span>
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
				<span class="w-5 text-center">{link.icon}</span>
				<span>{link.label}</span>
			</a>
		{/each}
	</nav>

	<div class="p-3 border-t-[1px] border-surface-200-800">
		<a href="/" class="btn btn-sm preset-tonal w-full">← Kembali ke Site</a>
	</div>
</aside>
