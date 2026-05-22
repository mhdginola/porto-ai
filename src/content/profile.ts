import type {
  Certification,
  Education,
  Experience,
  Publication,
} from "@/types";

export const profile = {
  name: "Ginola",
  fullName: "Ginola",
  headline: "AI-Powered Full Stack Developer",
  tagline:
    "I build scalable, secure web apps — increasingly powered by AI and blockchain.",
  location: "Jakarta / Tangerang, Indonesia",
  email: "mhdginola@gmail.com",
  phone: "+62 822-7969-9303",
  bio: `Full Stack Web Developer with 4+ years of professional experience shipping
production systems in fintech, compliance, ERP, and AI/blockchain. I care about
clean architecture, performance, and writing code my teammates can read.

Electrical & Electronics Engineering grad (Cum Laude, Full Scholarship) —
I came into software from a problem-solving background, which still shapes
how I approach systems today: measure first, then optimize.`,
  yearsOfExperience: 4,
  openToWork: true,
  skills: {
    frontend: [
      "TypeScript",
      "JavaScript",
      "React.js",
      "Next.js",
      "Vue.js",
      "HTML",
      "CSS",
      "Tailwind CSS",
      "Bootstrap",
      "jQuery",
    ],
    backend: [
      "Golang",
      "Gin",
      "Node.js",
      "Express.js",
      "PHP",
      "Laravel",
      "Python",
      "REST APIs",
      "Clean Architecture",
    ],
    databases: ["PostgreSQL", "MySQL", "MongoDB"],
    ai: [
      "Vercel AI SDK",
      "OpenAI",
      "Groq",
      "Ollama",
      "RAG",
      "pgvector",
      "Embeddings",
      "Openclaw AI",
    ],
    blockchain: ["Hyperledger Firefly", "Hyperledger Besu", "Smart Contracts"],
    devops: [
      "Docker",
      "Kubernetes (k8s)",
      "Google Cloud Platform",
      "Git / GitHub",
      "CI/CD",
      "ETL Pipelines",
    ],
    design: ["Figma", "UI/UX Design", "Responsive Design"],
  },
  values: [
    "Ship small, learn fast",
    "Clean architecture over clever tricks",
    "Measure before you optimize",
    "Write code your future self can read",
  ],
} as const;

export const experiences: Experience[] = [
  {
    company: "Portdex",
    role: "Programmer (Part-time)",
    period: "Nov 2025 — Present",
    location: "Tangerang, Indonesia",
    description:
      "Building blockchain solutions and AI assistants for a remote-first Web3 product.",
    achievements: [
      "Designed clean-architecture services in Go for production scalability",
      "Integrated Hyperledger Firefly + Besu for asset tokenization workflows",
      "Built AI assistant features on top of Openclaw AI",
      "Deployed services to GCP-managed Kubernetes",
    ],
    stack: [
      "Golang",
      "Gin",
      "PostgreSQL",
      "Vue.js",
      "Openclaw AI",
      "Hyperledger Firefly",
      "Hyperledger Besu",
      "Kubernetes",
      "GCP",
    ],
  },
  {
    company: "PT Asta Protek Jiarsi",
    role: "Programmer",
    period: "Apr 2023 — Present",
    location: "Tangerang, Indonesia",
    description:
      "Lead developer for a regulatory-grade platform that screens suspicious banking transactions for government reporting (AML / PPATK).",
    achievements: [
      "Architected an ETL pipeline that processes millions of transactions for AML screening",
      "Implemented detection rules and reporting workflows for government compliance",
      "Applied clean architecture to keep the codebase maintainable across teams",
      "Optimized PostgreSQL queries that cut report generation time significantly",
    ],
    stack: [
      "Golang",
      "Gin",
      "PHP",
      "Laravel",
      "Python",
      "PostgreSQL",
      "ETL",
    ],
  },
  {
    company: "PT Fajar Lestari Sejati",
    role: "Programmer",
    period: "Nov 2021 — Apr 2023",
    location: "Jakarta, Indonesia",
    description:
      "Full stack engineer across internal tools, customer-facing sites, and e-learning.",
    achievements: [
      "Debugged and extended a Node.js/Express ERP serving daily operations",
      "Built an internal Warehouse Locator System for goods placement (PHP)",
      "Designed and shipped the DEON company-profile site in Next.js",
      "Built an e-learning platform for marketing staff training (Laravel)",
      "Redesigned a loyalty marketplace for better UI/UX and conversion",
    ],
    stack: ["Node.js", "Express.js", "React.js", "Next.js", "Laravel", "PHP", "MySQL"],
  },
  {
    company: "Freelance",
    role: "Automation & Web Developer",
    period: "2017 — 2021",
    location: "Remote / Padang, Indonesia",
    description:
      "Custom software & web solutions for clients across Indonesia — requirements, prototyping, delivery, and post-launch support.",
    achievements: [
      "Owned full project lifecycle from discovery to deployment",
      "Built prototypes and pitched budget proposals directly to clients",
      "Delivered tools focused on efficiency and usability",
    ],
    stack: ["PHP", "JavaScript", "MySQL", "Bootstrap"],
  },
];

export const education: Education[] = [
  {
    institution: "Universitas Negeri Padang",
    degree: "Bachelor of Applied Science",
    field: "Electrical & Electronics Engineering",
    period: "2016 — 2020",
    gpa: "3.63 / 4.00",
    honors: ["Cum Laude", "Full Scholarship"],
  },
];

export const certifications: Certification[] = [
  { name: "TOEFL ITP" },
  { name: "UI/UX Designer Certification" },
  { name: "Web Programming & Design Training" },
];

export const publications: Publication[] = [
  {
    title:
      "Simulation of Brushless DC Motor Speed Control with Fuzzy Logic Method",
    venue: "Jurnal Inovasi Teknologi dan Rekayasa",
    year: 2020,
  },
];
