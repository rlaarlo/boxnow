import { json, error } from '@sveltejs/kit';
import PocketBase from 'pocketbase';
import { PUBLIC_PB_URL } from '$env/static/public';
import { rateLimit, getClientIp } from '$lib/server/rate-limit';
import type { RequestHandler } from './$types';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const ip = getClientIp(request.headers, getClientAddress());
	const limit = rateLimit(`login:${ip}`, MAX_ATTEMPTS, WINDOW_MS);
	if (!limit.ok) {
		return new Response(
			JSON.stringify({
				message: `Terlalu banyak percobaan login. Coba lagi dalam ${limit.retryAfter} detik.`
			}),
			{
				status: 429,
				headers: {
					'content-type': 'application/json',
					'retry-after': String(limit.retryAfter)
				}
			}
		);
	}

	let body: { email?: string; password?: string };
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Body harus JSON');
	}
	const email = (body.email ?? '').trim();
	const password = body.password ?? '';
	if (!email || !password) {
		throw error(400, 'Email dan password wajib diisi');
	}

	const server = new PocketBase(PUBLIC_PB_URL);
	try {
		const result = await server.collection('users').authWithPassword(email, password);
		return json({ token: result.token, record: result.record });
	} catch {
		return new Response(JSON.stringify({ message: 'Email atau password salah' }), {
			status: 401,
			headers: { 'content-type': 'application/json' }
		});
	}
};
