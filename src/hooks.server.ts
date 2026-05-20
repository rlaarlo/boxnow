import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';

export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event, {
		transformPageChunk: ({ html }) => {
			const client = env.PUBLIC_ADSENSE_CLIENT ?? '';
			// Kalau client kosong, hapus seluruh tag script AdSense untuk hindari 400
			if (!client) {
				return html.replace(
					/<!-- Google AdSense -->[\s\S]*?<\/script>/,
					'<!-- AdSense disabled -->'
				);
			}
			return html.replace('%ADSENSE_CLIENT%', client);
		}
	});
};
