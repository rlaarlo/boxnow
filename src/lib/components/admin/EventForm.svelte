<script lang="ts">
	import type { EventRecord } from '$lib/types';
	import type { EventInput } from '$lib/services/events';

	type Props = {
		open: boolean;
		event?: EventRecord | null;
		onclose: () => void;
		onsave: (data: EventInput, id?: string) => Promise<void>;
	};

	let { open = $bindable(), event, onclose, onsave }: Props = $props();

	let title = $state('');
	let category = $state<EventRecord['category']>('f1');
	let session = $state<EventRecord['session']>('race');
	let circuit = $state('');
	let flag = $state('');
	let starts_at = $state(''); // datetime-local string
	let ends_at = $state('');
	let saving = $state(false);
	let error = $state<string | null>(null);

	// Convert ISO string → datetime-local "YYYY-MM-DDTHH:mm" in local time
	function isoToLocal(iso?: string): string {
		if (!iso) return '';
		const d = new Date(iso);
		const pad = (n: number) => n.toString().padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	}

	function localToIso(local: string): string {
		if (!local) return '';
		return new Date(local).toISOString();
	}

	$effect(() => {
		if (open) {
			title = event?.title ?? '';
			category = event?.category ?? 'f1';
			session = event?.session ?? 'race';
			circuit = event?.circuit ?? '';
			flag = event?.flag ?? '';
			starts_at = isoToLocal(event?.starts_at);
			ends_at = isoToLocal(event?.ends_at);
			error = null;
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		saving = true;
		error = null;
		try {
			const data: EventInput = {
				title,
				category,
				session,
				circuit: circuit || undefined,
				flag: flag || undefined,
				starts_at: localToIso(starts_at),
				ends_at: ends_at ? localToIso(ends_at) : undefined
			};
			await onsave(data, event?.id);
			open = false;
			onclose();
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'Gagal menyimpan';
		} finally {
			saving = false;
		}
	}
</script>

{#if open}
	<div
		class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
		onclick={onclose}
		onkeydown={(e) => e.key === 'Escape' && onclose()}
		role="presentation"
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<form
			class="card preset-filled-surface-100-900 border-surface-200-800 border-[1px] p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto"
			onclick={(e) => e.stopPropagation()}
			onsubmit={handleSubmit}
		>
			<h3 class="h4">{event ? 'Edit' : 'Tambah'} Event</h3>

			{#if error}
				<div class="card preset-tonal-error p-3 text-sm">{error}</div>
			{/if}

			<label class="label">
				<span>Judul</span>
				<input
					class="input"
					required
					bind:value={title}
					placeholder="F1 Monaco GP — Race"
				/>
			</label>

			<div class="grid grid-cols-2 gap-3">
				<label class="label">
					<span>Kategori</span>
					<select class="select" bind:value={category}>
						<option value="f1">Formula 1</option>
						<option value="motogp">MotoGP</option>
						<option value="wsbk">WSBK</option>
						<option value="wec">WEC</option>
						<option value="formulae">Formula E</option>
						<option value="other">Lainnya</option>
					</select>
				</label>
				<label class="label">
					<span>Sesi</span>
					<select class="select" bind:value={session}>
						<option value="practice">Practice</option>
						<option value="qualifying">Qualifying</option>
						<option value="sprint">Sprint</option>
						<option value="race">Race</option>
						<option value="other">Lainnya</option>
					</select>
				</label>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<label class="label">
					<span>Sirkuit / Lokasi</span>
					<input class="input" bind:value={circuit} placeholder="Monaco" />
				</label>
				<label class="label">
					<span>Bendera (emoji)</span>
					<input class="input" bind:value={flag} placeholder="🇲🇨" maxlength="8" />
				</label>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<label class="label">
					<span>Mulai</span>
					<input class="input" type="datetime-local" required bind:value={starts_at} />
				</label>
				<label class="label">
					<span>Selesai (opsional)</span>
					<input class="input" type="datetime-local" bind:value={ends_at} />
				</label>
			</div>

			<div class="flex justify-end gap-2 pt-2">
				<button type="button" class="btn preset-tonal" onclick={onclose} disabled={saving}>
					Batal
				</button>
				<button type="submit" class="btn preset-filled-primary-500" disabled={saving}>
					{saving ? 'Menyimpan…' : 'Simpan'}
				</button>
			</div>
		</form>
	</div>
{/if}
