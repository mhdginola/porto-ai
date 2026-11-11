import "./_loadEnv";

import { db } from "@/lib/db";
import { documents, type NewDocument } from "@/lib/db/schema";
import { EMBEDDING_PROVIDER, EMBEDDINGS_ENABLED } from "@/lib/ai";
import { embedBatch } from "@/lib/embeddings";
import {
  certifications,
  education,
  experiences,
  profile,
  publications,
} from "@/content/profile";
import { allProjects } from "@/content/projects";
import { getLocalizedProject, projectsI18n } from "@/content/projects-i18n";
import { blogPosts } from "@/content/blog";

function chunkText(text: string, maxLen = 600, overlap = 80): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLen) return [clean];

  const sentences = clean.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + " " + sentence).trim().length > maxLen) {
      if (current) chunks.push(current.trim());
      const tail = current.slice(Math.max(0, current.length - overlap));
      current = (tail + " " + sentence).trim();
    } else {
      current = (current + " " + sentence).trim();
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

type DraftDoc = Omit<NewDocument, "embedding" | "id" | "createdAt">;

function buildDocs(): DraftDoc[] {
  const docs: DraftDoc[] = [];

  chunkText(profile.bio).forEach((content, i) => {
    docs.push({
      source: "profile",
      sourceId: `bio-${i}`,
      title: `About ${profile.name}`,
      url: "/about",
      content,
      metadata: JSON.stringify({
        location: profile.location,
        yoe: profile.yearsOfExperience,
      }),
    });
  });

  for (const [group, items] of Object.entries(profile.skills)) {
    docs.push({
      source: "profile",
      sourceId: `skills-${group}`,
      title: `Skills (${group})`,
      url: "/about",
      content: `${profile.name}'s ${group} skills include: ${(
        items as readonly string[]
      ).join(", ")}.`,
      metadata: JSON.stringify({ group }),
    });
  }

  docs.push({
    source: "profile",
    sourceId: "values",
    title: "Working principles",
    url: "/about",
    content: `Principles ${profile.name} cares about: ${profile.values.join("; ")}.`,
    metadata: null,
  });

  for (const exp of experiences) {
    const achievements = exp.achievements?.length
      ? ` Key achievements: ${exp.achievements.join("; ")}.`
      : "";
    const content = `Work experience (pengalaman kerja) — ${profile.name}. ${exp.role} at ${exp.company} (${exp.period}${
      exp.location ? `, ${exp.location}` : ""
    }). ${exp.description}${achievements} Stack used: ${exp.stack.join(", ")}.`;
    chunkText(content).forEach((c, i) => {
      docs.push({
        source: "experience",
        sourceId: `${exp.company}-${i}`,
        title: `${exp.role} @ ${exp.company}`,
        url: "/about",
        content: c,
        metadata: JSON.stringify({ period: exp.period, stack: exp.stack }),
      });
    });
  }

  docs.push({
    source: "experience",
    sourceId: "career-overview",
    title: `Career overview — ${profile.name}`,
    url: "/about",
    content: `Complete work history (pengalaman kerja lengkap) for ${profile.name}: ${experiences
      .map(
        (e) =>
          `${e.role} at ${e.company} (${e.period}) — ${e.description} Highlights: ${e.achievements?.slice(0, 2).join("; ") ?? "N/A"}.`
      )
      .join(" ")}`,
    metadata: JSON.stringify({ type: "overview" }),
  });

  for (const project of allProjects) {
    const header = `Project: ${project.title} (${project.year})${
      project.client ? ` for ${project.client}` : ""
    }. ${project.summary}`;
    const body = `${project.description} Tech stack: ${project.tags.join(", ")}.${
      project.highlights?.length
        ? ` Key outcomes: ${project.highlights.join("; ")}.`
        : ""
    }${project.role ? ` Role: ${project.role}.` : ""}`;
    chunkText(`${header}\n${body}`).forEach((chunk, i) => {
      // Contextual header: later chunks keep the project's identity, so
      // details like a library name still retrieve the right project.
      const content = i === 0 ? chunk : `Project: ${project.title} (continued). ${chunk}`;
      docs.push({
        source: "project",
        sourceId: `${project.slug}-${i}`,
        title: project.title,
        url: `/${project.visibility === "private" ? "work" : "projects"}/${project.slug}`,
        content,
        metadata: JSON.stringify({
          slug: project.slug,
          year: project.year,
          category: project.category,
          tags: project.tags,
          client: project.client,
        }),
      });
    });

    // Indonesian version too, so questions asked in Bahasa Indonesia retrieve
    // projects as well (the embedding model matches poorly across languages).
    if (projectsI18n[project.slug]) {
      const id = getLocalizedProject(project, "id");
      const idText = `Proyek: ${id.title} (${project.year})${
        project.client ? ` untuk ${project.client}` : ""
      }. ${id.summary}\n${id.description} Teknologi: ${project.tags.join(", ")}.${
        id.highlights.length ? ` Hasil utama: ${id.highlights.join("; ")}.` : ""
      }`;
      chunkText(idText).forEach((chunk, i) => {
        docs.push({
          source: "project",
          sourceId: `${project.slug}-id-${i}`,
          title: project.title,
          url: `/${project.visibility === "private" ? "work" : "projects"}/${project.slug}`,
          content: i === 0 ? chunk : `Proyek: ${id.title} (lanjutan). ${chunk}`,
          metadata: JSON.stringify({ slug: project.slug, locale: "id", tags: project.tags }),
        });
      });
    }
  }

  for (const post of blogPosts) {
    const header = `Blog post: "${post.title}" (${post.date}). ${post.summary}`;
    const body = `${post.body} Tags: ${post.tags.join(", ")}.`;
    chunkText(`${header}\n${body}`).forEach((content, i) => {
      docs.push({
        source: "blog",
        sourceId: `${post.slug}-${i}`,
        title: post.title,
        url: `/blog/${post.slug}`,
        content,
        metadata: JSON.stringify({
          slug: post.slug,
          date: post.date,
          tags: post.tags,
        }),
      });
    });
  }

  for (const ed of education) {
    docs.push({
      source: "education",
      sourceId: ed.institution,
      title: `${ed.degree} @ ${ed.institution}`,
      url: "/about",
      content: `${ed.degree} in ${ed.field} at ${ed.institution} (${ed.period}).${
        ed.gpa ? ` GPA: ${ed.gpa}.` : ""
      }${ed.honors?.length ? ` Honors: ${ed.honors.join(", ")}.` : ""}`,
      metadata: JSON.stringify({ period: ed.period, honors: ed.honors }),
    });
  }

  if (certifications.length > 0) {
    docs.push({
      source: "profile",
      sourceId: "certifications",
      title: "Certifications",
      url: "/about",
      content: `Certifications: ${certifications.map((c) => c.name).join(", ")}.`,
      metadata: null,
    });
  }

  for (const pub of publications) {
    docs.push({
      source: "publication",
      sourceId: pub.title,
      title: pub.title,
      url: "/about",
      content: `Publication: "${pub.title}" in ${pub.venue} (${pub.year}).`,
      metadata: JSON.stringify({ year: pub.year, venue: pub.venue }),
    });
  }

  return docs;
}

async function main() {
  const drafts = buildDocs();

  // Without an embedding provider, documents are stored for keyword (full-text)
  // search only; re-run ingest after enabling embeddings to add vectors.
  let embeddings: (number[] | null)[];
  if (EMBEDDINGS_ENABLED) {
    console.log(`→ Built ${drafts.length} chunks. Embedding with ${EMBEDDING_PROVIDER}...`);
    embeddings = await embedBatch(drafts.map((d) => d.content));
  } else {
    console.log(
      `→ Built ${drafts.length} chunks. EMBEDDING_PROVIDER=none → keyword search only (no vectors).`
    );
    embeddings = drafts.map(() => null);
  }

  console.log("→ Clearing existing documents...");
  await db.delete(documents);

  console.log("→ Inserting...");
  const rows: NewDocument[] = drafts.map((d, i) => ({
    ...d,
    embedding: embeddings[i],
  }));

  const BATCH = 50;
  for (let i = 0; i < rows.length; i += BATCH) {
    await db.insert(documents).values(rows.slice(i, i + BATCH));
  }

  console.log(`✓ Ingested ${rows.length} documents.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
