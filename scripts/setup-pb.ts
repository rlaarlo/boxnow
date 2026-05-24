/**
 * Idempotent PocketBase schema setup script.
 *
 * Usage: bun run scripts/setup-pb.ts
 *
 * Reads PB_URL, PB_SUPERUSER_EMAIL, PB_SUPERUSER_PASSWORD from .env.local
 * Creates/updates collections: users (extra fields), posts, media, events
 * Sets API rules for each.
 */

import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL;
const EMAIL = process.env.PB_SUPERUSER_EMAIL;
const PASSWORD = process.env.PB_SUPERUSER_PASSWORD;

if (!PB_URL || !EMAIL || !PASSWORD) {
	console.error('❌ Missing env: PB_URL, PB_SUPERUSER_EMAIL, PB_SUPERUSER_PASSWORD');
	process.exit(1);
}

const pb = new PocketBase(PB_URL);

type Field = Record<string, unknown>;
type CollectionDef = {
	name: string;
	type: 'base' | 'auth';
	fields: Field[];
	indexes?: string[];
	listRule: string | null;
	viewRule: string | null;
	createRule: string | null;
	updateRule: string | null;
	deleteRule: string | null;
};

const postsDef: CollectionDef = {
	name: 'posts',
	type: 'base',
	fields: [
		{ name: 'title', type: 'text', required: true, max: 200 },
		{ name: 'slug', type: 'text', required: true, pattern: '^[a-z0-9-]+$' },
		{ name: 'content', type: 'editor', required: true },
		{ name: 'excerpt', type: 'text', max: 300 },
		{
			name: 'thumbnail',
			type: 'file',
			maxSelect: 1,
			mimeTypes: ['image/jpeg', 'image/png', 'image/webp']
		},
		{ name: 'category', type: 'text' },
		{ name: 'tags', type: 'text' },
		{ name: 'published', type: 'bool' },
		{ name: 'pinned', type: 'bool' },
		{ name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
		{ name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
	],
	indexes: ['CREATE UNIQUE INDEX idx_posts_slug ON posts (slug)'],
	listRule: 'published = true || @request.auth.role = "admin"',
	viewRule: 'published = true || @request.auth.role = "admin"',
	createRule: '@request.auth.role = "admin"',
	updateRule: '@request.auth.role = "admin"',
	deleteRule: '@request.auth.role = "admin"'
};

async function login() {
	console.log(`🔐 Authenticating as superuser at ${PB_URL}...`);
	await pb.collection('_superusers').authWithPassword(EMAIL!, PASSWORD!);
	console.log('✅ Authenticated');
}

async function getCollection(name: string) {
	try {
		return await pb.collections.getOne(name);
	} catch {
		return null;
	}
}

function fieldsByName(existing: Field[]): Map<string, Field> {
	const m = new Map<string, Field>();
	for (const f of existing) {
		const fname = f.name as string | undefined;
		if (fname) m.set(fname, f);
	}
	return m;
}

async function ensureCollection(def: CollectionDef): Promise<{ id: string; created: boolean }> {
	const existing = await getCollection(def.name);
	if (existing) {
		console.log(`ℹ️  Collection "${def.name}" exists (${existing.id})`);
		return { id: existing.id, created: false };
	}
	console.log(`➕ Creating collection "${def.name}"...`);
	const created = await pb.collections.create({
		name: def.name,
		type: def.type,
		fields: def.fields,
		listRule: def.listRule,
		viewRule: def.viewRule,
		createRule: def.createRule,
		updateRule: def.updateRule,
		deleteRule: def.deleteRule
	});
	if (def.indexes && def.indexes.length > 0) {
		try {
			await pb.collections.update(created.id, { indexes: def.indexes });
			console.log(`   ✅ indexes added`);
		} catch (e) {
			console.warn(`   ⚠️  could not add indexes:`, (e as Error).message);
		}
	}
	console.log(`✅ Created "${def.name}" (${created.id})`);
	return { id: created.id, created: true };
}

async function ensureFields(collectionName: string, fieldsToEnsure: Field[]) {
	const col = await pb.collections.getOne(collectionName);
	const existingFields = (col.fields ?? []) as Field[];
	const byName = fieldsByName(existingFields);

	const merged: Field[] = [...existingFields];
	let added = 0;
	let mutated = 0;
	for (const f of fieldsToEnsure) {
		const fname = f.name as string;
		if (!byName.has(fname)) {
			merged.push(f);
			added++;
			console.log(`   ➕ adding field "${fname}" to ${collectionName}`);
			continue;
		}
		// Merge new select option values into existing select fields.
		if (f.type === 'select' && Array.isArray((f as { values?: string[] }).values)) {
			const idx = merged.findIndex((m) => m.name === fname);
			const cur = merged[idx] as { values?: string[] };
			const want = (f as { values?: string[] }).values ?? [];
			const have = cur.values ?? [];
			const missing = want.filter((v) => !have.includes(v));
			if (missing.length) {
				merged[idx] = { ...merged[idx], values: [...have, ...missing] } as Field;
				mutated++;
				console.log(`   ✏️  extending "${fname}" with values: ${missing.join(', ')}`);
			}
		}
	}
	if (added > 0 || mutated > 0) {
		await pb.collections.update(col.id, { fields: merged });
		console.log(`✅ Updated ${collectionName} (+${added} field(s), ${mutated} option change(s))`);
	} else {
		console.log(`ℹ️  All required fields already exist on ${collectionName}`);
	}
}

async function updateRules(name: string, def: CollectionDef) {
	const col = await pb.collections.getOne(name);
	const needs =
		col.listRule !== def.listRule ||
		col.viewRule !== def.viewRule ||
		col.createRule !== def.createRule ||
		col.updateRule !== def.updateRule ||
		col.deleteRule !== def.deleteRule;
	if (!needs) {
		console.log(`ℹ️  Rules already up-to-date for ${name}`);
		return;
	}
	await pb.collections.update(col.id, {
		listRule: def.listRule,
		viewRule: def.viewRule,
		createRule: def.createRule,
		updateRule: def.updateRule,
		deleteRule: def.deleteRule
	});
	console.log(`✅ Updated API rules for ${name}`);
}

async function main() {
	await login();

	console.log('\n📦 Step 1: Ensure user fields (username, role, avatar)');
	const usersExtra: Field[] = [
		{ name: 'username', type: 'text', required: false, min: 3, max: 30 },
		{
			name: 'role',
			type: 'select',
			required: true,
			maxSelect: 1,
			values: ['member', 'admin']
		},
		{
			name: 'avatar',
			type: 'file',
			maxSelect: 1,
			mimeTypes: ['image/jpeg', 'image/png', 'image/webp']
		}
	];
	await ensureFields('users', usersExtra);

	const usersCol = await pb.collections.getOne('users');

	console.log('\n📦 Step 2: posts');
	const postsWithAuthor: CollectionDef = {
		...postsDef,
		fields: [
			...postsDef.fields,
			{
				name: 'author',
				type: 'relation',
				required: true,
				maxSelect: 1,
				collectionId: usersCol.id,
				cascadeDelete: false
			}
		]
	};
	await ensureCollection(postsWithAuthor);
	await ensureFields('posts', postsWithAuthor.fields);
	await updateRules('posts', postsWithAuthor);

	console.log('\n📦 Step 3: media');
	const mediaDef: CollectionDef = {
		name: 'media',
		type: 'base',
		fields: [
			{
				name: 'file',
				type: 'file',
				required: true,
				maxSelect: 1,
				maxSize: 5242880,
				mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
			},
			{
				name: 'uploaded_by',
				type: 'relation',
				required: false,
				maxSelect: 1,
				collectionId: usersCol.id,
				cascadeDelete: false
			}
		],
		listRule: '@request.auth.id != ""',
		viewRule: '',
		createRule: '@request.auth.role = "admin"',
		updateRule: '@request.auth.role = "admin"',
		deleteRule: '@request.auth.role = "admin"'
	};
	await ensureCollection(mediaDef);
	await ensureFields('media', mediaDef.fields);
	await updateRules('media', mediaDef);

	console.log('\n📦 Step 4: events');
	const eventsDef: CollectionDef = {
		name: 'events',
		type: 'base',
		fields: [
			{ name: 'title', type: 'text', required: true, max: 150 },
			{
				name: 'category',
				type: 'select',
				required: true,
				maxSelect: 1,
				values: ['f1', 'motogp', 'wsbk', 'wec', 'formulae', 'other']
			},
			{
				name: 'session',
				type: 'select',
				required: true,
				maxSelect: 1,
				values: ['practice', 'qualifying', 'sprint', 'race', 'other']
			},
			{ name: 'circuit', type: 'text', max: 100 },
			{ name: 'flag', type: 'text', max: 8 },
			{ name: 'starts_at', type: 'date', required: true },
			{ name: 'ends_at', type: 'date' },
			{ name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
			{ name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
		],
		indexes: ['CREATE INDEX idx_events_starts_at ON events (starts_at)'],
		listRule: '',
		viewRule: '',
		createRule: '@request.auth.role = "admin"',
		updateRule: '@request.auth.role = "admin"',
		deleteRule: '@request.auth.role = "admin"'
	};
	await ensureCollection(eventsDef);
	await ensureFields('events', eventsDef.fields);
	await updateRules('events', eventsDef);

	console.log('\n📦 Step 5: ads');
	const adsDef: CollectionDef = {
		name: 'ads',
		type: 'base',
		fields: [
			{ name: 'name', type: 'text', required: true, max: 150 },
			{
				name: 'placement',
				type: 'select',
				required: true,
				maxSelect: 1,
				values: ['header', 'sidebar', 'in-article', 'between-posts', 'home-hero', 'footer']
			},
			{
				name: 'provider',
				type: 'select',
				required: true,
				maxSelect: 1,
				values: ['adsense', 'custom']
			},
			{ name: 'adsense_slot', type: 'text', max: 64 },
			{ name: 'custom_html', type: 'editor' },
			{ name: 'active', type: 'bool' },
			{ name: 'weight', type: 'number' },
			{ name: 'starts_at', type: 'date' },
			{ name: 'ends_at', type: 'date' },
			{ name: 'notes', type: 'text', max: 300 },
			{ name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
			{ name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
		],
		indexes: ['CREATE INDEX idx_ads_placement_active ON ads (placement, active)'],
		listRule: 'active = true || @request.auth.role = "admin"',
		viewRule: 'active = true || @request.auth.role = "admin"',
		createRule: '@request.auth.role = "admin"',
		updateRule: '@request.auth.role = "admin"',
		deleteRule: '@request.auth.role = "admin"'
	};
	await ensureCollection(adsDef);
	await ensureFields('ads', adsDef.fields);
	await updateRules('ads', adsDef);

	console.log('\n🎉 Done!');
}

main().catch((err) => {
	console.error('❌ Setup failed:', err);
	if (err?.response) console.error('Response:', JSON.stringify(err.response, null, 2));
	process.exit(1);
});
