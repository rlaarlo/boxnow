type Bucket = { hits: number; resetAt: number };

const store = new Map<string, Bucket>();

export type RateLimitResult = {
	ok: boolean;
	remaining: number;
	retryAfter: number;
};

export function rateLimit(
	key: string,
	limit: number,
	windowMs: number
): RateLimitResult {
	const now = Date.now();
	const bucket = store.get(key);
	if (!bucket || bucket.resetAt <= now) {
		store.set(key, { hits: 1, resetAt: now + windowMs });
		return { ok: true, remaining: limit - 1, retryAfter: 0 };
	}
	bucket.hits += 1;
	if (bucket.hits > limit) {
		return { ok: false, remaining: 0, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
	}
	return { ok: true, remaining: limit - bucket.hits, retryAfter: 0 };
}

export function getClientIp(headers: Headers, fallback = 'unknown'): string {
	const xff = headers.get('x-forwarded-for');
	if (xff) return xff.split(',')[0].trim();
	const real = headers.get('x-real-ip');
	if (real) return real.trim();
	return fallback;
}
