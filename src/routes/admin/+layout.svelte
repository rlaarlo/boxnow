<script lang="ts">
	import AdminSidebar from '$lib/components/admin/AdminSidebar.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	let { children } = $props();

	$effect(() => {
		if (!browser) return;
		if (!auth.isAuthenticated) {
			goto('/login?redirect=/admin');
		} else if (!auth.isAdmin) {
			goto('/');
		}
	});
</script>

<svelte:head>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

{#if auth.isAuthenticated && auth.isAdmin}
	<div class="flex min-h-screen bg-surface-50-950">
		<AdminSidebar />

		<div class="flex-1 flex flex-col">
			<header
				class="bg-surface-100-900 border-surface-200-800 border-b-[1px] px-6 py-3 flex items-center justify-between"
			>
				<h1 class="h4">Admin Panel</h1>
				<div class="flex items-center gap-3">
					<span class="text-sm opacity-70">{auth.user?.username ?? auth.user?.email}</span>
					<button
						class="btn btn-sm preset-tonal"
						onclick={() => {
							auth.logout();
							goto('/login');
						}}>Logout</button
					>
				</div>
			</header>

			<main class="flex-1 p-6">
				{@render children()}
			</main>
		</div>
	</div>
{:else}
	<div class="min-h-screen flex items-center justify-center">
		<p class="opacity-60">Memeriksa akses...</p>
	</div>
{/if}
