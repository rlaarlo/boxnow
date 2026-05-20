/**
 * Reset a user's password.
 * Usage: bun --env-file=.env.local run scripts/reset-password.ts <email> <newPassword>
 *
 * Requires PB_URL, PB_SUPERUSER_EMAIL, PB_SUPERUSER_PASSWORD in env.
 */
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL!;
const SUPER_EMAIL = process.env.PB_SUPERUSER_EMAIL!;
const SUPER_PASSWORD = process.env.PB_SUPERUSER_PASSWORD!;

const targetEmail = process.argv[2];
const newPassword = process.argv[3];

if (!targetEmail || !newPassword) {
	console.error('❌ Usage: bun run scripts/reset-password.ts <email> <newPassword>');
	process.exit(1);
}

if (newPassword.length < 8) {
	console.error('❌ Password minimal 8 karakter.');
	process.exit(1);
}

const pb = new PocketBase(PB_URL);

await pb.collection('_superusers').authWithPassword(SUPER_EMAIL, SUPER_PASSWORD);
console.log('🔐 Authenticated as superuser');

const user = await pb.collection('users').getFirstListItem(`email="${targetEmail}"`);
console.log(`👤 Found user: ${user.email} (role: ${user.role ?? 'none'})`);

await pb.collection('users').update(user.id, {
	password: newPassword,
	passwordConfirm: newPassword
});

console.log(`✅ Password untuk ${user.email} berhasil direset.`);
console.log('   Sekarang login di /login dengan password baru.');
