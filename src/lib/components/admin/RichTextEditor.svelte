<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
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

	onMount(() => {
		editor = new Editor({
			element,
			extensions: [
				StarterKit.configure({
					heading: { levels: [2, 3, 4] }
				}),
				Link.configure({ openOnClick: false, HTMLAttributes: { class: 'anchor' } }),
				Image.configure({ HTMLAttributes: { class: 'rounded-md max-w-full h-auto' } }),
				Placeholder.configure({ placeholder })
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
</script>

<div class="border-surface-200-800 border-[1px] rounded-md overflow-hidden bg-surface-50-950">
	{#if editor}
		<div class="flex flex-wrap gap-1 p-2 border-b-[1px] border-surface-200-800 bg-surface-100-900">
			<button type="button" class="btn btn-sm {isActive('bold')}" onclick={() => editor?.chain().focus().toggleBold().run()}>
				<strong>B</strong>
			</button>
			<button type="button" class="btn btn-sm {isActive('italic')}" onclick={() => editor?.chain().focus().toggleItalic().run()}>
				<em>I</em>
			</button>
			<button type="button" class="btn btn-sm {isActive('strike')}" onclick={() => editor?.chain().focus().toggleStrike().run()}>
				<s>S</s>
			</button>
			<span class="w-px bg-surface-200-800 mx-1"></span>
			<button type="button" class="btn btn-sm {isActive('heading', { level: 2 })}" onclick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
			<button type="button" class="btn btn-sm {isActive('heading', { level: 3 })}" onclick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
			<button type="button" class="btn btn-sm {isActive('paragraph')}" onclick={() => editor?.chain().focus().setParagraph().run()}>P</button>
			<span class="w-px bg-surface-200-800 mx-1"></span>
			<button type="button" class="btn btn-sm {isActive('bulletList')}" onclick={() => editor?.chain().focus().toggleBulletList().run()}>• List</button>
			<button type="button" class="btn btn-sm {isActive('orderedList')}" onclick={() => editor?.chain().focus().toggleOrderedList().run()}>1. List</button>
			<button type="button" class="btn btn-sm {isActive('blockquote')}" onclick={() => editor?.chain().focus().toggleBlockquote().run()}>"</button>
			<button type="button" class="btn btn-sm {isActive('codeBlock')}" onclick={() => editor?.chain().focus().toggleCodeBlock().run()}>{'</>'}</button>
			<span class="w-px bg-surface-200-800 mx-1"></span>
			<button type="button" class="btn btn-sm {isActive('link')}" onclick={setLink}>🔗</button>
			<button type="button" class="btn btn-sm preset-tonal" title="Insert image by URL" onclick={insertImageByUrl}>🖼️ URL</button>
			<button type="button" class="btn btn-sm preset-tonal" title="Upload image" disabled={uploading} onclick={() => fileInput.click()}>
				{uploading ? '⏳' : '📤'} Upload
			</button>
			<input bind:this={fileInput} type="file" accept="image/*" class="hidden" onchange={handleFileChange} />
			<span class="w-px bg-surface-200-800 mx-1"></span>
			<button type="button" class="btn btn-sm preset-tonal" onclick={() => editor?.chain().focus().undo().run()}>↶</button>
			<button type="button" class="btn btn-sm preset-tonal" onclick={() => editor?.chain().focus().redo().run()}>↷</button>
		</div>
	{/if}
	<div bind:this={element}></div>
</div>
