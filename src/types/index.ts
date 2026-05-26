export type ProjectVisibility = "public" | "private";

export type Project = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  tags: string[];
  /** public = portfolio / OSS / demos; private = client & internal work */
  visibility: ProjectVisibility;
  category: "saas" | "ai" | "web" | "mobile" | "tool" | "opensource" | "enterprise";
  thumbnail?: string;
  liveUrl?: string;
  repoUrl?: string;
  highlights?: string[];
  year: number;
  client?: string;
  role?: string;
  featured?: boolean;
};

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  readingTime: number;
  tags: string[];
};

export type Experience = {
  company: string;
  role: string;
  period: string;
  location?: string;
  description: string;
  achievements?: string[];
  stack: string[];
};

export type Education = {
  institution: string;
  degree: string;
  field: string;
  period: string;
  honors?: string[];
  gpa?: string;
};

export type Certification = {
  name: string;
  issuer?: string;
  year?: number;
};

export type Publication = {
  title: string;
  venue: string;
  year: number;
  url?: string;
};
