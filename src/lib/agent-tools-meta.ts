/**
 * Client-safe tool metadata (labels for UI chips). Kept separate from
 * agent-tools.ts so client components can import it without pulling in the
 * server-only tool implementations (which reach into the DB / RAG layer).
 */
export const AGENT_TOOL_NAMES = [
  "getProjects",
  "getExperience",
  "getSkills",
  "checkAvailability",
  "getContact",
  "searchCv",
] as const;

export type AgentToolName = (typeof AGENT_TOOL_NAMES)[number];

export const TOOL_META: Record<AgentToolName, { label: string }> = {
  getProjects: { label: "Projects" },
  getExperience: { label: "Experience" },
  getSkills: { label: "Skills" },
  checkAvailability: { label: "Availability" },
  getContact: { label: "Contact" },
  searchCv: { label: "CV search" },
};
