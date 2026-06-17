import { education, experiences, profile } from "@/content/profile";
import { allProjects } from "@/content/projects";

/**
 * Compact, complete CV text used to ground the Fit Check assessment.
 * Built from the static content files so it's always available (no DB needed)
 * and authoritative. RAG retrieval augments this at request time.
 */
export function buildCvSummary(): string {
  const skills = Object.entries(profile.skills)
    .map(([group, items]) => `${group}: ${(items as readonly string[]).join(", ")}`)
    .join("\n");

  const roles = experiences
    .map((e) => {
      const achievements = e.achievements?.length
        ? ` Achievements: ${e.achievements.join("; ")}.`
        : "";
      return `- ${e.role} @ ${e.company} (${e.period}). ${e.description}${achievements} Stack: ${e.stack.join(", ")}.`;
    })
    .join("\n");

  const projects = allProjects
    .map(
      (p) =>
        `- ${p.title} (${p.year}${p.client ? `, ${p.client}` : ""}): ${p.summary} Tech: ${p.tags.join(", ")}.`
    )
    .join("\n");

  const studies = education
    .map(
      (ed) =>
        `- ${ed.degree} in ${ed.field}, ${ed.institution} (${ed.period})${ed.gpa ? `, GPA ${ed.gpa}` : ""}${
          ed.honors?.length ? `, ${ed.honors.join(", ")}` : ""
        }.`
    )
    .join("\n");

  return `CANDIDATE: ${profile.fullName} — ${profile.headline}
Location: ${profile.location}. ${profile.yearsOfExperience}+ years of experience.${
    profile.openToWork ? " Currently open to work." : ""
}

SUMMARY:
${profile.bio.replace(/\s+/g, " ").trim()}

SKILLS:
${skills}

EXPERIENCE:
${roles}

PROJECTS:
${projects}

EDUCATION:
${studies}`;
}
