import { pb } from '$lib/pocketbase';
import type { UserRecord } from '$lib/types';

// Svelte 5 runes-based auth store using a class instance.
class AuthStore {
	user = $state<UserRecord | null>(null);
	loading = $state(false);

	constructor() {
		this.syncFromPb();
		pb.authStore.onChange(() => this.syncFromPb());
	}

	private syncFromPb() {
		const model = pb.authStore.record;
		this.user = model ? (model as unknown as UserRecord) : null;
	}

	get isAuthenticated() {
		return !!this.user;
	}

	get isAdmin() {
		return this.user?.role === 'admin';
	}

	async login(email: string, password: string) {
		this.loading = true;
		try {
			const res = await fetch('/api/login', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email, password })
			});
			if (!res.ok) {
				let message = 'Login gagal';
				try {
					const data = await res.json();
					if (typeof data?.message === 'string') message = data.message;
				} catch {
					// ignore parse error
				}
				throw new Error(message);
			}
			const { token, record } = (await res.json()) as {
				token: string;
				record: UserRecord & { collectionId: string; collectionName: string };
			};
			pb.authStore.save(token, record);
		} finally {
			this.loading = false;
		}
	}

	async register(email: string, password: string, username: string) {
		this.loading = true;
		try {
			await pb.collection('users').create({
				email,
				password,
				passwordConfirm: password,
				username,
				role: 'member'
			});
			await this.login(email, password);
		} finally {
			this.loading = false;
		}
	}

	logout() {
		pb.authStore.clear();
	}
}

export const auth = new AuthStore();
