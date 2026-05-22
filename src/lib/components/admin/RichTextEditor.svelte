<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor, Node, mergeAttributes } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Link from '@tiptap/extension-link';
	import Placeholder from '@tiptap/extension-placeholder';
	import Image from '@tiptap/extension-image';
	import { uploadMedia } from '$lib/services/admin';
	import { auth } from '$lib/stores/auth.svelte';

	type Props = {
		value: string;
		placeholder?: string;
		onchange?: (html: string) => void;
	};

	let { value = $bindable(''), placeholder = 'Tulis artikel di sini...', onchange }: Props = $props();

	let element: HTMLDivElement;
	let editor: Editor | undefined = $state();

	// Custom iframe node for video embeds (YouTube / Vimeo / generic https iframe)
	const IframeEmbed = Node.create({
		name: 'iframeEmbed',
		group: 'block',
		atom: true,
		selectable: true,
		draggable: true,
		addAttributes() {
			return {
				src: { default: null },
				title: { default: 'Embedded video' },
				allow: {
					default:
						'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
				},
				allowfullscreen: { default: true },
				frameborder: { default: '0' }
			};
		},
		parseHTML() {
			return [{ tag: 'iframe[src]' }];
		},
		renderHTML({ HTMLAttributes }) {
			return [
				'div',
				{ class: 'relative w-full aspect-video my-4 rounded-md overflow-hidden bg-black' },
				[
					'iframe',
					mergeAttributes(HTMLAttributes, {
						class: 'absolute inset-0 w-full h-full',
						loading: 'lazy',
						referrerpolicy: 'strict-origin-when-cross-origin'
					})
				]
			];
		}
	});

	onMount(() => {
		editor = new Editor({
			element,
			extensions: [
				StarterKit.configure({
					heading: { levels: [2, 3, 4] }
				}),
				Link.configure({ openOnClick: false, HTMLAttributes: { class: 'anchor' } }),
				Image.configure({ HTMLAttributes: { class: 'rounded-md max-w-full h-auto' } }),
				Placeholder.configure({ placeholder }),
				IframeEmbed
			],
			content: value,
			onUpdate: ({ editor }) => {
				value = editor.getHTML();
				onchange?.(value);
			},
			editorProps: {
				attributes: {
					class:
						'prose prose-invert max-w-none min-h-60 px-4 py-3 focus:outline-none [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)] [&_p.is-editor-empty:first-child]:before:opacity-50 [&_p.is-editor-empty:first-child]:before:float-left [&_p.is-editor-empty:first-child]:before:pointer-events-none'
				}
			}
		});
	});

	onDestroy(() => {
		editor?.destroy();
	});

	// External value updates (e.g., when editing different post)
	$effect(() => {
		if (editor && value !== editor.getHTML()) {
			editor.commands.setContent(value || '', { emitUpdate: false });
		}
	});

	function setLink() {
		const prev = editor?.getAttributes('link').href as string | undefined;
		const url = window.prompt('URL', prev ?? 'https://');
		if (url === null) return;
		if (url === '') {
			editor?.chain().focus().unsetLink().run();
			return;
		}
		editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
	}

	function insertImageByUrl() {
		const url = window.prompt('Image URL', 'https://');
		if (!url) return;
		editor?.chain().focus().setImage({ src: url }).run();
	}

	function toEmbedUrl(input: string): string | null {
		const url = input.trim();
		if (!url) return null;
		try {
			const u = new URL(url);
			const host = u.hostname.replace(/^www\./, '');
			// YouTube
			if (host === 'youtu.be') {
				const id = u.pathname.slice(1).split('/')[0];
				return id ? `https://www.youtube.com/embed/${id}` : null;
			}
			if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
				if (u.pathname.startsWith('/embed/')) return url;
				if (u.pathname === '/watch') {
					const id = u.searchParams.get('v');
					return id ? `https://www.youtube.com/embed/${id}` : null;
				}
				if (u.pathname.startsWith('/shorts/')) {
					const id = u.pathname.split('/')[2];
					return id ? `https://www.youtube.com/embed/${id}` : null;
				}
			}
			// Vimeo
			if (host.endsWith('vimeo.com')) {
				if (host.startsWith('player.')) return url;
				const id = u.pathname.split('/').filter(Boolean)[0];
				return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
			}
			// Generic — only allow https iframe sources
			if (u.protocol === 'https:') return url;
			return null;
		} catch {
			return null;
		}
	}

	function embedVideo() {
		const url = window.prompt('URL video (YouTube, Vimeo, atau embed https)', 'https://');
		if (!url) return;
		const src = toEmbedUrl(url);
		if (!src) {
			window.alert('URL tidak dikenali. Gunakan link YouTube, Vimeo, atau URL embed https.');
			return;
		}
		editor?.chain().focus().insertContent({ type: 'iframeEmbed', attrs: { src } }).run();
	}

	let showHtmlDialog = $state(false);
	let htmlInput = $state('');

	function openHtmlDialog() {
		htmlInput = '';
		showHtmlDialog = true;
	}

	function insertRawHtml() {
		const html = htmlInput.trim();
		if (!html) {
			showHtmlDialog = false;
			return;
		}
		editor
			?.chain()
			.focus()
			.insertContent(html, { parseOptions: { preserveWhitespace: 'full' } })
			.run();
		showHtmlDialog = false;
	}

	let fileInput: HTMLInputElement;
	let uploading = $state(false);

	async function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		try {
			uploading = true;
			const url = await uploadMedia(file, auth.user?.id);
			editor?.chain().focus().setImage({ src: url, alt: file.name }).run();
		} catch (err) {
			console.error(err);
			window.alert('Gagal upload gambar: ' + (err as Error).message);
		} finally {
			uploading = false;
			input.value = '';
		}
	}

	const isActive = (name: string, attrs?: Record<string, unknown>) =>
		editor?.isActive(name, attrs) ? 'preset-filled-primary-500' : 'preset-tonal';

	let mode: 'visual' | 'html' = $state('visual');
	let htmlSource = $state('');

	function toggleMode() {
		if (mode === 'visual') {
			htmlSource = editor?.getHTML() ?? value ?? '';
			mode = 'html';
		} else {
			value = htmlSource;
			editor?.commands.setContent(htmlSource || '', { emitUpdate: false });
			onchange?.(htmlSource);
			mode = 'visual';
		}
	}

	function onHtmlInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		htmlSource = target.value;
		value = htmlSource;
		onchange?.(htmlSource);
	}
</script>

<div class="border-surface-200-800 border-[1px] rounded-md overflow-hidden bg-surface-50-950">
	{#if editor}
		<div class="flex flex-wrap items-center gap-1 p-2 border-b-[1px] border-surface-200-800 bg-surface-100-900">
			<fieldset class="contents" disabled={mode === 'html'} class:opacity-40={mode === 'html'}>
			<button type="button" title="Bold (Ctrl+B)" aria-label="Bold" class="btn btn-sm {isActive('bold')}" onclick={() => editor?.chain().focus().toggleBold().run()}>
				<strong>B</strong>
			</button>
			<button type="button" title="Italic (Ctrl+I)" aria-label="Italic" class="btn btn-sm {isActive('italic')}" onclick={() => editor?.chain().focus().toggleItalic().run()}>
				<em>I</em>
			</button>
			<button type="button" title="Strikethrough" aria-label="Strikethrough" class="btn btn-sm {isActive('strike')}" onclick={() => editor?.chain().focus().toggleStrike().run()}>
				<s>S</s>
			</button>
			<span class="w-px bg-surface-200-800 mx-1"></span>
			<button type="button" title="Heading 2" aria-label="Heading 2" class="btn btn-sm {isActive('heading', { level: 2 })}" onclick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
			<button type="button" title="Heading 3" aria-label="Heading 3" class="btn btn-sm {isActive('heading', { level: 3 })}" onclick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
			<button type="button" title="Paragraf" aria-label="Paragraf" class="btn btn-sm {isActive('paragraph')}" onclick={() => editor?.chain().focus().setParagraph().run()}>P</button>
			<span class="w-px bg-surface-200-800 mx-1"></span>
			<button type="button" title="Bullet list" aria-label="Bullet list" class="btn btn-sm {isActive('bulletList')}" onclick={() => editor?.chain().focus().toggleBulletList().run()}>• List</button>
			<button type="button" title="Numbered list" aria-label="Numbered list" class="btn btn-sm {isActive('orderedList')}" onclick={() => editor?.chain().focus().toggleOrderedList().run()}>1. List</button>
			<button type="button" title="Blockquote" aria-label="Blockquote" class="btn btn-sm {isActive('blockquote')}" onclick={() => editor?.chain().focus().toggleBlockquote().run()}>"</button>
			<button type="button" title="Code block" aria-label="Code block" class="btn btn-sm {isActive('codeBlock')}" onclick={() => editor?.chain().focus().toggleCodeBlock().run()}>{'</>'}</button>
			<span class="w-px bg-surface-200-800 mx-1"></span>
			<button type="button" title="Sisipkan / edit link" aria-label="Link" class="btn btn-sm {isActive('link')}" onclick={setLink}>🔗</button>
			<button type="button" title="Sisipkan gambar dari URL" aria-label="Gambar dari URL" class="btn btn-sm preset-tonal" onclick={insertImageByUrl}>🖼️ URL</button>
			<button type="button" title="Upload gambar dari komputer" aria-label="Upload gambar" class="btn btn-sm preset-tonal" disabled={uploading} onclick={() => fileInput.click()}>
				{uploading ? '⏳' : '📤'} Upload
			</button>
			<button type="button" title="Embed video YouTube / Vimeo" aria-label="Embed video" class="btn btn-sm preset-tonal" onclick={embedVideo}>🎬 Video</button>
			<button type="button" title="Sisipkan HTML mentah (iframe, embed, dll)" aria-label="Insert HTML" class="btn btn-sm preset-tonal" onclick={openHtmlDialog}>{'<>'} HTML</button>
			<input bind:this={fileInput} type="file" accept="image/*" class="hidden" onchange={handleFileChange} />
			<span class="w-px bg-surface-200-800 mx-1"></span>
			<button type="button" title="Undo (Ctrl+Z)" aria-label="Undo" class="btn btn-sm preset-tonal" onclick={() => editor?.chain().focus().undo().run()}>↶</button>
			<button type="button" title="Redo (Ctrl+Y)" aria-label="Redo" class="btn btn-sm preset-tonal" onclick={() => editor?.chain().focus().redo().run()}>↷</button>
			</fieldset>
			<span class="flex-1"></span>
			<button
				type="button"
				title={mode === 'visual' ? 'Edit sebagai HTML source' : 'Kembali ke mode visual'}
				aria-label="Toggle mode HTML"
				aria-pressed={mode === 'html'}
				class="btn btn-sm {mode === 'html' ? 'preset-filled-primary-500' : 'preset-tonal'}"
				onclick={toggleMode}
			>
				{mode === 'visual' ? '⟨/⟩ HTML' : '👁 Visual'}
			</button>
		</div>
	{/if}
	<div bind:this={element} class:hidden={mode === 'html'}></div>
	{#if mode === 'html'}
		<textarea
			value={htmlSource}
			oninput={onHtmlInput}
			spellcheck="false"
			placeholder="<p>HTML source...</p>"
			class="w-full min-h-60 px-4 py-3 font-mono text-sm bg-surface-50-950 focus:outline-none resize-y"
			rows="20"
		></textarea>
	{/if}
</div>

{#if showHtmlDialog}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
		role="dialog"
		aria-modal="true"
		aria-label="Sisipkan HTML"
	>
		<div class="w-full max-w-2xl rounded-lg bg-surface-50-950 border border-surface-200-800 shadow-xl">
			<div class="flex items-center justify-between px-4 py-3 border-b border-surface-200-800">
				<h3 class="text-base font-semibold">Sisipkan HTML</h3>
				<button type="button" class="btn btn-sm preset-tonal" onclick={() => (showHtmlDialog = false)} aria-label="Tutup">✕</button>
			</div>
			<div class="p-4 space-y-2">
				<p class="text-xs opacity-70">
					Tempel HTML mentah (iframe embed, tabel, dsb). Tag yang tidak didukung skema editor akan diabaikan otomatis.
				</p>
				<textarea
					bind:value={htmlInput}
					rows="10"
					spellcheck="false"
					placeholder={'<iframe src="https://..."></iframe>'}
					class="w-full font-mono text-sm rounded-md border border-surface-200-800 bg-surface-100-900 p-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
				></textarea>
			</div>
			<div class="flex justify-end gap-2 px-4 py-3 border-t border-surface-200-800">
				<button type="button" class="btn btn-sm preset-tonal" onclick={() => (showHtmlDialog = false)}>Batal</button>
				<button type="button" class="btn btn-sm preset-filled-primary-500" onclick={insertRawHtml}>Sisipkan</button>
			</div>
		</div>
	</div>
{/if}
