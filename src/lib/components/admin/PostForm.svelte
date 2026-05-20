<script lang="ts">
	import RichTextEditor from '$lib/components/admin/RichTextEditor.svelte';
	import SeoChecklist from '$lib/components/admin/SeoChecklist.svelte';
	import PostPreview from '$lib/components/admin/PostPreview.svelte';
	import { slugify } from '$lib/services/admin';
	import { getPostThumbnailUrl } from '$lib/services/public';
	import type { PostRecord } from '$lib/types';

	export type PostInput = {
		title: string;
		slug: string;
		content: string;
		excerpt: string;
		category: string;
		tags: string;
		published: boolean;
		thumbnail?: File | null;
	};

	type Props = {
		open: boolean;
		post?: PostRecord | null;
		onclose: () => void;
		onsave: (data: PostInput, id?: string) => Promise<void>;
	};

	let { open = $bindable(), post, onclose, onsave }: Props = $props();

	let title = $state('');
	let slug = $state('');
	let content = $state('');
	let excerpt = $state('');
	let category = $state('');
	let tags = $state('');
	let published = $state(false);
	let thumbnail = $state<File | null>(null);
	let thumbnailPreview = $state<string | null>(null);
	let saving = $state(false);
	let error = $state<string | null>(null);
	let slugTouched = $state(false);
	let mode = $state<'edit' | 'preview'>('edit');

	$effect(() => {
		if (open) {
			title = post?.title ?? '';
			slug = post?.slug ?? '';
			content = post?.content ?? '';
			excerpt = post?.excerpt ?? '';
			category = post?.category ?? '';
			tags = post?.tags ?? '';
			published = post?.published ?? false;
			thumbnail = null;
			thumbnailPreview = null;
			slugTouched = !!post;
			error = null;
			mode = 'edit';
		}
	});

	$effect(() => {
		if (!thumbnail) {
			thumbnailPreview = null;
			return;
		}
		const url = URL.createObjectURL(thumbnail);
		thumbnailPreview = url;
		return () => URL.revokeObjectURL(url);
	});

	const existingThumbUrl = $derived(post ? getPostThumbnailUrl(post) : null);
	const previewThumb = $derived(thumbnailPreview ?? existingThumbUrl);
	const hasThumbnail = $derived(!!thumbnail || !!post?.thumbnail);

	function onTitleInput() {
		if (!slugTouched) slug = slugify(title);
	}

	function onFile(e: Event) {
		const input = e.target as HTMLInputElement;
		thumbnail = input.files?.[0] ?? null;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		saving = true;
		error = null;
		try {
			await onsave(
				{ title, slug, content, excerpt, category, tags, published, thumbnail },
				post?.id
			);
			open = false;
			onclose();
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'Gagal menyimpan artikel';
		} finally {
			saving = false;
		}
	}
</script>

{#if open}
	<div
		class="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto"
		onclick={onclose}
		onkeydown={(e) => e.key === 'Escape' && onclose()}
		role="presentation"
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<form
			class="card preset-filled-surface-100-900 border-surface-200-800 border-[1px] p-6 max-w-5xl w-full space-y-4 my-8"
			onclick={(e) => e.stopPropagation()}
			onsubmit={handleSubmit}
		>
			<header class="flex flex-wrap items-center justify-between gap-3">
				<h3 class="h4">{post ? 'Edit' : 'Tulis'} Artikel</h3>
				<div role="tablist" aria-label="Mode" class="inline-flex rounded-md border-[1px] border-surface-200-800 p-0.5 text-sm">
					<button
						type="button"
						role="tab"
						aria-selected={mode === 'edit'}
						onclick={() => (mode = 'edit')}
						class="px-3 py-1.5 rounded {mode === 'edit' ? 'bg-primary-500 text-white' : 'opacity-70 hover:opacity-100'}"
					>
						Edit
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={mode === 'preview'}
						onclick={() => (mode = 'preview')}
						class="px-3 py-1.5 rounded {mode === 'preview' ? 'bg-primary-500 text-white' : 'opacity-70 hover:opacity-100'}"
					>
						Preview
					</button>
				</div>
			</header>

			{#if error}
				<div class="card preset-tonal-error p-3 text-sm">{error}</div>
			{/if}

			{#if mode === 'preview'}
				<div class="rounded-lg border-[1px] border-surface-200-800 bg-surface-50-950 p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
					<PostPreview
						{title}
						{excerpt}
						{content}
						{category}
						{tags}
						thumbnailUrl={previewThumb}
					/>
				</div>
			{:else}
				<div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
					<div class="space-y-4 min-w-0">
						<label class="label">
							<span>Judul</span>
							<input class="input" required bind:value={title} oninput={onTitleInput} />
						</label>

						<label class="label">
							<span>Slug</span>
							<input
								class="input font-mono text-sm"
								required
								pattern="^[a-z0-9-]+$"
								bind:value={slug}
								oninput={() => (slugTouched = true)}
							/>
						</label>

						<label class="label">
							<span>Konten</span>
							<RichTextEditor bind:value={content} placeholder="Tulis konten artikel..." />
						</label>

						<label class="label">
							<span>Excerpt (ringkasan)</span>
							<textarea class="textarea" rows="2" maxlength="300" bind:value={excerpt}></textarea>
						</label>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
							<label class="label">
								<span>Kategori</span>
								<input class="input" bind:value={category} placeholder="Tutorial" />
							</label>
							<label class="label">
								<span>Tags (pisah koma)</span>
								<input class="input" bind:value={tags} placeholder="iptv,tutorial" />
							</label>
						</div>

						<label class="label">
							<span>Thumbnail</span>
							<input class="input" type="file" accept="image/*" onchange={onFile} />
							{#if previewThumb}
								<img
									src={previewThumb}
									alt="Preview thumbnail"
									class="mt-2 rounded-md max-h-40 object-cover"
								/>
							{/if}
						</label>

						<label class="flex items-center gap-2">
							<input type="checkbox" class="checkbox" bind:checked={published} />
							<span>Publish (terbitkan ke publik)</span>
						</label>
					</div>

					<aside class="space-y-3 lg:sticky lg:top-2 self-start">
						<SeoChecklist
							input={{
								title,
								slug,
								content,
								excerpt,
								category,
								tags,
								hasThumbnail
							}}
						/>
					</aside>
				</div>
			{/if}

			<div class="flex justify-end gap-2 pt-2 border-t-[1px] border-surface-200-800">
				<button type="button" class="btn preset-tonal" onclick={onclose} disabled={saving}>
					Batal
				</button>
				<button type="submit" class="btn preset-filled-primary-500" disabled={saving}>
					{saving ? 'Menyimpan...' : 'Simpan'}
				</button>
			</div>
		</form>
	</div>
{/if}
