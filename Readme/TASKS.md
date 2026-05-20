# Task Tracker — Boxnow (Blog Motorsport, SEO-first)

**Sumber:** [PRD.MD](PRD.MD) v2.0
**Update terakhir:** Mei 2026

Legend status: `⬜ TODO` · `🟦 IN PROGRESS` · `✅ DONE` · `⛔ BLOCKED` · `🗑 DROPPED`
Prioritas: `P0` (MVP wajib) · `P1` (Phase 2) · `P2` (nice-to-have)

> **Catatan pivot:** Scope IPTV streaming + live chat dari PRD v1 dibatalkan.
> Tugas terkait `channels`, `messages`, `/watch/*`, HLS, moderasi chat → ditandai `🗑 DROPPED` (lihat bagian Arsip di bawah).

---

## 📊 Ringkasan Progress

| Phase | Total | Done | In Progress | TODO |
|---|---|---|---|---|
| Phase 1 — Foundation | 18 | 13 | 1 | 4 |
| Phase 2 — SEO & Konten | 12 | 0 | 0 | 12 |
| Phase 3 — Growth & Monetisasi | 8 | 0 | 0 | 8 |
| **Total** | **38** | **13** | **1** | **24** |

---

## 🟢 PHASE 1 — Foundation

> Goal: **Situs blog + jadwal jalan di production, semua halaman publik SEO-ready.**

### Epic 1.1 — Infrastruktur & Setup `P0`

| ID | Task | Owner | Status | Catatan |
|---|---|---|---|---|
| INF-01 | Provision VPS | DevOps | ✅ | |
| INF-02 | Domain + SSL (Coolify / Nginx) | DevOps | ✅ | |
| INF-03 | Deploy PocketBase (port 8090, persistent volume) | Backend | ✅ | |
| INF-04 | Nginx reverse proxy → SvelteKit (adapter-node) + PocketBase | DevOps | ⬜ | |
| INF-05 | Cloudflare di depan domain (DNS + proxy) | DevOps | ⬜ | |

### Epic 1.2 — Backend / Data `P0`

| ID | Task | Owner | Status | Catatan |
|---|---|---|---|---|
| BE-01 | Collection `users` (role: member\|admin, avatar) | Backend | ✅ | |
| BE-02 | Collection `posts` (title, slug unik, content, thumbnail, excerpt, category, tags, published, author) | Backend | ✅ | |
| BE-03 | API rules `posts`: read = published; write = admin | Backend | ✅ | |
| BE-04 | Collection `events` (title, category, session, circuit, flag, starts_at, ends_at) | Backend | ✅ | |
| BE-05 | API rules `events`: read public; write = admin | Backend | ✅ | |
| BE-06 | Auto-slug hook untuk `posts` (server-side) | Backend | 🟦 | Sementara di-handle frontend |

### Epic 1.3 — Frontend Publik (Blog) `P0`

| ID | Task | Owner | Status | Catatan |
|---|---|---|---|---|
| FE-01 | SvelteKit + Skeleton v4 + Tailwind v4 setup | Frontend | ✅ | |
| FE-02 | Layout publik (header, nav, footer) `SiteShell.svelte` | Frontend | ✅ | |
| FE-03 | Halaman `/` (featured + grid post terbaru + jadwal terdekat) | Frontend | ✅ | FR-01 |
| FE-04 | Filter kategori di home (`?category=`) | Frontend | 🟦 | Belum semua kategori dirapikan |
| FE-05 | Halaman `/blog/[slug]` detail artikel | Frontend | ✅ | FR-03 |
| FE-06 | Render aman konten Tiptap (sanitasi HTML) | Frontend | ⬜ | Cek XSS dari editor |

### Epic 1.4 — Frontend Publik (Jadwal) `P0`

| ID | Task | Owner | Status | Catatan |
|---|---|---|---|---|
| FE-07 | Halaman `/jadwal` daftar event lintas seri + countdown | Frontend | ✅ | FR-05 |
| FE-08 | Halaman `/jadwal/[series]` per seri (f1/motogp/wec/formulae) | Frontend | ✅ | FR-06 |
| FE-09 | Toggle zona waktu (WIB/WITA/WIT/UTC) | Frontend | ⬜ | |
| FE-10 | Service sync data jadwal (OpenF1, MotoGP, SportsDB) → `events` | Backend | 🟦 | Service sudah ada di `src/lib/services/`; refresh manual |

### Epic 1.5 — Admin / CMS `P0`

| ID | Task | Owner | Status | Catatan |
|---|---|---|---|---|
| AD-01 | Auth store + login admin | Frontend | ✅ | |
| AD-02 | Route guard `/admin/*` (role admin) | Frontend | ✅ | |
| AD-03 | Layout admin + sidebar | Frontend | ✅ | `AdminSidebar.svelte` |
| AD-04 | Dashboard `/admin` (stat cards) | Frontend | ✅ | FR-14 |
| AD-05 | CRUD `/admin/blog` + Tiptap editor + upload thumbnail | Frontend | ✅ | FR-15 |
| AD-06 | CRUD `/admin/events` (`EventForm.svelte`) | Frontend | ✅ | FR-16 |
| AD-07 | Kelola user `/admin/users` (toggle role) | Frontend | ✅ | FR-17 |
| AD-08 | Script promote-admin & reset-password | Backend | ✅ | `scripts/promote-admin.ts`, `reset-password.ts` |

### Epic 1.6 — SEO Dasar `P0`

| ID | Task | Owner | Status | Catatan |
|---|---|---|---|---|
| SEO-01 | Helper `seo.ts` + komponen `Seo.svelte` | Frontend | ✅ | |
| SEO-02 | Meta tags + OG + canonical di semua halaman publik (audit) | Frontend | ⬜ | FR-08 |
| SEO-03 | JSON-LD `Article` + `BreadcrumbList` di `/blog/[slug]` | Frontend | ⬜ | FR-09 |
| SEO-04 | JSON-LD `SportsEvent` di `/jadwal` & `/jadwal/[series]` | Frontend | ⬜ | FR-09 |
| SEO-05 | JSON-LD `WebSite` + `SearchAction` di home | Frontend | ⬜ | |
| SEO-06 | `/sitemap.xml` dinamis (home + posts + jadwal) | Frontend | ✅ | `routes/sitemap.xml/+server.ts` |
| SEO-07 | `/robots.txt` (allow + sitemap + disallow admin/login) | Frontend | ✅ | `routes/robots.txt/+server.ts` |
| SEO-08 | `noindex` di `/admin/*`, `/login`, `/register` | Frontend | ⬜ | FR-11 |
| SEO-09 | Halaman 404 dengan status code 404 (bukan 200) | Frontend | ⬜ | FR-11 |

---

## 🟡 PHASE 2 — SEO & Konten

> Goal: **Konten lebih dalam, dukungan navigasi & search, sinkronisasi jadwal otomatis.**

| ID | Task | Prioritas | Status | Catatan |
|---|---|---|---|---|
| FE-11 | Pagination SEO-friendly (`?page=N` + `rel=next/prev`) | P1 | ⬜ | FR-02 |
| FE-12 | Komponen Breadcrumb reusable | P1 | ⬜ | |
| FE-13 | Related posts (3 artikel kategori sama) di detail | P1 | ⬜ | |
| FE-14 | Tombol share (copy/X/WhatsApp/FB) tanpa script eksternal | P1 | ⬜ | |
| FE-15 | Pencarian sederhana `?q=` (title/excerpt LIKE) | P2 | ⬜ | FR-04 |
| FE-16 | Arsip musim sebelumnya per seri | P2 | ⬜ | |
| SEO-10 | OG image generator dinamis (per artikel) | P2 | ⬜ | |
| SEO-11 | Audit Lighthouse mobile (Perf ≥ 85, SEO ≥ 95) | P1 | ⬜ | |
| SEO-12 | Font self-hosted + `font-display: swap` | P1 | ⬜ | |
| SEO-13 | Cache-Control header agresif untuk list publik | P1 | ⬜ | s-maxage + SWR |
| BE-07 | Cron / scheduled fetch sinkronisasi `events` | P1 | ⬜ | |
| BE-08 | Backup harian `pb_data/` (script + retensi 7 hari) | P1 | ⬜ | |

---

## 🔵 PHASE 3 — Growth & Monetisasi

| ID | Task | Prioritas | Status | Catatan |
|---|---|---|---|---|
| GR-01 | Daftar Google Search Console + submit sitemap | P1 | ⬜ | |
| GR-02 | Integrasi analytics (GA4 / Plausible) | P1 | ⬜ | |
| GR-03 | Komponen `AdSlot.svelte` placement matang (header/sidebar/in-article) | P1 | 🟦 | Komponen sudah ada, butuh placement final |
| GR-04 | Integrasi Google AdSense setelah approval | P1 | ⬜ | FR-18 |
| GR-05 | Newsletter signup (opsional, mis. Buttondown) | P2 | ⬜ | |
| GR-06 | PWA / offline cache halaman jadwal | P2 | ⬜ | |
| INF-06 | Monitoring uptime (Uptime Kuma) | P1 | ⬜ | |
| INF-07 | Rate-limit login admin di Nginx / app | P1 | ⬜ | |

---

## 🐞 Bug & Tech Debt

| ID | Deskripsi | Prioritas | Status |
|---|---|---|---|
| TD-01 | Slug post & event masih digenerate di frontend, pindahkan ke PB hook | P1 | ⬜ |
| TD-02 | Layout publik (`(public)/+layout.svelte`) masih minimal — perlu nav + footer final | P1 | ⬜ |

---

## ❓ Open Questions

| ID | Pertanyaan | PIC | Status |
|---|---|---|---|
| Q-01 | Pakai AdSense atau direct ad / affiliate dulu? | Product | ⬜ |
| Q-02 | Apakah perlu sistem komentar (Disqus/Giscus) di fase 2? | Product | ⬜ |
| Q-03 | Strategi konten: berapa artikel/minggu untuk ramp up SEO? | Product | ⬜ |
| Q-04 | Lisensi gambar — pakai pool gratis (Unsplash) atau langganan? | Product | ⬜ |

---

## 📅 Milestones

- [ ] **M1 — Public Live**: semua halaman publik (`/`, `/blog/[slug]`, `/jadwal`, `/jadwal/[series]`) jalan di production
- [ ] **M2 — SEO Complete**: Phase 1 Epic SEO selesai, Lighthouse SEO ≥ 95
- [ ] **M3 — Konten Ramp-up**: minimal 30 artikel published, jadwal lengkap musim berjalan
- [ ] **M4 — Monetisasi**: AdSense aktif + analytics + Search Console terhubung

---

## 🗑 Arsip — Scope Dibatalkan (eks PRD v1 IPTV)

Tidak dilanjutkan, dipertahankan sebagai catatan historis:

- IPTV / HLS player (`/watch/[id]`, hls.js, Nginx `/hls/`)
- Collection `channels` & `messages`
- Live chat real-time + moderasi (delete/ban/slow mode)
- Halaman profile member publik
- Self-service register untuk pembaca

Komponen / route terkait di codebase yang sudah tidak relevan sebaiknya dihapus pada cleanup berikutnya.

---

## 📝 Cara Update

1. Ganti status emoji (`⬜` → `🟦` → `✅`).
2. Update tabel **Ringkasan Progress**.
3. Tambah bug ke **Bug & Tech Debt**.
4. Pindahkan jawaban final dari **Open Questions** ke PRD.
