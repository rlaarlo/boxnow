# AI Agent Instructions — Boxnow Web

## Project Context

Boxnow adalah portal blog motorsport berbahasa Indonesia dengan fokus utama pada SEO, jadwal race weekend, dan pengalaman mobile-friendly.

Tech stack utama:

- SvelteKit
- Svelte 5
- TypeScript
- Tailwind CSS v4
- Skeleton UI
- PocketBase
- Vite

Target produk:

- Blog motorsport untuk Formula 1, MotoGP, WEC, Formula E, dan seri terkait
- Halaman jadwal balap yang cepat, ringan, dan mudah ditemukan lewat search engine
- CMS admin internal untuk mengelola artikel, event, dan user
- SEO-first publishing platform tanpa WordPress

## Agent Behavior

Saat mengerjakan project ini, agent AI harus:

- Membaca struktur kode dan pola yang sudah ada sebelum mengubah file
- Mengutamakan perubahan kecil, fokus, dan konsisten dengan style existing
- Tidak melakukan refactor besar kecuali diminta
- Tidak menghapus atau mengganti perubahan yang tidak dibuat sendiri
- Menjaga performa, SEO, dan aksesibilitas sebagai prioritas utama
- Menggunakan TypeScript dengan tipe yang jelas
- Menghindari dependency baru kecuali benar-benar perlu
- Mengutamakan solusi sederhana dan maintainable

## Product Priorities

Urutan prioritas fitur dan peningkatan:

1. SEO publik
   - Meta title dan description unik per halaman
   - Canonical URL benar
   - Open Graph dan Twitter card lengkap
   - JSON-LD untuk article, breadcrumb, website, dan sports event
   - Sitemap dan robots tetap valid

2. Konten blog
   - Artikel published tampil di halaman publik
   - Detail artikel punya struktur heading yang baik
   - Related posts berdasarkan kategori/tag
   - Breadcrumb visual
   - Share button tanpa script eksternal
   - Pagination SEO-friendly

3. Jadwal motorsport
   - Jadwal per seri jelas dan mobile-friendly
   - Countdown sesi/event
   - Status live, upcoming, soon, dan ended
   - Filter jadwal berdasarkan seri/status
   - Dukungan arsip musim sebelumnya
   - Potensi fitur `.ics` calendar reminder

4. Admin CMS
   - CRUD artikel
   - CRUD event jadwal
   - Manajemen user admin/member
   - Preview artikel sebelum publish
   - Checklist SEO di form artikel
   - Validasi slug dan data wajib

5. Production readiness
   - Batasi atau hapus registrasi publik bila tidak dibutuhkan
   - Rate-limit login admin
   - Backup PocketBase harian
   - Analytics dan Search Console
   - Monitoring uptime

## Coding Guidelines

- Gunakan pola SvelteKit yang sudah ada di project
- Gunakan `$lib` imports untuk module internal
- Simpan logic reusable di `src/lib/services`, `src/lib/components`, atau helper terkait
- Jangan menaruh business logic besar langsung di markup komponen
- Untuk halaman publik, perhatikan SSR dan SEO
- Untuk data PocketBase, gunakan service layer bila memungkinkan
- Jangan menggunakan `any` kecuali benar-benar tidak bisa dihindari
- Jangan menambahkan komentar yang menjelaskan hal obvious

## Frontend Guidelines

- UI harus terasa seperti portal informasi motorsport, bukan landing page marketing
- Prioritaskan layout yang mudah discan, cepat, dan nyaman di mobile
- Gunakan card hanya untuk item berulang, bukan membungkus seluruh section
- Pastikan text tidak overlap di mobile
- Hindari warna yang terlalu satu nada
- Gunakan komponen yang sudah ada sebelum membuat komponen baru
- Jangan menambahkan teks instruksi berlebihan di UI

## SEO Requirements

Setiap halaman publik idealnya memiliki:

- `<title>` unik
- meta description unik
- canonical URL
- Open Graph tags
- Twitter card
- JSON-LD bila relevan
- heading hierarchy yang masuk akal
- internal link ke halaman terkait

Halaman admin, login, dan register harus `noindex`.

## Security Notes

- Jangan membuka endpoint admin tanpa validasi role
- Jangan membuat registrasi publik untuk admin kecuali diminta eksplisit
- Jangan expose token, credential, atau secret di client
- Jangan menyimpan secret di source code
- Validasi input form admin
- Hati-hati dengan HTML dari rich text editor

## Suggested Backlog

Fitur yang sebaiknya diprioritaskan:

- Related posts di artikel
- Breadcrumb component reusable
- Search `?q=`
- Pagination artikel
- Halaman kategori dan tag
- Calendar reminder `.ics` untuk jadwal balap
- SEO checklist di admin post form
- Preview artikel
- Scheduled publish
- Analytics integration
- Search Console setup
- Backup script untuk PocketBase
- Rate-limit login admin

## Validation

Sebelum menyelesaikan task, jalankan validasi yang relevan:

```bash
bun