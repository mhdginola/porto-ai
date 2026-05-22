# porto-ai

Portfolio Full Stack Developer + AI Engineer dengan **chatbot RAG sungguhan**
(Postgres + pgvector + OpenAI embeddings).

## Tech stack

- **Framework**: Next.js 16 + React 19 + TypeScript
- **Styling**: Tailwind CSS v4
- **AI (hybrid, gratis)**:
  - **Embeddings**: Ollama lokal + `nomic-embed-text` (768d) — gratis & offline
  - **Chat**: Groq + `llama-3.3-70b-versatile` — free tier super cepat
  - Provider-agnostic: tinggal ganti `EMBEDDING_PROVIDER` / `CHAT_PROVIDER`
- **Vector DB**: PostgreSQL 17 + pgvector (HNSW + cosine)
- **ORM**: Drizzle ORM + Drizzle Kit
- **Animasi**: Framer Motion
- **Theme**: next-themes (dark mode default)

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

- *"Pernah pakai pgvector?"*
- *"What's your strongest project?"*
- *"Apa stack backend yang kamu kuasai?"*

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
CHAT_PROVIDER=ollama           # TODO: tambahkan branch ollama di chatModel()
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

## Scripts

| Command | Apa yang dilakukan |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Build production |
| `npm run typecheck` | Cek TS tanpa emit |
| `npm run db:setup` | Aktifkan extension `vector` |
| `npm run db:push` | Push schema Drizzle ke DB |
| `npm run db:studio` | Buka Drizzle Studio (UI DB) |
| `npm run db:ingest` | Chunk + embed + insert konten |
| `npm run db:reset` | Setup + push + ingest, sekaligus |

## Roadmap

- [x] Chatbot RAG sungguhan (pgvector + embeddings + citations)
- [ ] AI Playground demo (Summarizer, Image-to-Code, Mini RAG upload PDF)
- [ ] MDX blog dengan auto-ingest ke RAG
- [ ] Smart contact form (AI klasifikasi inquiry)
- [ ] Re-ranker (cohere atau cross-encoder lokal)

## Lisensi

MIT.
