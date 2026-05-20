import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL!;
const EMAIL = process.env.PB_SUPERUSER_EMAIL!;
const PASSWORD = process.env.PB_SUPERUSER_PASSWORD!;

const pb = new PocketBase(PB_URL);
await pb.collection('_superusers').authWithPassword(EMAIL, PASSWORD);

const u = await pb.collections.getOne('users');
console.log('Before:', { listRule: u.listRule, viewRule: u.viewRule });
await pb.collections.update(u.id, { listRule: '', viewRule: '' });
console.log('✅ users list/view rules opened (public)');
