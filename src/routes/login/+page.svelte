<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let error = $state<string | null>(null);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = null;
		try {
			await auth.login(email, password);
			const redirect = new URL(window.location.href).searchParams.get('redirect') || '/';
			goto(redirect);
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'Login gagal';
		}
	}
</script>

<svelte:head><title>Login — DRSMODE.NET</title></svelte:head>

<div class="min-h-screen flex items-center justify-center p-6">
	<form
		class="card preset-filled-surface-100-900 border-surface-200-800 border-[1px] p-8 max-w-md w-full space-y-4"
		onsubmit={handleSubmit}
	>
		<div class="text-center">
			<h1 class="h2">Masuk</h1>
			<p class="opacity-70 text-sm">ke akun DRSMODE.NET kamu</p>
		</div>

		{#if error}
			<div class="card preset-tonal-error p-3 text-sm">{error}</div>
		{/if}

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
				bind:value={password}
				autocomplete="current-password"
			/>
		</label>

		<button type="submit" class="btn preset-filled-primary-500 w-full" disabled={auth.loading}>
			{auth.loading ? 'Memproses...' : 'Login'}
		</button>

		<p class="text-center text-sm opacity-70">
			Belum punya akun? <a href="/register" class="anchor">Daftar</a>
		</p>
	</form>
</div>
