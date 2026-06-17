export type BlogPost = {
  slug: string;
  title: string;
  summary: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  readMinutes: number;
  tags: string[];
  /** Markdown-ish plain text; rendered with whitespace preserved. */
  body: string;
};

/**
 * Starter posts drafted from Ginola's real experience. Review and edit the
 * copy before treating these as final — they represent him professionally.
 * Add new posts here; they flow into /blog, /blog/[slug], the sitemap, and
 * the RAG ingest (scripts/ingest.ts) automatically.
 */
export const blogPosts: BlogPost[] = [
  {
    slug: "rag-portfolio-pgvector-nextjs",
    title: "Building a RAG Portfolio Assistant with pgvector and Next.js",
    summary:
      "How I wired pgvector, Drizzle ORM, and the Vercel AI SDK to answer questions about my CV and projects — on a single Postgres instance.",
    date: "2026-05-10",
    readMinutes: 6,
    tags: ["RAG", "pgvector", "Next.js", "Vercel AI SDK"],
    body: `When I built this portfolio I wanted more than a static page — I wanted visitors to ask questions and get answers grounded in my actual work history. That's the chat assistant in the bottom-right corner of this site.

The core idea is simple: chunk your documents, embed them, store the vectors in Postgres, and retrieve the most relevant chunks at query time. The details are where it gets interesting.

## The embedding pipeline

I use Drizzle ORM with a pgvector column on a documents table. Each row stores the raw text, a title, an optional URL, and the embedding. An ingest script reads from my static content (profile, projects, and these blog posts) and chunks it with a small sentence-aware splitter — roughly 600 characters per chunk with an 80-character overlap so context isn't sliced mid-thought.

Embeddings are provider-agnostic: locally I run Ollama with nomic-embed-text (free and offline), and in production I can swap to a hosted provider by changing one env var. Same code, different backend.

## Retrieval at query time

At chat time the user's message is embedded with the same model, then matched against stored vectors using pgvector's cosine-distance operator. The top handful of chunks get injected into the system prompt as grounded context. The model only answers from what the vector search surfaced, which keeps hallucinations down.

## Source attribution

The chat API returns the retrieved chunk metadata in a response header. The widget parses it and renders a numbered source list under each answer. It's a small touch, but it makes the answers feel auditable — you can see which part of my CV or which project an answer came from.

## What I'd do differently

Hybrid search (keyword + vector) would improve recall for stack-name queries like "Hyperledger" or "Drizzle." A cross-encoder re-ranker would sharpen precision. For a portfolio, though, the current setup is fast, cheap, and runs on a single Postgres instance with no external vector database — which is exactly the constraint I wanted to prove out.`,
  },
  {
    slug: "clean-architecture-go-in-production",
    title: "Clean Architecture in Go: Two Years in Production",
    summary:
      "Practical lessons from applying layered architecture to Go services — what works, what I dropped, and what I keep.",
    date: "2026-04-02",
    readMinutes: 5,
    tags: ["Golang", "Clean Architecture", "Backend"],
    body: `After two years shipping Go services in production — AML screening, blockchain middleware, and internal ERP modules — I have opinions about clean architecture. Most of them have softened.

## The pitch

Clean architecture separates domain logic from delivery (HTTP, gRPC) and infrastructure (database, external APIs). In Go that means entities, use cases, interface adapters, and frameworks — each layer depending only inward.

The benefit is real. When we migrated a report-generation module from a MySQL-backed monolith to a Postgres ETL pipeline, the domain logic stayed untouched. We rewrote only the repository layer.

## What I dropped

Interface explosion. Idiomatic Go already encourages small interfaces, but clean architecture can push you to wrap every type — including ones with a single implementation and no test double. That's noise. If there's no second implementation and nothing to fake, I skip the interface.

Overstructured folders. I've seen Go projects with six near-empty layer directories. For a service under a few thousand lines, flat packages with clear names beat the full layer cake.

## What I keep

Use cases as the unit of behaviour — one struct, one Execute method, dependencies injected via interfaces. Tests stay straightforward. Repository interfaces defined by the domain: the domain says what it needs, the infra layer delivers it, and swapping or faking the database becomes trivial. And strict inward-only dependencies enforced at CI time so violations never reach review.

## Verdict

Clean architecture is a good default for services that will grow or change their persistence layer. For small, stable services the overhead isn't worth it — pick a sensible layout and move on. The goal is readable, changeable code, not compliance with a diagram.`,
  },
  {
    slug: "designing-an-aml-etl-pipeline",
    title: "Designing an AML Screening ETL Pipeline",
    summary:
      "Notes on a government-grade transaction screening system: ingestion, detection rules, and the tradeoffs that matter at scale.",
    date: "2026-02-14",
    readMinutes: 7,
    tags: ["ETL", "Golang", "PostgreSQL", "Compliance"],
    body: `Anti-money laundering (AML) screening is a domain where the stakes are real and the tolerance for error is near zero. Here's what I learned building and maintaining a PPATK-compliant screening platform in Indonesia.

## The problem

Financial institutions are required to report suspicious transactions to PPATK, the financial intelligence unit. The challenge: volumes run into the millions per month, detection rules change as regulations evolve, and reports must be audit-ready.

## The pipeline

Ingest. Transactions arrive as flat-file exports from core banking systems on a nightly schedule. A Go service reads, validates, and normalises them into a staging table. Bad rows are quarantined with error metadata — never silently dropped.

Screen. A rule engine evaluates each transaction against configurable detection rules. Flagged transactions get a reason code and a confidence score.

Review. Flagged items surface to analysts in a dashboard where they can dismiss, escalate, or mark for report inclusion.

Report. Approved flags are collated into reports conforming to the regulator's schema and submitted.

## The query bottleneck

Early versions screened a batch of 50k transactions in 12+ minutes. Profiling found two culprits: one query per rule per transaction, and missing composite indexes. The fix was batch evaluation across all rules in a single pass plus indexes on the most common predicates. Report generation dropped from 12 minutes to under 90 seconds.

## The tradeoffs that mattered

Auditability vs. performance. Every decision needs a trail — rule version, evaluated value, outcome. That's a lot of rows, so we partition the audit log by month and archive aggressively.

Rule flexibility vs. correctness. A UI for analysts to author rules sounds powerful, but a mis-written rule can flag everything or nothing. We kept rules in the codebase behind code review rather than a UI.

Idempotency. The same file can arrive twice. Every ingest run is keyed on a file hash, so duplicates are detected early and skipped without side effects.`,
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

/** Posts sorted newest-first for listings. */
export function getSortedBlogPosts(): BlogPost[] {
  return [...blogPosts].sort((a, b) => b.date.localeCompare(a.date));
}
