import type { Project } from "@/types";

export const projects: Project[] = [
  {
    slug: "aml-transaction-screening",
    title: "AML Transaction Screening Platform",
    summary:
      "Regulatory-grade system that screens suspicious banking transactions for government reporting.",
    description: `End-to-end platform for screening suspicious financial transactions and
generating reports required by the Indonesian financial regulator (PPATK / AML).
The system ingests millions of transactions via ETL pipelines, applies detection
rules, surfaces anomalies for analyst review, and produces compliance-ready
output. Built with Go (Gin) on the backend, PHP/Laravel for legacy modules, and
PostgreSQL as the system of record — all wrapped in a clean architecture so the
domain logic stays portable across services.`,
    tags: ["Golang", "Gin", "Laravel", "PostgreSQL", "ETL", "Python"],
    category: "enterprise",
    client: "PT Asta Protek Jiarsi",
    role: "Lead Developer",
    highlights: [
      "Designed ETL pipeline to ingest millions of banking transactions",
      "Implemented detection rules for AML / PPATK compliance reporting",
      "Optimized PostgreSQL queries to cut report generation time significantly",
      "Clean-architecture codebase shared across multiple internal teams",
    ],
    year: 2023,
    featured: true,
  },
  {
    slug: "portdex-blockchain-ai",
    title: "Portdex — Blockchain + AI Assistant",
    summary:
      "Web3 product combining Hyperledger Firefly/Besu with AI assistants on top of Openclaw AI.",
    description: `Production blockchain platform with built-in AI assistants. Backend in Go
(Gin) following clean architecture, Vue.js frontend, deployed on Kubernetes
running on Google Cloud Platform. Integrated Hyperledger Firefly to manage
multi-party asset workflows, Besu network for the underlying EVM-compatible
chain, and Openclaw AI for the assistant features. I designed the system
architecture, implemented new features, and optimized performance.`,
    tags: [
      "Golang",
      "Gin",
      "Vue.js",
      "PostgreSQL",
      "Openclaw AI",
      "Hyperledger Firefly",
      "Hyperledger Besu",
      "Kubernetes",
      "GCP",
    ],
    category: "ai",
    client: "Portdex",
    role: "Programmer (Part-time)",
    highlights: [
      "Integrated Hyperledger Firefly + Besu for tokenized-asset flows",
      "Built AI assistant features on top of Openclaw AI",
      "Deployed services on GCP-managed Kubernetes",
      "Applied clean architecture for scalability and maintainability",
    ],
    year: 2025,
    featured: true,
  },
  {
    slug: "deon-company-profile",
    title: "DEON Company Profile",
    summary: "Designed and deployed a modern company profile site with Next.js.",
    description: `Marketing and company-profile site for an internal DEON brand. Built with
Next.js and React, with focus on responsive layout, performance, and a clean
content structure that the marketing team can maintain.`,
    tags: ["Next.js", "React.js", "TypeScript", "Responsive Design"],
    category: "web",
    client: "PT Fajar Lestari Sejati",
    role: "Full Stack Developer",
    highlights: [
      "End-to-end design and deployment",
      "Responsive across mobile/tablet/desktop",
      "Fast initial load + SEO-friendly structure",
    ],
    year: 2022,
    featured: true,
  },
  {
    slug: "warehouse-locator",
    title: "Warehouse Locator System",
    summary:
      "Internal tool to track and place goods across warehouses for ops teams.",
    description: `Internal PHP application used by warehouse operations to track stock
placement and quickly locate goods. Replaced a manual spreadsheet workflow,
reducing search time and human error.`,
    tags: ["PHP", "MySQL", "Bootstrap", "jQuery"],
    category: "tool",
    client: "PT Fajar Lestari Sejati",
    role: "Developer",
    highlights: [
      "Replaced spreadsheet-based workflow",
      "Reduced goods-locating time for ops team",
      "Role-based access for warehouse staff",
    ],
    year: 2022,
  },
  {
    slug: "marketing-elearning",
    title: "Marketing E-Learning Platform",
    summary: "Internal training platform for marketing staff (Laravel).",
    description: `Built a Laravel-based e-learning platform used by the marketing
department to onboard and train staff. Includes course content, progress
tracking, and quiz/assessment features.`,
    tags: ["Laravel", "PHP", "MySQL", "Bootstrap"],
    category: "web",
    client: "PT Fajar Lestari Sejati",
    role: "Developer",
    highlights: [
      "Course content + progress tracking",
      "Quiz/assessment scoring engine",
      "Used by the marketing team for onboarding",
    ],
    year: 2022,
  },
  {
    slug: "erp-enhancements",
    title: "ERP System Enhancements",
    summary:
      "Debugged and extended a Node.js/Express ERP serving daily operations.",
    description: `Owned bug-fixing and new-feature work on an existing internal ERP built in
Node.js/Express. Improvements touched inventory, reporting, and integration
modules used daily by operational staff.`,
    tags: ["Node.js", "Express.js", "JavaScript", "MySQL"],
    category: "enterprise",
    client: "PT Fajar Lestari Sejati",
    role: "Developer",
    highlights: [
      "Resolved long-standing production bugs",
      "Added new modules for reporting and integrations",
      "Improved daily operational throughput",
    ],
    year: 2022,
  },
];

export function getProjectBySlug(slug: string) {
  return projects.find((p) => p.slug === slug);
}

export function getFeaturedProjects() {
  return projects.filter((p) => p.featured);
}
