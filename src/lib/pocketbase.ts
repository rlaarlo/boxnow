import PocketBase from 'pocketbase';
import { PUBLIC_PB_URL } from '$env/static/public';
import { browser } from '$app/environment';

export const pb = new PocketBase(PUBLIC_PB_URL);

// Persist auth in localStorage on browser (PocketBase SDK handles cookie too)
if (browser) {
	pb.authStore.onChange(() => {
		// trigger reactivity if needed; consumers should use the auth store
	});
}
