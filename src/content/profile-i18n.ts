import type { Locale } from "@/lib/i18n/types";

type L = Record<Locale, string>;
type LList = Record<Locale, readonly string[]>;

export const profileI18n = {
  headline: {
    en: "AI-Powered Full Stack Developer",
    id: "Full Stack Developer berbasis AI",
  },
  bio: {
    en: `Full Stack Web Developer with 4+ years of professional experience shipping
production systems in fintech, compliance, ERP, and AI/blockchain. I care about
clean architecture, performance, and writing code my teammates can read.

Electrical & Electronics Engineering grad (Cum Laude, Full Scholarship) —
I came into software from a problem-solving background, which still shapes
how I approach systems today: measure first, then optimize.`,
    id: `Full Stack Web Developer dengan pengalaman profesional 4+ tahun membangun
sistem produksi di fintech, compliance, ERP, dan AI/blockchain. Saya peduli pada
clean architecture, performa, dan kode yang mudah dibaca tim.

Lulusan Teknik Elektro & Elektronika (Cum Laude, Beasiswa Penuh) —
Saya masuk ke software dari latar belakang problem-solving, yang masih membentuk
cara saya mendekati sistem: ukur dulu, baru optimasi.`,
  },
  values: {
    en: [
      "Ship small, learn fast",
      "Clean architecture over clever tricks",
      "Measure before you optimize",
      "Write code your future self can read",
    ],
    id: [
      "Rilis kecil, belajar cepat",
      "Clean architecture di atas trik pintar",
      "Ukur sebelum optimasi",
      "Tulis kode yang bisa dibaca diri sendiri di masa depan",
    ],
  },
} as const;

export const experienceI18n: Record<
  string,
  { role: L; description: L; achievements: LList }
> = {
  Portdex: {
    role: {
      en: "Programmer (Part-time)",
      id: "Programmer (Paruh Waktu)",
    },
    description: {
      en: "Building blockchain solutions and AI assistants for a remote-first Web3 product.",
      id: "Membangun solusi blockchain dan asisten AI untuk produk Web3 remote-first.",
    },
    achievements: {
      en: [
        "Designed clean-architecture services in Go for production scalability",
        "Integrated Hyperledger Firefly + Besu for asset tokenization workflows",
        "Built AI assistant features on top of Openclaw AI",
        "Deployed services to GCP-managed Kubernetes",
      ],
      id: [
        "Merancang layanan clean architecture di Go untuk skalabilitas produksi",
        "Mengintegrasikan Hyperledger Firefly + Besu untuk alur tokenisasi aset",
        "Membangun fitur asisten AI di atas Openclaw AI",
        "Deploy layanan ke Kubernetes yang dikelola GCP",
      ],
    },
  },
  "PT Asta Protek Jiarsi": {
    role: {
      en: "Programmer",
      id: "Programmer",
    },
    description: {
      en: "Lead developer for a regulatory-grade platform that screens suspicious banking transactions for government reporting (AML / PPATK).",
      id: "Lead developer untuk platform tingkat regulasi yang menscreen transaksi perbankan mencurigakan untuk pelaporan pemerintah (AML / PPATK).",
    },
    achievements: {
      en: [
        "Architected an ETL pipeline that processes millions of transactions for AML screening",
        "Implemented detection rules and reporting workflows for government compliance",
        "Applied clean architecture to keep the codebase maintainable across teams",
        "Optimized PostgreSQL queries that cut report generation time significantly",
      ],
      id: [
        "Merancang pipeline ETL yang memproses jutaan transaksi untuk screening AML",
        "Mengimplementasikan aturan deteksi dan alur pelaporan untuk kepatuhan pemerintah",
        "Menerapkan clean architecture agar codebase mudah dirawat lintas tim",
        "Mengoptimasi query PostgreSQL yang memangkas waktu generate laporan secara signifikan",
      ],
    },
  },
  "PT Fajar Lestari Sejati": {
    role: {
      en: "Programmer",
      id: "Programmer",
    },
    description: {
      en: "Full stack engineer across internal tools, customer-facing sites, and e-learning.",
      id: "Full stack engineer untuk internal tools, situs customer-facing, dan e-learning.",
    },
    achievements: {
      en: [
        "Debugged and extended a Node.js/Express ERP serving daily operations",
        "Built an internal Warehouse Locator System for goods placement (PHP)",
        "Designed and shipped the DEON company-profile site in Next.js",
        "Built an e-learning platform for marketing staff training (Laravel)",
        "Redesigned a loyalty marketplace for better UI/UX and conversion",
      ],
      id: [
        "Debug dan perluas ERP Node.js/Express untuk operasional harian",
        "Membangun Warehouse Locator System internal untuk penempatan barang (PHP)",
        "Merancang dan deploy situs company profile DEON dengan Next.js",
        "Membangun platform e-learning untuk pelatihan staf marketing (Laravel)",
        "Redesign marketplace loyalty untuk UI/UX dan konversi yang lebih baik",
      ],
    },
  },
  Freelance: {
    role: {
      en: "Automation & Web Developer",
      id: "Automation & Web Developer",
    },
    description: {
      en: "Custom software & web solutions for clients across Indonesia — requirements, prototyping, delivery, and post-launch support.",
      id: "Solusi software & web custom untuk klien di seluruh Indonesia — requirement, prototyping, delivery, dan dukungan pasca-launch.",
    },
    achievements: {
      en: [
        "Owned full project lifecycle from discovery to deployment",
        "Built prototypes and pitched budget proposals directly to clients",
        "Delivered tools focused on efficiency and usability",
      ],
      id: [
        "Memimpin siklus proyek penuh dari discovery hingga deployment",
        "Membangun prototype dan presentasi proposal anggaran langsung ke klien",
        "Deliver tools yang fokus pada efisiensi dan usability",
      ],
    },
  },
};

export const educationI18n = {
  degree: {
    en: "Bachelor of Applied Science",
    id: "Sarjana Terapan",
  },
  field: {
    en: "Electrical & Electronics Engineering",
    id: "Teknik Elektro & Elektronika",
  },
  honors: {
    en: ["Cum Laude", "Full Scholarship"] as const,
    id: ["Cum Laude", "Beasiswa Penuh"] as const,
  },
};

export const certificationI18n: Record<string, L> = {
  "TOEFL ITP": { en: "TOEFL ITP", id: "TOEFL ITP" },
  "UI/UX Designer Certification": {
    en: "UI/UX Designer Certification",
    id: "Sertifikasi UI/UX Designer",
  },
  "Web Programming & Design Training": {
    en: "Web Programming & Design Training",
    id: "Pelatihan Web Programming & Design",
  },
};

export const publicationI18n = {
  title: {
    en: "Simulation of Brushless DC Motor Speed Control with Fuzzy Logic Method",
    id: "Simulasi Kontrol Kecepatan Motor BLDC dengan Metode Fuzzy Logic",
  },
  venue: {
    en: "Jurnal Inovasi Teknologi dan Rekayasa",
    id: "Jurnal Inovasi Teknologi dan Rekayasa",
  },
};

export function pick<L extends Record<Locale, string>>(
  locale: Locale,
  map: L
): string {
  return map[locale];
}

export function pickList(
  locale: Locale,
  map: Record<Locale, readonly string[]>
): readonly string[] {
  return map[locale];
}
