# Product Requirements Document (PRD)
## Boxnow — Blog Motorsport dengan Fokus SEO

**Versi:** 2.0
**Tanggal:** Mei 2026
**Status:** Aktif
**Pengganti dari:** PRD v1.0 (Platform IPTV Komunitas) — *dibatalkan*

---

## 1. Ringkasan Eksekutif

**Boxnow** adalah portal blog motorsport berbahasa Indonesia yang menyajikan **berita, analisis, dan jadwal lengkap race weekend** untuk Formula 1, MotoGP, WEC, dan Formula E. Tujuan utama platform adalah **mendatangkan trafik organik dari mesin pencari (SEO)** dan menjadi sumber referensi jadwal balap yang cepat, ringan, dan mobile-friendly.

Monetisasi awal melalui ad slot (mis. Google AdSense / direct ad) yang sudah disiapkan di layout.

---

## 2. Tujuan Produk

- **SEO-first**: setiap halaman (home, kategori, artikel, jadwal seri) memiliki meta tag, Open Graph, canonical, dan JSON-LD yang valid
- Menyediakan **jadwal race weekend** lengkap (FP/Q/Sprint/Race) dengan countdown waktu lokal pengguna
- Menjadi **publisher** artikel berita & analisis motorsport via admin CMS sendiri (tanpa WordPress)
- **Page speed tinggi**: SSR + cache friendly, asset minimal, tanpa JS framework berat untuk halaman publik
- Siap untuk **monetisasi iklan** (ad slot di header/sidebar/in-article)

### Non-goals (eksplisit dikecualikan)
- ❌ Streaming IPTV / video player
- ❌ Live chat real-time
- ❌ Forum / komunitas user-generated content
- ❌ Komentar publik di artikel (fase awal)

---

## 3. Target Pengguna

| Segmen | Deskripsi | Kebutuhan utama |
|---|---|---|
| **Pembaca (Guest)** | Pengunjung organik dari Google / sosmed | Baca artikel & cek jadwal, tanpa perlu login |
| **Editor / Author** | Penulis konten yang login admin | Tulis & publish artikel, kelola jadwal |
| **Admin** | Owner platform | Kelola user, konten, dan jadwal event |

> Pembaca **tidak perlu membuat akun**. Login hanya untuk staf editorial.

---

## 4. Spesifikasi Teknis

### 4.1 Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend & SSR | SvelteKit 2 + Svelte 5 (runes) |
| Styling | Tailwind CSS v4 + Skeleton v4 |
| Editor konten | Tiptap (StarterKit + Image + Link + Placeholder) |
| Backend & DB | PocketBase (SQLite) |
| Adapter deploy | `@sveltejs/adapter-node` |
| Runtime | Bun (dev) / Node (prod) |
| Reverse Proxy | Nginx |
| CDN / Cache / WAF | Cloudflare (Free) |
| Sumber data jadwal | OpenF1, MotoGP API, TheSportsDB, series-specific |

### 4.2 Arsitektur

```
                   Cloudflare (CDN + cache HTML + DDoS)
                                 │
                          Nginx (reverse proxy)
                                 │
              ┌──────────────────┴──────────────────┐
              │                                     │
        SvelteKit (Node)                     PocketBase
        - SSR halaman publik                 - /api/collections
        - API server routes                  - Auth admin
        - Sitemap / robots                   - File storage
              │                                     │
              └────────────── SDK ──────────────────┘
                                 │
                              SQLite
```

### 4.3 Prinsip Performa & SEO

- **SSR by default** untuk semua halaman publik agar mesin pencari mendapat HTML siap render
- **Cache-Control** header agresif untuk halaman list (mis. `s-maxage=300, stale-while-revalidate=600`)
- Gambar di-serve melalui PocketBase + Cloudflare cache; thumbnail di-resize lewat parameter PB
- Tidak ada client-side router blocking untuk halaman publik

---

## 5. Fitur Produk

### 5.1 Modul Blog (Inti) `P0`

**FR-01: Halaman Home (`/`)**
- Hero/featured post terbaru
- Grid artikel terbaru (paginated, default 12 per halaman)
- Section "Jadwal terdekat" (cuplikan 3-5 event berikutnya lintas seri)
- Ad slot: 1 di atas grid, 1 di bawah

**FR-02: Daftar Artikel & Kategori**
- Filter via kategori: `f1`, `motogp`, `wsbk`, `wec`, `formulae`, `other`
- URL pola: `/?category=motogp` (query) — kategori sebagai filter, bukan path terpisah (fase 1)
- Pagination berbasis cursor / page number, SEO-friendly (`?page=2` + `rel=next/prev`)

**FR-03: Detail Artikel (`/blog/[slug]`)**
- Konten rich-text hasil Tiptap (HTML aman, tanpa script injeksi)
- Metadata: judul, excerpt, kategori, tags, author, tanggal publish & update
- Thumbnail sebagai OG image
- Breadcrumb: Home › Kategori › Judul
- Ad slot: in-article (setelah paragraf pertama) + di bawah artikel
- Tombol share (copy link, Twitter/X, WhatsApp, Facebook) — tanpa script eksternal berat
- Related posts (3 artikel kategori sama)

**FR-04: Pencarian Sederhana** `P2`
- Kotak pencarian di header, query `?q=`
- Match di `title` / `excerpt` via PocketBase filter `LIKE`

---

### 5.2 Modul Jadwal Race (`/jadwal`) `P0`

**FR-05: Halaman Jadwal Utama (`/jadwal`)**
- Tab/filter per seri (F1, MotoGP, WEC, Formula E, semua)
- Daftar event mendatang dengan: bendera negara, nama GP, sirkuit, jadwal sesi (FP/Q/Sprint/Race), countdown
- Toggle zona waktu: WIB / WITA / WIT / UTC / waktu sirkuit
- Highlight event "sedang berlangsung" dan "berikutnya"

**FR-06: Halaman Per Seri (`/jadwal/[series]`)**
- Series: `f1`, `motogp`, `wec`, `formulae`
- Daftar lengkap kalender musim berjalan + arsip musim sebelumnya (fase 2)
- JSON-LD `SportsEvent` per sesi

**FR-07: Sumber Data Jadwal**
- Sinkronisasi dari API publik (OpenF1, MotoGP, TheSportsDB) via service di `src/lib/services/`
- Cache di PocketBase collection `events`
- Refresh manual oleh admin atau via cron (fase 2)

---

### 5.3 Modul SEO (Lintas Modul) `P0`

**FR-08: Meta Tags Standar**
- `<title>`, `<meta name="description">`, `<link rel="canonical">`
- Open Graph: `og:title`, `og:description`, `og:image`, `og:type`, `og:url`, `og:locale=id_ID`
- Twitter Card: `summary_large_image`
- Implementasi via komponen `Seo.svelte` + helper `src/lib/seo.ts` (sudah ada `resolveSeo`)

**FR-09: JSON-LD Structured Data**
- `WebSite` + `SearchAction` di home
- `Article` + `BreadcrumbList` di halaman artikel
- `SportsEvent` di halaman jadwal & per seri
- Helper sudah tersedia: `articleJsonLd`, `breadcrumbJsonLd`, `sportsEventJsonLd`, `websiteJsonLd`

**FR-10: Sitemap & Robots**
- `/sitemap.xml` dinamis: home, semua post published, semua halaman jadwal seri
- `/robots.txt`: allow all, sitemap directive, disallow `/admin`, `/login`, `/register`
- Last-mod date diisi dari field `updated`

**FR-11: Konfigurasi Indexing**
- `noindex` untuk halaman admin & auth
- `noindex` untuk halaman pencarian dengan query kosong
- Halaman 404 mengembalikan status code 404 (bukan 200)

**FR-12: Performa SEO**
- Core Web Vitals target: LCP < 2.5s, CLS < 0.1, INP < 200ms
- Lazy-load gambar di bawah fold (`loading="lazy"`)
- Font self-hosted dengan `font-display: swap`

---

### 5.4 Modul Admin / CMS `P0`

**FR-13: Autentikasi Staf**
- Login email + password (PocketBase auth)
- Role: `member` (read-only admin) / `admin` (full)
- Route guard: semua `/admin/*` butuh login + role admin
- Tidak ada registrasi publik untuk admin — akun dibuat manual via script (`scripts/promote-admin.ts`)

**FR-14: Dashboard (`/admin`)**
- Stat cards: total post published, draft, total event mendatang, total user
- Quick links ke create post / event

**FR-15: Kelola Artikel (`/admin/blog`)**
- List artikel dengan filter status (published/draft) & kategori
- Form create/edit pakai `PostForm.svelte` + `RichTextEditor.svelte` (Tiptap)
- Upload thumbnail, set excerpt, kategori, tags, toggle published
- Auto-generate slug dari title (editable manual)
- Validasi: title required, slug unik, excerpt ≤ 200 char

**FR-16: Kelola Event Jadwal (`/admin/events`)**
- CRUD event balap (title, kategori seri, sesi, sirkuit, bendera, `starts_at`, `ends_at`)
- Form via `EventForm.svelte`
- Bulk import opsional dari hasil sync API (fase 2)

**FR-17: Kelola User (`/admin/users`)**
- List user staf, toggle role member/admin, reset password (via script)
- Tidak ada self-service register publik

---

### 5.5 Modul Monetisasi `P1`

**FR-18: Ad Slot**
- Komponen `AdSlot.svelte` reusable, prop: `placement` (header/sidebar/in-article/footer)
- Awalnya render placeholder; integrasi AdSense menyusul setelah situs disetujui
- Tidak ada ad di halaman admin

---

## 6. Struktur Database (PocketBase Collections)

### `users` (built-in, di-extend)
```
id, email, username, avatar (file), role: member|admin, created, updated
```

### `posts`
```
id, title, slug (unique), content (rich html), thumbnail (file),
excerpt, category, tags, published (bool), author (relation→users),
created, updated
```

### `events`
```
id, title, category: f1|motogp|wsbk|wec|formulae|other,
session: practice|qualifying|sprint|race|other,
circuit, flag, starts_at, ends_at, created, updated
```

> Collection `channels` dan `messages` dari PRD v1 **dihapus / tidak dipakai**.

---

## 7. Halaman & Routing

| Route | Halaman | Akses | Indexed |
|---|---|---|---|
| `/` | Home + featured + grid post + jadwal terdekat | Publik | ✅ |
| `/blog/[slug]` | Detail artikel | Publik | ✅ |
| `/jadwal` | Jadwal lintas seri | Publik | ✅ |
| `/jadwal/[series]` | Jadwal per seri | Publik | ✅ |
| `/sitemap.xml` | Sitemap dinamis | Publik | — |
| `/robots.txt` | Robots | Publik | — |
| `/login` | Login staf | Publik | ❌ noindex |
| `/register` | Register (dibatasi / opsional) | Publik | ❌ noindex |
| `/admin` | Dashboard | Admin | ❌ noindex |
| `/admin/blog` | Kelola artikel | Admin | ❌ noindex |
| `/admin/events` | Kelola event | Admin | ❌ noindex |
| `/admin/users` | Kelola user | Admin | ❌ noindex |

---

## 8. Non-Functional Requirements

| Aspek | Target |
|---|---|
| **LCP** (halaman artikel) | < 2.5 detik di mobile 4G |
| **CLS** | < 0.1 |
| **TTFB** (SSR cached) | < 400 ms via Cloudflare |
| **Uptime** | ≥ 99% |
| **Mobile-first** | Wajib, breakpoint Tailwind default |
| **Aksesibilitas** | Heading hierarki benar, alt text gambar, kontras AA |
| **Security** | HTTPS wajib, sanitasi HTML konten Tiptap, rate-limit login admin |
| **Backup** | Snapshot `pb_data/` harian |

---

## 9. Batasan (Constraints)

- Konten artikel mengikuti hak cipta — gambar harus berlisensi atau milik sendiri
- Data jadwal dari API publik bisa berubah/down; UI harus graceful fallback
- Belum ada sistem komentar; engagement diarahkan ke kanal sosmed

---

## 10. Roadmap

### Phase 1 — Foundation (Selesai sebagian)
- [x] SvelteKit + Skeleton v4 + Tailwind v4 setup
- [x] PocketBase + collections `users`, `posts`, `events`
- [x] Auth admin + route guard `/admin/*`
- [x] CRUD post + Tiptap editor
- [x] CRUD event + halaman `/jadwal` & `/jadwal/[series]`
- [x] Helper SEO (`Seo.svelte`, `seo.ts`) + sitemap.xml + robots.txt
- [ ] Audit & lengkapi meta tag + JSON-LD di seluruh halaman publik
- [ ] Halaman 404 dengan status code benar

### Phase 2 — SEO & Konten
- [ ] OG image generator dinamis (opsional)
- [ ] Related posts di detail artikel
- [ ] Breadcrumb komponen reusable
- [ ] Search `?q=` sederhana
- [ ] Sinkronisasi otomatis jadwal (cron / scheduled fetch)
- [ ] Arsip musim sebelumnya per seri

### Phase 3 — Growth & Monetisasi
- [ ] Integrasi Google AdSense di `AdSlot`
- [ ] Google Analytics 4 / Plausible
- [ ] Google Search Console + submit sitemap
- [ ] Newsletter signup (opsional)
- [ ] PWA / offline cache halaman jadwal

---

## 11. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Konten duplikat dari sumber lain | Penalti SEO | Tulis ulang & beri sudut pandang sendiri, set canonical |
| API jadwal down / berubah skema | Halaman jadwal kosong | Cache di `events`, fallback ke data terakhir + banner notice |
| Page speed turun saat ad aktif | Core Web Vitals jeblok | Lazy-load iklan, batasi jumlah slot per halaman |
| PocketBase crash | Situs down | Auto-restart + monitoring, backup harian |
| Trafik tinggi membebani VPS | Lambat | Cloudflare cache HTML + asset, set TTL agresif |

---

## 12. Definition of Done

Fitur dianggap selesai jika:
1. Berjalan di production di balik HTTPS
2. Untuk halaman publik: lulus audit Lighthouse SEO ≥ 95 & Performance ≥ 85 (mobile)
3. Tidak ada error TypeScript / `svelte-check`
4. Meta tag & JSON-LD ter-render di view-source (bukan hanya hasil JS)
5. Responsive di breakpoint sm/md/lg
6. Tidak menampilkan data sensitif di response publik
