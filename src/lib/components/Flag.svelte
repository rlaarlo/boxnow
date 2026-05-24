<script lang="ts" module>
	const ALPHA3_TO_ALPHA2: Record<string, string> = {
		BRN: 'BH', SAU: 'SA', AUS: 'AU', JPN: 'JP', CHN: 'CN', USA: 'US', ITA: 'IT',
		MON: 'MC', CAN: 'CA', ESP: 'ES', AUT: 'AT', GBR: 'GB', HUN: 'HU', BEL: 'BE',
		NED: 'NL', AZE: 'AZ', SGP: 'SG', MEX: 'MX', BRA: 'BR', QAT: 'QA', UAE: 'AE',
		FRA: 'FR', GER: 'DE', DEU: 'DE', RUS: 'RU', POR: 'PT', PRT: 'PT', TUR: 'TR',
		ARG: 'AR', IND: 'IN', IDN: 'ID', MYS: 'MY', THA: 'TH', KOR: 'KR', PHL: 'PH'
	};

	export function toAlpha2(input?: string | null): string | null {
		if (!input) return null;
		const s = String(input).trim();
		if (!s) return null;
		if (/^[a-z]{2}$/i.test(s)) return s.toUpperCase();
		if (/^[a-z]{3}$/i.test(s)) return ALPHA3_TO_ALPHA2[s.toUpperCase()] ?? null;
		const cp1 = s.codePointAt(0);
		const cp2 = s.codePointAt(2);
		if (
			cp1 && cp2 &&
			cp1 >= 0x1f1e6 && cp1 <= 0x1f1ff &&
			cp2 >= 0x1f1e6 && cp2 <= 0x1f1ff
		) {
			return (
				String.fromCharCode(65 + (cp1 - 0x1f1e6)) +
				String.fromCharCode(65 + (cp2 - 0x1f1e6))
			);
		}
		return null;
	}
</script>

<script lang="ts">
	interface Props {
		code?: string | null;
		title?: string | null;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		rounded?: boolean;
		class?: string;
	}

	let {
		code,
		title = null,
		size = 'md',
		rounded = true,
		class: cls = ''
	}: Props = $props();

	const DIMS = {
		sm: { w: 20, h: 15, src: 'w40', srcset: 'w80' },
		md: { w: 32, h: 24, src: 'w80', srcset: 'w160' },
		lg: { w: 48, h: 36, src: 'w80', srcset: 'w160' },
		xl: { w: 72, h: 54, src: 'w160', srcset: 'w320' }
	} as const;

	const a2 = $derived(toAlpha2(code));
	const dim = $derived(DIMS[size]);
	const src = $derived(a2 ? `https://flagcdn.com/${dim.src}/${a2.toLowerCase()}.png` : '');
	const srcset = $derived(
		a2 ? `https://flagcdn.com/${dim.srcset}/${a2.toLowerCase()}.png 2x` : ''
	);
	const altText = $derived(title ?? (a2 ? `Bendera ${a2}` : ''));
</script>

{#if a2}
	<img
		{src}
		{srcset}
		width={dim.w}
		height={dim.h}
		alt={altText}
		title={title ?? undefined}
		loading="lazy"
		decoding="async"
		class="inline-block align-middle object-cover {rounded ? 'rounded-sm' : ''} {cls}"
		style="width: {dim.w}px; height: {dim.h}px;"
	/>
{:else}
	<span class="inline-block align-middle {cls}" aria-hidden="true"><i class="fa-solid fa-flag-checkered"></i></span>
{/if}
