import { pb } from '$lib/pocketbase';
import type { AdRecord, AdPlacement, AdProvider } from '$lib/types';

export type AdInput = {
	name: string;
	placement: AdPlacement;
	provider: AdProvider;
	adsense_slot?: string;
	custom_html?: string;
	active: boolean;
	weight: number;
	starts_at?: string;
	ends_at?: string;
	notes?: string;
};

export const AD_PLACEMENTS: { value: AdPlacement; label: string }[] = [
	{ value: 'header', label: 'Header' },
	{ value: 'sidebar', label: 'Sidebar' },
	{ value: 'in-article', label: 'In-Article' },
	{ value: 'between-posts', label: 'Antar Post (Listing)' },
	{ value: 'home-hero', label: 'Home Hero' },
	{ value: 'footer', label: 'Footer' }
];

export const AD_PROVIDERS: { value: AdProvider; label: string }[] = [
	{ value: 'adsense', label: 'Google AdSense' },
	{ value: 'custom', label: 'Custom HTML' }
];

export async function listAds(): Promise<AdRecord[]> {
	return await pb.collection('ads').getFullList<AdRecord>({ sort: '-created' });
}

export async function getAd(id: string): Promise<AdRecord> {
	return await pb.collection('ads').getOne<AdRecord>(id);
}

export async function createAd(data: AdInput): Promise<AdRecord> {
	return await pb.collection('ads').create<AdRecord>(data);
}

export async function updateAd(id: string, data: AdInput): Promise<AdRecord> {
	return await pb.collection('ads').update<AdRecord>(id, data);
}

export async function toggleAdActive(id: string, active: boolean): Promise<AdRecord> {
	return await pb.collection('ads').update<AdRecord>(id, { active });
}

export async function deleteAd(id: string): Promise<boolean> {
	return await pb.collection('ads').delete(id);
}

export async function listActiveAdsByPlacement(placement: AdPlacement): Promise<AdRecord[]> {
	const nowIso = new Date().toISOString().replace('T', ' ');
	const filter = [
		`active = true`,
		`placement = "${placement}"`,
		`(starts_at = "" || starts_at <= "${nowIso}")`,
		`(ends_at = "" || ends_at >= "${nowIso}")`
	].join(' && ');
	try {
		return await pb.collection('ads').getFullList<AdRecord>({ filter, sort: '-weight,-created' });
	} catch {
		return [];
	}
}
