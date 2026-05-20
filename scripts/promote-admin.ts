/**
 * Promote a user to admin role.
 * Usage: bun --env-file=.env.local run scripts/promote-admin.ts <email>
 */
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL!;
const EMAIL = process.env.PB_SUPERUSER_EMAIL!;
const PASSWORD = process.env.PB_SUPERUSER_PASSWORD!;

const targetEmail = process.argv[2];
if (!targetEmail) {
	console.error('❌ Usage: bun run scripts/promote-admin.ts <email>');
	process.exit(1);
}

const pb = new PocketBase(PB_URL);

await pb.collection('_superusers').authWithPassword(EMAIL, PASSWORD);
console.log(`🔐 Authenticated as superuser`);

const user = await pb.collection('users').getFirstListItem(`email="${targetEmail}"`);
console.log(`👤 Found user: ${user.email} (current role: ${user.role ?? 'none'})`);

const updated = await pb.collection('users').update(user.id, { role: 'admin' });
console.log(`✅ Promoted ${updated.email} → role: ${updated.role}`);
