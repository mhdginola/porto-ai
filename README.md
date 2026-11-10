# porto-ai

Portfolio Full Stack Developer + AI Engineer dengan **chatbot RAG sungguhan**
(Postgres + pgvector + OpenAI embeddings).

## Tech stack

- **Framework**: Next.js 16 + React 19 + TypeScript
- **Styling**: Tailwind CSS v4
- **AI (hybrid, gratis)**:
  - **Embeddings**: Ollama lokal + `nomic-embed-text` (768d) — gratis & offline
  - **Chat**: Ollama lokal (semua model dari `ollama list`) — gratis & offline
  - **Chat (opsional)**: Groq + `llama-3.3-70b-versatile` — free tier super cepat
  - Provider-agnostic: tinggal ganti `EMBEDDING_PROVIDER` / `CHAT_PROVIDER`
- **Vector DB**: PostgreSQL 17 + pgvector (HNSW + cosine)
- **ORM**: Drizzle ORM + Drizzle Kit
- **Animasi**: Framer Motion
- **Theme**: @teispace/next-themes (dark mode default; React 19 / Next 16 compatible)

## Setup awal

### 1. Install dependencies & env

```bash
cp .env.example .env.local
npm install
```

Isi minimal di `.env.local`:

- `GROQ_API_KEY` — dapatkan gratis di [console.groq.com/keys](https://console.groq.com/keys)
- `DATABASE_URL` — sudah pre-set ke Postgres Docker lokal

### 2. Install & jalankan Ollama (embeddings lokal)

```bash
# macOS
brew install ollama
ollama serve &              # jalan di background
ollama pull nomic-embed-text
```

Verifikasi: `curl http://localhost:11434/api/version` harus return versi.

### 3. Jalankan Postgres + pgvector lokal

Opsi A — **Docker (rekomendasi untuk dev)**:

```bash
docker compose up -d
```

Opsi B — **Neon / Supabase** (cloud, gratis): ganti `DATABASE_URL` di
`.env.local`. Neon: pgvector built-in. Supabase: aktifkan extension `vector`
dari dashboard.

### 4. Setup database + index awal

```bash
npm run db:setup     # CREATE EXTENSION vector
npm run db:push      # apply Drizzle schema (tabel documents)
npm run db:ingest    # chunk + embed semua konten ke pgvector
```

Atau sekali jalan:

```bash
npm run db:reset
```

### 5. Run dev

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000), klik bot di pojok kanan
bawah, lalu coba tanya:

- _"Pernah pakai pgvector?"_
- _"What's your strongest project?"_
- _"Apa stack backend yang kamu kuasai?"_

Jawabannya sekarang berbasis **retrieval** dari konten yang kamu ingest, dengan
**citations** di bawah jawaban.

## Cara kerja RAG

```
User query
    │
    ▼
embed via Ollama (nomic-embed-text, 768d, lokal)
    │
    ▼
cosine similarity search di pgvector (HNSW index)
    │
    ▼
top-5 chunks → disuntik ke system prompt
    │
    ▼
streamText via Groq (llama-3.3-70b) → response + sumber (x-rag-sources header)
```

File-file kunci:

- `src/lib/ai.ts` — provider config (Ollama/OpenAI untuk embed, Groq/OpenAI untuk chat)
- `src/lib/db/schema.ts` — tabel `documents` dengan kolom `vector(768)`
- `src/lib/rag.ts` — `retrieveRelevantChunks()` dengan cosine distance
- `src/lib/embeddings.ts` — wrapper `embed` / `embedMany`
- `scripts/ingest.ts` — chunker + batch embed + insert
- `src/app/api/chat/route.ts` — RAG-augmented streaming endpoint
- `src/components/ai/ChatWidget.tsx` — UI + parsing `x-rag-sources` header

### Ganti provider

Edit `.env.local`:

```bash
# Pakai OpenAI semua
EMBEDDING_PROVIDER=openai      # vector(1536) — update juga di schema.ts!
CHAT_PROVIDER=openai

# Pakai Ollama untuk chat juga (semuanya lokal, gratis, offline)
CHAT_PROVIDER=ollama
OLLAMA_CHAT_MODEL=Llama3:latest
```

> Catatan: kalau ganti embedding provider, dimensi vector berubah →
> update `EMBEDDING_DIM` di `src/lib/db/schema.ts` lalu `npm run db:reset`.

## Update konten

Setiap kali kamu edit `src/content/profile.ts` atau `src/content/projects.ts`,
re-ingest:

```bash
npm run db:ingest
```

> Ingest script otomatis **menghapus semua dokumen lama** lalu insert ulang,
> jadi aman dijalankan berulang.

## Struktur folder

```
portoAI/
├── docker-compose.yml          # Postgres 17 + pgvector
├── drizzle.config.ts           # Drizzle Kit config
├── drizzle/                    # generated migrations
├── scripts/
│   ├── setup-db.ts             # CREATE EXTENSION vector
│   └── ingest.ts               # chunk + embed + upsert
└── src/
    ├── app/
    │   ├── api/chat/route.ts   # RAG endpoint (Node runtime)
    │   └── (pages...)
    ├── components/
    │   ├── ai/ChatWidget.tsx
    │   └── (layout, sections, ui)
    ├── content/                # source of truth untuk knowledge base
    ├── lib/
    │   ├── db/{index,schema}.ts
    │   ├── embeddings.ts
    │   ├── rag.ts
    │   ├── site.ts
    │   └── utils.ts
    └── types/index.ts
```

## Deploy

Push ke GitHub, import di [Vercel](https://vercel.com/new), set env var:

- `OPENAI_API_KEY`
- `DATABASE_URL` (gunakan Neon free tier — pgvector built-in)

Lalu jalankan ingest sekali via CI atau lokal yang nunjuk ke DATABASE_URL produksi.

## Demo Payment & Subscription (Xendit)

`/projects/payment-subscription-demo` punya dua mode:

- **Simulator** (default, tanpa setup): mock gateway di `/api/projects/payment/*`,
  state disimpan di localStorage browser.
- **Xendit (test)**: checkout lewat halaman invoice Xendit (VA, e-wallet, QRIS, kartu),
  status pembayaran via webhook, data disimpan di Postgres. Tombol mode ini otomatis
  aktif kalau `XENDIT_SECRET_KEY` diisi.

Setup mode Xendit:

1. `npm run db:push` — membuat tabel `payment_subscriptions`, `payment_invoices`, `payment_events`.
2. Di [Xendit Dashboard](https://dashboard.xendit.co) (mode **Test**):
   - Settings → API Keys → buat secret key (permission *Money-in: Write*) → `XENDIT_SECRET_KEY`.
   - Settings → Webhooks → salin *verification token* → `XENDIT_CALLBACK_TOKEN`,
     lalu isi URL **Invoices paid** dengan `https://<domain>/api/projects/payment/xendit/webhook`.
3. Restart dev server.

Catatan:

- Hanya key test (`xnd_development_…`) yang diterima. Key live ditolak kecuali
  `XENDIT_ALLOW_LIVE=true` — supaya portfolio publik tidak menerima uang sungguhan.
- Webhook tidak bisa menjangkau `localhost`. Saat development, status tetap tersinkron
  karena halaman demo mengecek status invoice ke Xendit (`GET /v2/invoices/:id`)
  sewaktu user kembali dari halaman pembayaran, plus polling selama ada invoice pending.
  Untuk menguji webhook asli secara lokal, pakai tunnel (mis. `ngrok http 3000`).
- Perpanjangan memakai model invoice. Cron harian (lihat "Keamanan & cron" di bawah)
  menerbitkan invoice periode berikutnya 3 hari sebelum periode berakhir, dan mengakhiri
  langganan yang dibatalkan atau tidak dibayar setelah masa tenggang 3 hari.
  Tombol "Buat invoice perpanjangan" di demo tetap ada sebagai pemicu manual.

### Integrasi dengan Auth demo (entitlements)

Saat login di `/projects/auth-demo`, langganan Xendit terikat ke akun (`usr_<id>`), bukan
ke browser. Modul dashboard butuh **role** yang sesuai (RBAC) **dan** **paket** yang sesuai:
*User management* butuh Pro, *Settings* butuh Business (`src/lib/payment-demo/entitlements.ts`).
Akses dihitung di server (`GET /api/projects/auth/modules`) dan data modul yang terkunci
tidak dikirim. Catatan: akun demo bersama (mis. `admin@demo.local`) berbagi satu langganan.

## Smart contact form

`/contact` punya form yang disortir AI (`POST /api/contact`):

1. Validasi + perlindungan bot (honeypot, waktu isi form < 3 detik) + rate limit
   (3 pesan / 10 menit dan 10 / hari per IP, 5 / hari per email; IP disimpan sebagai hash).
2. Pesan **disimpan dulu** ke tabel `contact_messages`, jadi lead tidak hilang walau AI/email gagal.
3. AI mengklasifikasikan: `job_offer`, `freelance`, `collaboration`, `question`, `spam`, `other`
   + prioritas, ringkasan, dan draf balasan. Spam (confidence ≥ 70%) tidak dikirim ke email.
4. Setelah response terkirim (`after()`), notifikasi dikirim via [Resend](https://resend.com)
   ke `CONTACT_TO_EMAIL` dengan reply-to ke pengirim. Auto-reply ke pengirim opsional
   (`CONTACT_AUTOREPLY=true`) dan butuh domain terverifikasi di Resend; isinya template tetap
   (tidak mengulang isi pesan) supaya form tidak bisa disalahgunakan untuk spam.

Tanpa `RESEND_API_KEY`, pesan tetap tersimpan dan diklasifikasi — hanya email yang dilewati.

## Admin: kotak masuk lead

`/admin/leads` — tempat membaca pesan dari contact form (tidak ada di navbar, `noindex`,
diblokir di robots.txt). Aktif hanya kalau `ADMIN_PASSWORD` diisi (min. 12 karakter di
produksi); tanpa itu semua `/admin` mengembalikan 404.

- Login terpisah dari Auth demo (akun demo itu publik). Sesi cookie `HttpOnly`,
  `SameSite=strict`, 12 jam; mengganti password otomatis mengeluarkan semua sesi.
  Login dibatasi 5 percobaan / 15 menit per IP.
- Statistik (belum dibaca, prioritas tinggi, spam), filter Inbox / Unread / Archived / Spam,
  filter kategori, pencarian.
- Detail pesan + ringkasan AI + draf balasan: "Reply with draft" membuka email dengan draf
  terisi, atau "Copy". Tandai belum dibaca, arsipkan, spam / bukan spam, dan "Re-run AI"
  untuk pesan yang gagal diklasifikasi.

## Keamanan & cron

- **Rate limit** di semua endpoint publik (`src/lib/rate-limit.ts`), dihitung per IP (di-hash)
  di tabel `rate_limit_hits` supaya berlaku di semua instance serverless. Semua endpoint AI
  berbagi satu kuota: 15 request / 5 menit dan 100 / hari per IP, plus 3000 / hari global.
  Endpoint berbayar lain (Google Places, upload PDF, invoice Xendit) punya batas sendiri.
  Kalau database tidak bisa diakses, request tetap diizinkan (fail-open) dan error dicatat.
- **Endpoint chat** (`/api/chat`, agent, Mini RAG) hanya menerima role `user`/`assistant`,
  maks 4000 karakter per pesan, 12 pesan terakhir, body 64KB, dan jawaban maks 2048 token.
- **Upload PDF**: maks 15MB / 150 halaman; jumlah halaman dicek sebelum ekstraksi/OCR.
- **`AUTH_DEMO_SECRET` wajib** di produksi (min. 32 karakter), kalau tidak login auth demo
  ditolak. Buat dengan `openssl rand -base64 48`.
- **Cron harian** `/api/cron/daily` (`vercel.json`, 08:00 WIB) — butuh `CRON_SECRET`:
  perpanjangan langganan Xendit + bersih-bersih data demo (akun signup pengunjung > 7 hari
  beserta data pembayarannya, spam > 30 hari, item CRUD di atas 100, counter rate limit lama).
  Akun seed `@demo.local` dan pesan kontak asli tidak pernah dihapus. Tes manual:
  `curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/daily`.

## Scripts

| Command             | Apa yang dilakukan               |
| ------------------- | -------------------------------- |
| `npm run dev`       | Dev server                       |
| `npm run build`     | Build production                 |
| `npm run typecheck` | Cek TS tanpa emit                |
| `npm run db:setup`  | Aktifkan extension `vector`      |
| `npm run db:push`   | Push schema Drizzle ke DB        |
| `npm run db:studio` | Buka Drizzle Studio (UI DB)      |
| `npm run db:ingest` | Chunk + embed + insert konten    |
| `npm run db:reset`  | Setup + push + ingest, sekaligus |

## Roadmap

- [x] Chatbot RAG sungguhan (pgvector + embeddings + citations)
- [ ] AI Playground demo (Summarizer, Image-to-Code, Mini RAG upload PDF)
- [ ] MDX blog dengan auto-ingest ke RAG
- [ ] Smart contact form (AI klasifikasi inquiry)
- [ ] Re-ranker (cohere atau cross-encoder lokal)

## Lisensi

MIT.
