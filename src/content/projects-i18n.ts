import type { Project } from "@/types";
import type { Locale } from "@/lib/i18n/types";
import { pick, pickList } from "@/content/profile-i18n";

type L = Record<Locale, string>;
type LList = Record<Locale, readonly string[]>;

export const projectsI18n: Record<
  string,
  {
    title: L;
    summary: L;
    description: L;
    role?: L;
    highlights: LList;
  }
> = {
  "aml-transaction-screening": {
    title: {
      en: "AML Transaction Screening Platform",
      id: "Platform Screening Transaksi AML",
    },
    summary: {
      en: "Regulatory-grade system that screens suspicious banking transactions for government reporting.",
      id: "Sistem tingkat regulasi untuk menscreen transaksi perbankan mencurigakan guna pelaporan pemerintah.",
    },
    description: {
      en: `End-to-end platform for screening suspicious financial transactions and
generating reports required by the Indonesian financial regulator (PPATK / AML).
The system ingests millions of transactions via ETL pipelines, applies detection
rules, surfaces anomalies for analyst review, and produces compliance-ready
output. Built with Go (Gin) on the backend, PHP/Laravel for legacy modules, and
PostgreSQL as the system of record — all wrapped in a clean architecture so the
domain logic stays portable across services.`,
      id: `Platform end-to-end untuk menscreen transaksi keuangan mencurigakan dan
menghasilkan laporan yang dibutuhkan regulator keuangan Indonesia (PPATK / AML).
Sistem mengonsumsi jutaan transaksi via pipeline ETL, menerapkan aturan deteksi,
menampilkan anomali untuk review analis, dan menghasilkan output siap compliance.
Dibangun dengan Go (Gin) di backend, PHP/Laravel untuk modul legacy, dan
PostgreSQL sebagai system of record — semuanya dibungkus clean architecture agar
domain logic tetap portable lintas layanan.`,
    },
    role: { en: "Lead Developer", id: "Lead Developer" },
    highlights: {
      en: [
        "Designed ETL pipeline to ingest millions of banking transactions",
        "Implemented detection rules for AML / PPATK compliance reporting",
        "Optimized PostgreSQL queries to cut report generation time significantly",
        "Clean-architecture codebase shared across multiple internal teams",
      ],
      id: [
        "Merancang pipeline ETL untuk ingest jutaan transaksi perbankan",
        "Mengimplementasikan aturan deteksi untuk pelaporan compliance AML / PPATK",
        "Mengoptimasi query PostgreSQL yang memangkas waktu generate laporan secara signifikan",
        "Codebase clean architecture yang dipakai bersama beberapa tim internal",
      ],
    },
  },
  "portdex-blockchain-ai": {
    title: {
      en: "Portdex — Blockchain + AI Assistant",
      id: "Portdex — Blockchain + Asisten AI",
    },
    summary: {
      en: "Web3 product combining Hyperledger Firefly/Besu with AI assistants on top of Openclaw AI.",
      id: "Produk Web3 yang menggabungkan Hyperledger Firefly/Besu dengan asisten AI di atas Openclaw AI.",
    },
    description: {
      en: `Production blockchain platform with built-in AI assistants. Backend in Go
(Gin) following clean architecture, Vue.js frontend, deployed on Kubernetes
running on Google Cloud Platform. Integrated Hyperledger Firefly to manage
multi-party asset workflows, Besu network for the underlying EVM-compatible
chain, and Openclaw AI for the assistant features. I designed the system
architecture, implemented new features, and optimized performance.`,
      id: `Platform blockchain produksi dengan asisten AI built-in. Backend Go (Gin)
mengikuti clean architecture, frontend Vue.js, deploy di Kubernetes di
Google Cloud Platform. Mengintegrasikan Hyperledger Firefly untuk alur aset
multi-pihak, jaringan Besu sebagai chain EVM-compatible, dan Openclaw AI untuk
fitur asisten. Saya merancang arsitektur sistem, mengimplementasikan fitur baru,
dan mengoptimasi performa.`,
    },
    role: {
      en: "Programmer (Part-time)",
      id: "Programmer (Paruh Waktu)",
    },
    highlights: {
      en: [
        "Integrated Hyperledger Firefly + Besu for tokenized-asset flows",
        "Built AI assistant features on top of Openclaw AI",
        "Deployed services on GCP-managed Kubernetes",
        "Applied clean architecture for scalability and maintainability",
      ],
      id: [
        "Mengintegrasikan Hyperledger Firefly + Besu untuk alur aset tokenized",
        "Membangun fitur asisten AI di atas Openclaw AI",
        "Deploy layanan ke Kubernetes yang dikelola GCP",
        "Menerapkan clean architecture untuk skalabilitas dan maintainability",
      ],
    },
  },
  "deon-company-profile": {
    title: {
      en: "DEON Company Profile",
      id: "Company Profile DEON",
    },
    summary: {
      en: "Designed and deployed a modern company profile site with Next.js.",
      id: "Merancang dan deploy situs company profile modern dengan Next.js.",
    },
    description: {
      en: `Marketing and company-profile site for an internal DEON brand. Built with
Next.js and React, with focus on responsive layout, performance, and a clean
content structure that the marketing team can maintain.`,
      id: `Situs marketing dan company profile untuk brand internal DEON. Dibangun dengan
Next.js dan React, fokus pada layout responsif, performa, dan struktur konten
rapi yang bisa dirawat tim marketing.`,
    },
    role: { en: "Full Stack Developer", id: "Full Stack Developer" },
    highlights: {
      en: [
        "End-to-end design and deployment",
        "Responsive across mobile/tablet/desktop",
        "Fast initial load + SEO-friendly structure",
      ],
      id: [
        "Desain dan deployment end-to-end",
        "Responsif di mobile/tablet/desktop",
        "Initial load cepat + struktur ramah SEO",
      ],
    },
  },
  "warehouse-locator": {
    title: {
      en: "Warehouse Locator System",
      id: "Warehouse Locator System",
    },
    summary: {
      en: "Internal tool to track and place goods across warehouses for ops teams.",
      id: "Tool internal untuk melacak dan menempatkan barang di gudang untuk tim operasional.",
    },
    description: {
      en: `Internal PHP application used by warehouse operations to track stock
placement and quickly locate goods. Replaced a manual spreadsheet workflow,
reducing search time and human error.`,
      id: `Aplikasi PHP internal untuk operasional gudang melacak penempatan stok dan
menemukan barang dengan cepat. Menggantikan alur spreadsheet manual,
mengurangi waktu pencarian dan human error.`,
    },
    role: { en: "Developer", id: "Developer" },
    highlights: {
      en: [
        "Replaced spreadsheet-based workflow",
        "Reduced goods-locating time for ops team",
        "Role-based access for warehouse staff",
      ],
      id: [
        "Menggantikan alur berbasis spreadsheet",
        "Memangkas waktu pencarian barang untuk tim ops",
        "Akses berbasis role untuk staf gudang",
      ],
    },
  },
  "marketing-elearning": {
    title: {
      en: "Marketing E-Learning Platform",
      id: "Platform E-Learning Marketing",
    },
    summary: {
      en: "Internal training platform for marketing staff (Laravel).",
      id: "Platform pelatihan internal untuk staf marketing (Laravel).",
    },
    description: {
      en: `Built a Laravel-based e-learning platform used by the marketing
department to onboard and train staff. Includes course content, progress
tracking, and quiz/assessment features.`,
      id: `Membangun platform e-learning berbasis Laravel untuk departemen marketing
onboard dan melatih staf. Termasuk konten kursus, progress tracking, dan
fitur kuis/assessment.`,
    },
    role: { en: "Developer", id: "Developer" },
    highlights: {
      en: [
        "Course content + progress tracking",
        "Quiz/assessment scoring engine",
        "Used by the marketing team for onboarding",
      ],
      id: [
        "Konten kursus + progress tracking",
        "Engine scoring kuis/assessment",
        "Digunakan tim marketing untuk onboarding",
      ],
    },
  },
  "erp-enhancements": {
    title: {
      en: "ERP System Enhancements",
      id: "Pengembangan Sistem ERP",
    },
    summary: {
      en: "Debugged and extended a Node.js/Express ERP serving daily operations.",
      id: "Debug dan perluas ERP Node.js/Express untuk operasional harian.",
    },
    description: {
      en: `Owned bug-fixing and new-feature work on an existing internal ERP built in
Node.js/Express. Improvements touched inventory, reporting, and integration
modules used daily by operational staff.`,
      id: `Memimpin perbaikan bug dan fitur baru pada ERP internal existing berbasis
Node.js/Express. Perbaikan mencakup modul inventory, reporting, dan integrasi
yang dipakai staf operasional setiap hari.`,
    },
    role: { en: "Developer", id: "Developer" },
    highlights: {
      en: [
        "Resolved long-standing production bugs",
        "Added new modules for reporting and integrations",
        "Improved daily operational throughput",
      ],
      id: [
        "Menyelesaikan bug produksi yang sudah lama ada",
        "Menambah modul baru untuk reporting dan integrasi",
        "Meningkatkan throughput operasional harian",
      ],
    },
  },
  "marketplace-demo": {
    title: {
      en: "Marketplace SaaS Dashboard",
      id: "Dashboard SaaS Marketplace",
    },
    summary: {
      en: "Seller admin UI with revenue charts, product catalog, and orders — all hardcoded demo data.",
      id: "UI admin penjual dengan grafik pendapatan, katalog produk, dan pesanan — data demo.",
    },
    description: {
      en: `Full marketplace-style SaaS dashboard built for portfolio demonstration.
Includes KPI cards, monthly revenue chart, category breakdown, product grid, and
order tables. All metrics and records are hardcoded — no backend required.`,
      id: `Dashboard SaaS bergaya marketplace untuk portfolio. Termasuk kartu KPI,
grafik pendapatan bulanan, breakdown kategori, grid produk, dan tabel pesanan.
Semua metrik dan data di-hardcode — tanpa backend.`,
    },
    role: { en: "Creator", id: "Pembuat" },
    highlights: {
      en: [
        "Overview, Products, and Orders views with sidebar navigation",
        "IDR-formatted stats and mock month-over-month revenue bars",
        "Searchable product catalog with stock and sales columns",
        "Order status badges (paid, pending, shipped, cancelled)",
      ],
      id: [
        "Tampilan Ringkasan, Produk, dan Pesanan dengan navigasi sidebar",
        "Statistik format IDR dan bar pendapatan bulanan",
        "Katalog produk dengan pencarian, stok, dan penjualan",
        "Badge status pesanan (lunas, menunggu, dikirim, batal)",
      ],
    },
  },
  "auth-demo": {
    title: {
      en: "Simple Auth & Roles Demo",
      id: "Demo Auth & Role Sederhana",
    },
    summary: {
      en: "Login with admin, editor, or viewer — role-based access shown in the dashboard.",
      id: "Login sebagai admin, editor, atau viewer — akses berbasis role di dashboard.",
    },
    description: {
      en: `Interactive auth demo with bcrypt password checks, JWT sessions in httpOnly
cookies, and a simple RBAC matrix. Each role unlocks different dashboard panels —
admin sees everything, editor can manage content, viewer is read-only.`,
      id: `Demo auth interaktif dengan cek password bcrypt, sesi JWT di cookie httpOnly,
dan matriks RBAC sederhana. Setiap role membuka panel dashboard berbeda — admin
melihat semua, editor mengelola konten, viewer hanya baca.`,
    },
    role: { en: "Creator", id: "Pembuat" },
    highlights: {
      en: [
        "Session cookies signed with jose (HS256)",
        "Three seeded roles: admin, editor, viewer",
        "UI panels gated by minimum role",
        "Demo accounts listed on the login screen",
      ],
      id: [
        "Cookie sesi ditandatangani jose (HS256)",
        "Tiga role seed: admin, editor, viewer",
        "Panel UI dibatasi minimum role",
        "Akun demo tercantum di layar login",
      ],
    },
  },
  "crud-demo": {
    title: {
      en: "Simple CRUD Demo",
      id: "Demo CRUD Sederhana",
    },
    summary: {
      en: "Live Create, Read, Update, Delete demo — Next.js API routes and PostgreSQL.",
      id: "Demo CRUD langsung — API route Next.js dan PostgreSQL.",
    },
    description: {
      en: `Interactive portfolio demo for basic CRUD operations. Add, edit, and delete
items stored in PostgreSQL via Next.js Route Handlers and Drizzle ORM. Open the live
demo to try it in the browser — no separate login required.`,
      id: `Demo portfolio interaktif untuk operasi CRUD dasar. Tambah, ubah, dan hapus
item yang disimpan di PostgreSQL via Route Handler Next.js dan Drizzle ORM. Buka demo
live untuk mencoba di browser — tanpa login terpisah.`,
    },
    role: { en: "Creator", id: "Pembuat" },
    highlights: {
      en: [
        "Full create / read / update / delete flow in the browser",
        "REST API with Zod validation",
        "PostgreSQL persistence via Drizzle",
        "Bilingual UI (EN / ID)",
      ],
      id: [
        "Alur create / read / update / delete penuh di browser",
        "REST API dengan validasi Zod",
        "Penyimpanan PostgreSQL via Drizzle",
        "UI bilingual (EN / ID)",
      ],
    },
  },
  "porto-ai": {
    title: {
      en: "Porto AI — Portfolio & RAG",
      id: "Porto AI — Portfolio & RAG",
    },
    summary: {
      en: "This site: Next.js portfolio with pgvector RAG, AI playground, and bilingual UI.",
      id: "Situs ini: portfolio Next.js dengan RAG pgvector, AI playground, dan UI bilingual.",
    },
    description: {
      en: `Personal portfolio and AI showcase built with Next.js 16, Vercel AI SDK,
PostgreSQL + pgvector, and hybrid Ollama/Groq providers. Includes Mini RAG over
uploaded PDFs, sentiment analysis, summarizers, and an embeddable chat widget
indexed on CV and project content.`,
      id: `Portfolio pribadi dan showcase AI dengan Next.js 16, Vercel AI SDK,
PostgreSQL + pgvector, serta provider hybrid Ollama/Groq. Termasuk Mini RAG atas
PDF yang diunggah, analisis sentimen, summarizer, dan widget chat yang terindeks
dari CV dan konten proyek.`,
    },
    role: { en: "Creator", id: "Pembuat" },
    highlights: {
      en: [
        "RAG chat over CV, projects, and blog with pgvector",
        "Mini RAG playground with PDF upload and citations",
        "Dual Groq + Ollama model picker for chat demos",
        "EN/ID i18n across the portfolio",
      ],
      id: [
        "Chat RAG atas CV, proyek, dan blog dengan pgvector",
        "Mini RAG playground dengan unggah PDF dan sitasi",
        "Model picker Groq + Ollama untuk demo chat",
        "i18n EN/ID di seluruh portfolio",
      ],
    },
  },
};

export type LocalizedProject = {
  title: string;
  summary: string;
  description: string;
  role?: string;
  highlights: readonly string[];
};

export function getLocalizedProject(
  project: Project,
  locale: Locale
): LocalizedProject {
  const i18n = projectsI18n[project.slug];
  if (!i18n) {
    return {
      title: project.title,
      summary: project.summary,
      description: project.description,
      role: project.role,
      highlights: project.highlights ?? [],
    };
  }

  return {
    title: pick(locale, i18n.title),
    summary: pick(locale, i18n.summary),
    description: pick(locale, i18n.description),
    role: i18n.role ? pick(locale, i18n.role) : project.role,
    highlights: pickList(locale, i18n.highlights),
  };
}
