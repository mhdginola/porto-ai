export type BlogPost = {
  slug: string;
  title: string;
  summary: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  readMinutes: number;
  tags: string[];
  /**
   * Markdown-ish body. Supported syntax (see components/pages/markdown-lite.tsx):
   * `## ` / `### ` headings, fenced code blocks with ~~~ (or ```),
   * `1.` ordered and `- ` unordered lists, inline `code` and **bold**.
   * Use ~~~ for code fences so backticks don't terminate this template literal.
   */
  body: string;
};

/**
 * Starter posts drafted from Ginola's real experience. Review and edit the
 * copy — especially the architecture details and numbers — before treating
 * these as final; they represent him professionally. Add new posts here and
 * they flow into /blog, /blog/[slug], the sitemap, and the RAG ingest
 * (scripts/ingest.ts) automatically.
 */
export const blogPosts: BlogPost[] = [
  {
    slug: "rag-portfolio-pgvector-nextjs",
    title: "Building a RAG Portfolio Assistant with pgvector and Next.js",
    summary:
      "Full architecture and build steps for the chat assistant on this site — schema, ingest pipeline, retrieval, and streaming — on a single Postgres instance.",
    date: "2026-05-10",
    readMinutes: 9,
    tags: ["RAG", "pgvector", "Next.js", "Vercel AI SDK"],
    body: `The chat assistant in the bottom-right corner of this site answers questions grounded in my actual CV and projects. No external vector database, no managed RAG service — just Next.js, Postgres with the pgvector extension, and the Vercel AI SDK. This post walks through the architecture and the exact steps I took to build it.

## Architecture

The whole system is one request path: the browser sends a message, the server retrieves relevant chunks from Postgres, builds a grounded prompt, and streams the model's answer back with citations.

~~~text
Browser (ChatWidget)
      │  POST /api/chat  { messages, model, locale }
      ▼
Next.js Route Handler ──── embed(query) ────►  Embeddings provider
      │                                          (Ollama: nomic-embed-text)
      │  top-k vector search (cosine distance)
      ▼
PostgreSQL + pgvector ───►  retrieved chunks (content, title, url)
      │
      │  build grounded system prompt
      ▼
Chat model (Groq / Ollama) ──── stream ────►  Browser
      │
      └──── x-rag-sources header ───────────►  citation list
~~~

The pieces and why each exists:

- **Embeddings provider** turns text into a 768-dim vector. It's provider-agnostic behind one env var — locally I run Ollama with **nomic-embed-text** (free, offline); production can swap to a hosted model without touching the code.
- **pgvector** stores those vectors next to the source text and does the nearest-neighbour search. Keeping vectors in the same Postgres I already run means one backup, one connection pool, one bill.
- **Route Handler** is the orchestrator: embed, retrieve, prompt, stream.
- **x-rag-sources header** carries the chunk metadata back so the UI can render numbered citations under each answer.

## Step-by-step development

1. **Model the schema.** A single \`documents\` table holds the chunk text plus its embedding. The vector column is what pgvector indexes.
2. **Build the ingest pipeline.** Read static content (profile, projects, blog), split it into overlapping chunks, embed each, and upsert. This runs as a script, not at request time.
3. **Wire retrieval.** Embed the user's latest message with the *same* model, then order by cosine distance and take the top 5.
4. **Assemble the grounded prompt.** Inject the retrieved chunks into the system prompt and instruct the model to answer only from them.
5. **Stream the response and attach sources.** Use the AI SDK to stream tokens, and pass the chunk metadata back in a response header.

### 1. The schema

~~~ts
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(),   // profile | project | blog ...
  sourceId: text("source_id").notNull(),
  title: text("title").notNull(),
  url: text("url"),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 768 }),
});
~~~

I add an HNSW index with cosine ops so search stays fast as the table grows:

~~~sql
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops);
~~~

### 2. Chunking and ingest

Chunks are sentence-aware: roughly 600 characters with an 80-character overlap so a thought is never sliced clean in half. Each content source becomes one or more rows:

~~~ts
for (const post of blogPosts) {
  const text = post.title + ". " + post.summary + " " + post.body;
  for (const [i, chunk] of chunkText(text).entries()) {
    docs.push({
      source: "blog",
      sourceId: post.slug + "-" + i,
      title: post.title,
      url: "/blog/" + post.slug,
      content: chunk,
    });
  }
}
const vectors = await embedBatch(docs.map((d) => d.content));
~~~

### 3. Retrieval

At query time I embed the message and let Drizzle build the cosine-distance order. The \`<=>\` operator is pgvector's cosine distance:

~~~ts
const queryEmbedding = await embed(userMessage);
const rows = await db
  .select()
  .from(documents)
  .orderBy(cosineDistance(documents.embedding, queryEmbedding))
  .limit(5);
~~~

### 4 & 5. Grounded prompt + streaming

The retrieved rows become context, and the model is told to stay within them. Sources ride back on a header the widget decodes:

~~~ts
const result = streamText({
  model: getChatModel(modelRef),
  system: buildGroundedPrompt(rows, locale),
  messages,
});

return result.toDataStreamResponse({
  headers: { "x-rag-sources": encodeSources(rows) },
});
~~~

## Tradeoffs and what I'd change

- **Pure vector search misses exact keywords.** A query for "Hyperledger" or "Drizzle" can rank a paraphrase above the literal mention. Hybrid search (BM25 + vector) would fix recall; I left it out to keep the stack to one Postgres.
- **No re-ranker.** A cross-encoder over the top 20 would sharpen precision, at the cost of latency and another model to host.
- **Ingest is a full rebuild.** It clears and re-inserts every run. Fine for a portfolio's worth of content; for anything larger I'd switch to content-hash upserts.

For a portfolio the constraints I wanted to prove out were exactly these: cheap, offline-capable, and running on infrastructure I already operate. The current design does that.`,
  },
  {
    slug: "clean-architecture-go-in-production",
    title: "Clean Architecture in Go: Architecture, Build Steps, and Two Years of Lessons",
    summary:
      "How I structure Go services in layers — with a worked example, the exact order I build a feature, and the parts of clean architecture I dropped.",
    date: "2026-04-02",
    readMinutes: 8,
    tags: ["Golang", "Clean Architecture", "Backend"],
    body: `After two years shipping Go services in production — AML screening, blockchain middleware, internal ERP — I've settled on a pragmatic take on clean architecture. This post shows the layering I actually use, the order I build a feature in, and the dogma I dropped.

## Architecture

The rule is one-directional dependencies: outer layers depend on inner ones, never the reverse. The domain defines the interfaces it needs; infrastructure implements them.

~~~text
        ┌──────────────────────────────────────┐
        │           delivery (HTTP)            │  gin handlers, DTOs
        └───────────────┬──────────────────────┘
                        │ calls
        ┌───────────────▼──────────────────────┐
        │              use cases               │  business rules
        └───────────────┬──────────────────────┘
                        │ depends on (interface)
        ┌───────────────▼──────────────────────┐
        │         repository interface         │  defined by the domain
        └───────────────┬──────────────────────┘
                        │ implemented by
        ┌───────────────▼──────────────────────┐
        │      infrastructure (Postgres)       │  Drizzle/sqlx, HTTP clients
        └──────────────────────────────────────┘
~~~

What lives where:

- **delivery** parses the request, calls one use case, and shapes the response. No business logic.
- **use cases** are the unit of behaviour: one struct, one \`Execute\` method, dependencies injected as interfaces.
- **repository interface** is owned by the domain. The domain says *what* it needs ("find flagged transactions"), not *how*.
- **infrastructure** is the only layer that imports a database driver. Swap Postgres for anything and the inner layers don't move.

## Step-by-step: building one feature

When I add a feature — say "screen a batch of transactions" — I build inward-out, interface first:

1. **Define the entity** in the domain package.
2. **Declare the repository interface** the use case will need.
3. **Write the use case** against that interface — fully testable with a fake.
4. **Implement the repository** in infrastructure.
5. **Wire it in the handler** and register the route.

### 1 & 2. Entity and the interface it needs

~~~go
type Transaction struct {
    ID        string
    AccountID string
    AmountIDR int64
    CreatedAt time.Time
}

// Owned by the domain; infra must satisfy it.
type TransactionRepo interface {
    FindForBatch(ctx context.Context, batchID string) ([]Transaction, error)
    SaveFlags(ctx context.Context, flags []Flag) error
}
~~~

(Struct tags like json and db live on these types in the real code — omitted here so they read cleanly.)

### 3. The use case

The use case knows nothing about HTTP or SQL. That's what makes it trivial to test:

~~~go
type ScreenBatch struct {
    repo  TransactionRepo
    rules RuleSet
}

func (uc ScreenBatch) Execute(ctx context.Context, batchID string) (Report, error) {
    txns, err := uc.repo.FindForBatch(ctx, batchID)
    if err != nil {
        return Report{}, fmt.Errorf("load batch: %w", err)
    }
    flags := uc.rules.Evaluate(txns)
    if err := uc.repo.SaveFlags(ctx, flags); err != nil {
        return Report{}, fmt.Errorf("save flags: %w", err)
    }
    return BuildReport(flags), nil
}
~~~

### 5. The handler stays thin

~~~go
func (h Handler) ScreenBatch(c *gin.Context) {
    report, err := h.screenBatch.Execute(c, c.Param("batchID"))
    if err != nil {
        c.JSON(500, gin.H{"error": "screening failed"})
        return
    }
    c.JSON(200, report)
}
~~~

## What I dropped

- **Interface explosion.** Go already favours small interfaces; I don't wrap every type. If there's no second implementation and nothing to fake, the interface is noise.
- **Six-folder layer cakes.** For a service under a few thousand lines, flat packages with clear names beat \`domain/application/infrastructure/interfaces/adapters/ports\`.
- **A DI framework "just because."** Plain constructors wired in \`main\` are enough until they genuinely aren't.

## What I keep

The two load-bearing ideas: use cases as the unit of behaviour, and repository interfaces defined by the domain. Together they let me rewrite the persistence layer — which I did when migrating a report module from MySQL to a Postgres ETL pipeline — without touching a line of business logic. That migration is the moment the discipline paid for itself.`,
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

/** Posts sorted newest-first for listings. */
export function getSortedBlogPosts(): BlogPost[] {
  return [...blogPosts].sort((a, b) => b.date.localeCompare(a.date));
}
