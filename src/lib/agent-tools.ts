import { tool } from "ai";
import { z } from "zod";
import { experiences, profile } from "@/content/profile";
import { allProjects, getProjectsByVisibility } from "@/content/projects";
import { siteConfig } from "@/lib/site";
import {
  formatChunksForPrompt,
  retrieveRelevantChunks,
} from "@/lib/rag";

/**
 * Server-side tools the agent can call. Every tool returns real, JSON-serializable
 * data from the static content files (except searchCv, which hits pgvector behind a
 * try/catch) so the model can't invent projects, dates, or skills.
 */
export const agentTools = {
  getProjects: tool({
    description:
      "List Ginola's projects. Optionally filter by technology tag, category, or visibility ('public' = portfolio/demos, 'private' = client/internal work).",
    parameters: z.object({
      tag: z.string().optional().describe("Tech/keyword to filter by, e.g. 'Go', 'Next.js'"),
      category: z
        .string()
        .optional()
        .describe("One of: saas, ai, web, mobile, tool, opensource, enterprise"),
      visibility: z.string().optional().describe("'public' or 'private'"),
    }),
    execute: async ({ tag, category, visibility }) => {
      let list =
        visibility === "public" || visibility === "private"
          ? getProjectsByVisibility(visibility)
          : allProjects;
      if (tag) {
        const q = tag.toLowerCase();
        list = list.filter(
          (p) =>
            p.tags.some((x) => x.toLowerCase().includes(q)) ||
            p.title.toLowerCase().includes(q)
        );
      }
      if (category) list = list.filter((p) => p.category === category);
      return list.map((p) => ({
        title: p.title,
        summary: p.summary,
        tags: p.tags,
        year: p.year,
        category: p.category,
        client: p.client ?? null,
        url: p.liveUrl ?? (p.visibility === "private" ? null : `/projects/${p.slug}`),
      }));
    },
  }),

  getExperience: tool({
    description:
      "Get Ginola's work experience. Optionally filter by company name (partial match).",
    parameters: z.object({
      company: z.string().optional(),
    }),
    execute: async ({ company }) => {
      let list = experiences;
      if (company) {
        const q = company.toLowerCase();
        list = list.filter((e) => e.company.toLowerCase().includes(q));
      }
      return list.map((e) => ({
        company: e.company,
        role: e.role,
        period: e.period,
        location: e.location ?? null,
        description: e.description,
        achievements: e.achievements ?? [],
        stack: e.stack,
      }));
    },
  }),

  getSkills: tool({
    description:
      "Get Ginola's technical skills. Optionally filter by area: frontend, backend, databases, ai, blockchain, devops, or design.",
    parameters: z.object({
      area: z.string().optional(),
    }),
    execute: async ({ area }) => {
      const skills = profile.skills as Record<string, readonly string[]>;
      if (area) {
        const key = area.toLowerCase();
        const match = Object.keys(skills).find((k) => k.toLowerCase() === key);
        if (match) return { [match]: skills[match] };
      }
      return skills;
    },
  }),

  checkAvailability: tool({
    description:
      "Check whether Ginola is open to work and how he prefers to work (remote, location, experience level).",
    parameters: z.object({
      roleType: z
        .string()
        .optional()
        .describe("Optional role type to ask about, e.g. 'full-time', 'contract', 'part-time'"),
    }),
    execute: async () => ({
      openToWork: profile.openToWork,
      yearsOfExperience: profile.yearsOfExperience,
      location: profile.location,
      remoteFirst: true,
      note: profile.openToWork
        ? "Open to new roles — remote-first, and currently doing part-time work."
        : "Not actively looking right now.",
    }),
  }),

  getContact: tool({
    description: "Get the best ways to contact Ginola.",
    parameters: z.object({
      preferred: z
        .string()
        .optional()
        .describe("Optional preferred contact channel: email, linkedin, or github"),
    }),
    execute: async () => ({
      email: profile.email,
      location: profile.location,
      github: siteConfig.links.github,
      linkedin: siteConfig.links.linkedin,
      contactPage: "/contact",
    }),
  }),

  searchCv: tool({
    description:
      "Semantic search over Ginola's full CV, projects, and blog (RAG). Use for open-ended questions like 'strongest fintech experience' or topics not covered by the other tools.",
    parameters: z.object({
      query: z.string().describe("Natural-language search query"),
    }),
    execute: async ({ query }) => {
      try {
        const chunks = await retrieveRelevantChunks(query, { topK: 6 });
        if (chunks.length === 0) return { results: "(no matching context found)" };
        return { results: formatChunksForPrompt(chunks) };
      } catch (err) {
        console.error("[agent] searchCv failed:", err);
        return {
          results:
            "(semantic search unavailable — answer from the other tools or say so)",
        };
      }
    },
  }),
};

/** UI-facing labels live in agent-tools-meta.ts (client-safe). */
