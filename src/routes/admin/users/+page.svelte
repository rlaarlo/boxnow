<script lang="ts">
	import type { UserRecord } from '$lib/types';
	import { listUsers, updateUserRole } from '$lib/services/admin';

	let users = $state<UserRecord[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let search = $state('');

	const filtered = $derived(
		users.filter(
			(u) =>
				u.username.toLowerCase().includes(search.toLowerCase()) ||
				u.email.toLowerCase().includes(search.toLowerCase())
		)
	);

	async function load() {
		loading = true;
		error = null;
		try {
			users = await listUsers();
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'Gagal memuat users';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		load();
	});

	async function toggleRole(u: UserRecord) {
		const newRole = u.role === 'admin' ? 'member' : 'admin';
		try {
			const updated = await updateUserRole(u.id, newRole);
			users = users.map((x) => (x.id === u.id ? updated : x));
		} catch (err: unknown) {
			alert(err instanceof Error ? err.message : 'Gagal update role');
		}
	}
</script>

<svelte:head><title>Users — Admin</title></svelte:head>

<div class="space-y-6">
	<div>
		<h2 class="h3">Users</h2>
		<p class="opacity-70 text-sm">Kelola member dan admin.</p>
	</div>

	{#if error}
		<div class="card preset-tonal-error p-3 text-sm">{error}</div>
	{/if}

	<input
		class="input w-full max-w-md"
		type="search"
		placeholder="Cari user..."
		bind:value={search}
	/>

	<div class="table-wrap card preset-filled-surface-100-900 border-surface-200-800 border-[1px]">
		<table class="table">
			<thead>
				<tr>
					<th>#</th>
					<th>Username</th>
					<th>Email</th>
					<th>Role</th>
					<th>Joined</th>
					<th class="text-right">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#if loading}
					<tr><td colspan="6" class="text-center py-6 opacity-60">Memuat...</td></tr>
				{:else}
					{#each filtered as u, i (u.id)}
						<tr>
							<td>{i + 1}</td>
							<td class="font-medium">{u.username || '—'}</td>
							<td class="opacity-80">{u.email}</td>
							<td>
								<span class="badge {u.role === 'admin' ? 'preset-filled-primary-500' : 'preset-tonal'}">
									{u.role ?? 'member'}
								</span>
							</td>
							<td class="text-xs opacity-60">
								{new Date(u.created).toLocaleDateString('id-ID')}
							</td>
							<td class="text-right">
								<button class="btn btn-sm preset-tonal-primary" onclick={() => toggleRole(u)}>
									Toggle Role
								</button>
							</td>
						</tr>
					{:else}
						<tr><td colspan="6" class="text-center py-6 opacity-60">Tidak ada user.</td></tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
