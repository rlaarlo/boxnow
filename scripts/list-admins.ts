import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL!;
const EMAIL = process.env.PB_SUPERUSER_EMAIL!;
const PASSWORD = process.env.PB_SUPERUSER_PASSWORD!;

const pb = new PocketBase(PB_URL);
await pb.collection('_superusers').authWithPassword(EMAIL, PASSWORD);

const superusers = await pb.collection('_superusers').getFullList();
console.log('\n=== Superusers ===');
for (const s of superusers) console.log(`- ${s.email} (id: ${s.id})`);

const admins = await pb.collection('users').getFullList({ filter: 'role = "admin"' });
console.log('\n=== Users with role=admin ===');
if (admins.length === 0) console.log('(none)');
for (const u of admins) console.log(`- ${u.email} | name: ${u.name ?? '-'} | id: ${u.id}`);
