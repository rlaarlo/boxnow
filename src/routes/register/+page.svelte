<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';

	let email = $state('');
	let username = $state('');
	let password = $state('');
	let passwordConfirm = $state('');
	let error = $state<string | null>(null);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = null;
		if (password !== passwordConfirm) {
			error = 'Password tidak cocok';
			return;
		}
		try {
			await auth.register(email, password, username);
			goto('/');
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'Registrasi gagal';
		}
	}
</script>

<svelte:head><title>Register — DRSMODE.NET</title></svelte:head>

<div class="min-h-screen flex items-center justify-center p-6">
	<form
		class="card preset-filled-surface-100-900 border-surface-200-800 border-[1px] p-8 max-w-md w-full space-y-4"
		onsubmit={handleSubmit}
	>
		<div class="text-center">
			<h1 class="h2">Daftar</h1>
			<p class="opacity-70 text-sm">Buat akun baru</p>
		</div>

		{#if error}
			<div class="card preset-tonal-error p-3 text-sm">{error}</div>
		{/if}

		<label class="label">
			<span>Username</span>
			<input class="input" required minlength="3" bind:value={username} />
		</label>

		<label class="label">
			<span>Email</span>
			<input class="input" type="email" required bind:value={email} autocomplete="email" />
		</label>

		<label class="label">
			<span>Password</span>
			<input
				class="input"
				type="password"
				required
				minlength="8"
				bind:value={password}
				autocomplete="new-password"
			/>
		</label>

		<label class="label">
			<span>Konfirmasi Password</span>
			<input
				class="input"
				type="password"
				required
				minlength="8"
				bind:value={passwordConfirm}
				autocomplete="new-password"
			/>
		</label>

		<button type="submit" class="btn preset-filled-primary-500 w-full" disabled={auth.loading}>
			{auth.loading ? 'Memproses...' : 'Daftar'}
		</button>

		<p class="text-center text-sm opacity-70">
			Sudah punya akun? <a href="/login" class="anchor">Login</a>
		</p>
	</form>
</div>
