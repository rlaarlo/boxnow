/**
 * Seed blog posts (F1 & MotoGP).
 * Usage: bun --env-file=.env.local run scripts/seed-posts.ts
 */
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL!;
const EMAIL = process.env.PB_SUPERUSER_EMAIL!;
const PASSWORD = process.env.PB_SUPERUSER_PASSWORD!;

const pb = new PocketBase(PB_URL);
await pb.collection('_superusers').authWithPassword(EMAIL, PASSWORD);
console.log('🔐 Authenticated');

// Pick first admin user as author
const admin = await pb
	.collection('users')
	.getFirstListItem('role="admin"')
	.catch(() => null);
if (!admin) {
	console.error('❌ No admin user found. Promote one first.');
	process.exit(1);
}
console.log(`👤 Author: ${admin.email}`);

type PostSeed = {
	title: string;
	slug: string;
	excerpt: string;
	category: string;
	tags: string;
	content: string;
};

const posts: PostSeed[] = [
	{
		title: 'Panduan Lengkap Formula 1 2026: Era Baru Mesin Hybrid',
		slug: 'panduan-formula-1-2026',
		excerpt:
			'Regulasi baru F1 2026 membawa perubahan besar pada mesin hybrid, aerodinamika aktif, dan sustainable fuel. Apa saja yang perlu kamu tahu?',
		category: 'Formula 1',
		tags: 'f1,formula1,2026,hybrid,regulasi',
		content: `
<h2>Era Baru Formula 1 dimulai di Musim 2026</h2>
<p>Tahun 2026 menandai salah satu perubahan regulasi paling drastis dalam sejarah modern <strong>Formula 1</strong>. Mesin hybrid baru, mobil yang lebih ringan, dan bahan bakar 100% berkelanjutan menjadi fokus utama.</p>

<h3>1. Mesin Hybrid Baru</h3>
<p>Power unit 1.6L V6 turbo masih dipertahankan, namun proporsi tenaga listrik melonjak drastis:</p>
<ul>
  <li><strong>~50% tenaga listrik</strong> dari sebelumnya hanya ~20%</li>
  <li>Komponen MGU-H dihapus untuk menyederhanakan teknologi</li>
  <li>MGU-K kini bisa menghasilkan hingga 350 kW</li>
</ul>

<h3>2. Aerodinamika Aktif</h3>
<p>Untuk pertama kalinya, F1 memperkenalkan <em>active aerodynamics</em> dengan dua mode utama:</p>
<ul>
  <li><strong>Z-Mode</strong> — downforce maksimum di tikungan</li>
  <li><strong>X-Mode</strong> — drag minimum di trek lurus</li>
</ul>

<h3>3. Sustainable Fuel</h3>
<p>Semua tim wajib menggunakan bahan bakar 100% berkelanjutan yang diproduksi dari biomassa, limbah kota, atau hasil sintesis karbon.</p>

<h3>Tim & Pembalap</h3>
<p>Dengan masuknya <strong>Audi</strong> menggantikan Sauber dan kembalinya <strong>Cadillac</strong> sebagai tim ke-11, persaingan akan lebih sengit dari sebelumnya.</p>

<blockquote>
  <p>"2026 akan menjadi titik balik. Tim yang paling cepat beradaptasi akan mendominasi 5 tahun ke depan." — Pundit F1</p>
</blockquote>

<h3>Kalender 2026</h3>
<p>24 balapan tersebar di 5 benua, dengan kembalinya <strong>Madrid Grand Prix</strong> dan tetapnya tradisi seperti Monaco, Monza, dan Suzuka.</p>

<p>Saksikan setiap balapan F1 langsung di <strong>Boxnow IPTV</strong> dengan kualitas HD dan komunitas penggemar yang aktif!</p>
`.trim()
	},
	{
		title: 'Sprint Race F1: Format, Aturan, dan Strategi yang Harus Diketahui',
		slug: 'sprint-race-f1-panduan',
		excerpt:
			'Format Sprint Race telah menjadi bagian penting dari akhir pekan F1. Bagaimana cara kerjanya dan apa pengaruhnya bagi tim?',
		category: 'Formula 1',
		tags: 'f1,sprint,race,strategi',
		content: `
<h2>Apa Itu Sprint Race?</h2>
<p>Sprint Race adalah balapan pendek (~100 km) yang berlangsung di hari Sabtu pada beberapa Grand Prix terpilih. Format ini diperkenalkan sejak 2021 dan terus disempurnakan.</p>

<h3>Format Akhir Pekan Sprint</h3>
<ul>
  <li><strong>Jumat</strong> — Practice 1 + Sprint Qualifying</li>
  <li><strong>Sabtu</strong> — Sprint Race + Qualifying GP</li>
  <li><strong>Minggu</strong> — Grand Prix utama</li>
</ul>

<h3>Sistem Poin Sprint</h3>
<p>Hanya 8 pembalap teratas yang mendapatkan poin:</p>
<ol>
  <li>P1 — 8 poin</li>
  <li>P2 — 7 poin</li>
  <li>P3 — 6 poin</li>
  <li>P4 — 5 poin</li>
  <li>P5 — 4 poin</li>
  <li>P6 — 3 poin</li>
  <li>P7 — 2 poin</li>
  <li>P8 — 1 poin</li>
</ol>

<h3>Strategi Tim</h3>
<p>Tantangan utama Sprint Race adalah <strong>parc fermé</strong> setelah Sprint Qualifying — setup mobil tidak bisa diubah signifikan. Tim harus menemukan kompromi setup untuk Sprint sekaligus GP utama.</p>

<p>Sirkuit yang biasanya menggelar Sprint: <em>Spa, Austin, Brasil, Qatar, Miami, China</em>.</p>
`.trim()
	},
	{
		title: 'Persaingan Pembalap F1 2026: Verstappen vs Generasi Baru',
		slug: 'persaingan-pembalap-f1-2026',
		excerpt:
			'Max Verstappen menghadapi tantangan dari nama-nama muda seperti Oscar Piastri, Andrea Kimi Antonelli, dan Lando Norris. Siapa yang akan menjadi juara?',
		category: 'Formula 1',
		tags: 'verstappen,piastri,norris,antonelli,championship',
		content: `
<h2>Kontestan Gelar Juara Dunia 2026</h2>
<p>Musim 2026 akan menjadi panggung perebutan gelar paling menarik dalam dekade terakhir. Berikut nama-nama yang patut diperhatikan:</p>

<h3>Max Verstappen — Sang Juara Bertahan</h3>
<p>Empat gelar berturut-turut membuat Verstappen dianggap sebagai favorit. Namun perubahan regulasi besar bisa mengubah peta kekuatan secara drastis.</p>

<h3>Lando Norris</h3>
<p>Setelah penampilan konsisten McLaren, Norris siap menjadi penantang serius. Kombinasi kecepatan dan kematangan strateginya patut diwaspadai.</p>

<h3>Oscar Piastri</h3>
<p>Pembalap muda Australia ini terus berkembang. Konsistensinya bahkan melampaui rekan setimnya di beberapa balapan musim sebelumnya.</p>

<h3>Andrea Kimi Antonelli</h3>
<p>Bintang muda Mercedes ini menjalani musim sophomore yang krusial. Banyak yang membandingkannya dengan Lewis Hamilton di awal kariernya.</p>

<h3>Charles Leclerc & Lewis Hamilton</h3>
<p>Duo Ferrari ini membawa beban besar — mengakhiri puasa gelar Tifosi yang sudah lebih dari satu dekade.</p>

<blockquote>
  <p>"Tidak ada favorit absolut di 2026. Mobil baru bisa membuat siapa saja jadi juara." — Pundit F1</p>
</blockquote>
`.trim()
	},
	{
		title: 'MotoGP 2026: Bagnaia, Martin, dan Era Baru Aprilia',
		slug: 'motogp-2026-preview',
		excerpt:
			'Musim MotoGP 2026 menjanjikan persaingan sengit antara Ducati, Aprilia, dan KTM. Berikut preview lengkapnya.',
		category: 'MotoGP',
		tags: 'motogp,2026,bagnaia,martin,aprilia,ducati',
		content: `
<h2>Preview MotoGP 2026</h2>
<p>Setelah dominasi Ducati selama beberapa musim, kompetisi MotoGP semakin terbuka. Aprilia, KTM, dan bahkan Yamaha menunjukkan progres signifikan.</p>

<h3>Pecco Bagnaia — Misi Mengembalikan Mahkota</h3>
<p>Setelah kehilangan gelar di musim sebelumnya, Bagnaia datang dengan motivasi tinggi. Ducati GP26 dilaporkan jauh lebih lincah di tikungan lambat.</p>

<h3>Jorge Martin — Juara Bertahan</h3>
<p>Pindah ke Aprilia membawa Martin pada tantangan baru. Adaptasinya pada RS-GP akan menjadi kunci pertahanan gelar.</p>

<h3>Marc Márquez & Álex Márquez</h3>
<p>Duo bersaudara di tim Ducati pabrikan menjadi cerita paling menarik musim ini. Pengalaman Marc + agresivitas Álex = kombinasi mematikan.</p>

<h3>Pedro Acosta — Bintang Muda KTM</h3>
<p>"The Shark" terus menunjukkan bakat luar biasa. Banyak yang yakin gelar pertamanya hanya soal waktu.</p>

<h3>Format Sprint Race</h3>
<p>Sprint Sabtu tetap menjadi bagian penting kalender MotoGP. Setiap akhir pekan kini menawarkan dua kali poin penuh — strategi tim semakin kompleks.</p>

<p>Saksikan setiap putaran MotoGP 2026 di <strong>Boxnow IPTV</strong>!</p>
`.trim()
	},
	{
		title: 'Memahami Aerodinamika MotoGP: Sayap, Spoiler, dan Ride Height Device',
		slug: 'aerodinamika-motogp',
		excerpt:
			'Teknologi aero MotoGP semakin kompleks. Apa fungsi sayap depan, ground effect, dan ride height device pada motor balap modern?',
		category: 'MotoGP',
		tags: 'motogp,teknologi,aerodinamika,winglet',
		content: `
<h2>Revolusi Aerodinamika di MotoGP</h2>
<p>Selama satu dekade terakhir, motor MotoGP berubah drastis. Bukan hanya soal mesin — sayap, fairing kompleks, dan perangkat ride height membuat motor modern terlihat seperti pesawat tempur mini.</p>

<h3>1. Front Winglet</h3>
<p>Sayap depan yang dipopulerkan Ducati sejak 2016 berfungsi:</p>
<ul>
  <li>Menambah <strong>downforce</strong> di kecepatan tinggi</li>
  <li>Mengurangi <em>wheelie</em> saat akselerasi</li>
  <li>Stabilitas pengereman lebih baik</li>
</ul>

<h3>2. Ground Effect Fairing</h3>
<p>Bagian bawah fairing didesain untuk menciptakan area bertekanan rendah, mirip mobil F1. Ducati lagi-lagi pelopor teknologi ini.</p>

<h3>3. Ride Height Device</h3>
<p>Perangkat hidrolik yang menurunkan suspensi belakang pada momen-momen tertentu:</p>
<ul>
  <li><strong>Holeshot device</strong> — start lebih cepat dengan menahan motor di posisi rendah</li>
  <li><strong>Front lowering device</strong> — sudah dilarang sejak 2023</li>
  <li><strong>Rear ride height</strong> — masih diizinkan, dipakai saat akselerasi</li>
</ul>

<h3>4. Spoiler Belakang</h3>
<p>Diperkenalkan baru-baru ini, spoiler belakang membantu pendinginan ban dan menambah downforce di sektor cepat.</p>

<blockquote>
  <p>"MotoGP modern adalah balap teknologi sebanyak balap pembalap." — Engineer MotoGP</p>
</blockquote>
`.trim()
	},
	{
		title: 'Sirkuit Legendaris MotoGP: Dari Mugello hingga Phillip Island',
		slug: 'sirkuit-legendaris-motogp',
		excerpt:
			'Setiap sirkuit MotoGP punya karakter unik. Mari kenali lima sirkuit legendaris yang paling dicintai pembalap dan penggemar.',
		category: 'MotoGP',
		tags: 'motogp,sirkuit,mugello,phillipisland,assen',
		content: `
<h2>5 Sirkuit Legendaris MotoGP</h2>

<h3>1. Mugello (Italia)</h3>
<p>Trek lurus 1.1 km dengan elevasi dramatis menjadikan Mugello favorit penggemar. Tikungan <em>Arrabbiata</em> dan <em>Casanova-Savelli</em> selalu menyajikan duel sengit.</p>

<h3>2. Phillip Island (Australia)</h3>
<p>Pemandangan laut, angin kencang, dan tikungan cepat membuat Phillip Island disebut sebagai sirkuit "rider's circuit". Tikungan <strong>Lukey Heights</strong> dan <strong>Siberia</strong> ikonik.</p>

<h3>3. Assen (Belanda)</h3>
<p>Dijuluki "<em>The Cathedral of Speed</em>", Assen adalah satu-satunya sirkuit yang masuk kalender sejak musim pertama MotoGP (1949). Cuaca yang berubah-ubah selalu menambah drama.</p>

<h3>4. Mandalika (Indonesia)</h3>
<p>Sirkuit baru kebanggaan Indonesia ini menawarkan pemandangan pantai memukau. Dukungan penonton lokal yang luar biasa menjadi atmosfer tersendiri.</p>

<h3>5. Sepang (Malaysia)</h3>
<p>Sirkuit modern dengan kombinasi tikungan cepat dan lambat. Cuaca tropis yang panas + hujan tiba-tiba menjadi tantangan tersendiri.</p>

<p>Sirkuit mana favoritmu? Diskusikan bersama komunitas <strong>Boxnow</strong>!</p>
`.trim()
	}
];

// ----- Run -----

let created = 0;
let skipped = 0;
for (const seed of posts) {
	const exists = await pb
		.collection('posts')
		.getFirstListItem(`slug="${seed.slug}"`)
		.catch(() => null);
	if (exists) {
		console.log(`⏭️  Skip "${seed.slug}" (already exists)`);
		skipped++;
		continue;
	}
	const fd = new FormData();
	fd.set('title', seed.title);
	fd.set('slug', seed.slug);
	fd.set('content', seed.content);
	fd.set('excerpt', seed.excerpt);
	fd.set('category', seed.category);
	fd.set('tags', seed.tags);
	fd.set('published', 'true');
	fd.set('author', admin.id);
	await pb.collection('posts').create(fd);
	console.log(`✅ Created "${seed.title}"`);
	created++;
}

console.log(`\n🎉 Done. Created: ${created}, Skipped: ${skipped}`);
