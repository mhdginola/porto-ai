import type { ReactNode } from "react";

/**
 * A tiny, dependency-free Markdown-ish renderer for blog post bodies.
 * Supports: `## ` / `### ` headings, fenced code blocks (``` or ~~~ with an
 * optional language label), ordered (`1. `) and unordered (`- `) lists, plus
 * inline `code` and **bold** inside paragraphs and list items.
 */

type Block =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "code"; lang?: string; code: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "p"; text: string };

const FENCE = /^(```|~~~)/;
const ORDERED = /^\d+\.\s+/;

function parseBlocks(body: string): Block[] {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block (may contain blank lines).
    if (FENCE.test(line)) {
      const lang = line.replace(FENCE, "").trim() || undefined;
      const code: string[] = [];
      i++;
      while (i < lines.length && !FENCE.test(lines[i])) {
        code.push(lines[i]);
        i++;
      }
      i++; // consume closing fence
      blocks.push({ type: "code", lang, code: code.join("\n") });
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push({ type: "h3", text: line.slice(4) });
      i++;
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push({ type: "h2", text: line.slice(3) });
      i++;
      continue;
    }

    if (ORDERED.test(line)) {
      const items: string[] = [];
      while (i < lines.length && ORDERED.test(lines[i])) {
        items.push(lines[i].replace(ORDERED, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // Paragraph: join consecutive non-blank, non-block lines.
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !FENCE.test(lines[i]) &&
      !lines[i].startsWith("## ") &&
      !lines[i].startsWith("### ") &&
      !ORDERED.test(lines[i]) &&
      !lines[i].startsWith("- ")
    ) {
      para.push(lines[i]);
      i++;
    }
    blocks.push({ type: "p", text: para.join(" ") });
  }

  return blocks;
}

/** Render inline `code` and **bold** spans within a line of text. */
function renderInline(text: string, keyBase: string): ReactNode[] {
  return text.split(/(`[^`]+`)/g).flatMap((segment, ci) => {
    if (segment.startsWith("`") && segment.endsWith("`")) {
      return [
        <code
          key={`${keyBase}-c${ci}`}
          className="rounded border border-foreground/10 bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[0.85em] text-foreground/90"
        >
          {segment.slice(1, -1)}
        </code>,
      ];
    }
    return segment.split(/(\*\*[^*]+\*\*)/g).map((part, bi) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={`${keyBase}-b${ci}-${bi}`} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={`${keyBase}-t${ci}-${bi}`}>{part}</span>
      )
    );
  });
}

export function MarkdownLite({ body }: { body: string }) {
  const blocks = parseBlocks(body);

  return (
    <div className="mt-10 max-w-2xl">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "h2":
            return (
              <h2
                key={i}
                className="mt-12 flex items-center gap-3 text-xl font-semibold tracking-tight first:mt-0"
              >
                <span className="h-5 w-1 rounded-full bg-primary" aria-hidden />
                {block.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="mt-8 text-base font-semibold tracking-tight text-foreground/90">
                {renderInline(block.text, `h3-${i}`)}
              </h3>
            );
          case "code":
            return (
              <div
                key={i}
                className="mt-5 overflow-hidden rounded-lg border border-foreground/10 bg-foreground/[0.03]"
              >
                {block.lang && (
                  <div className="border-b border-foreground/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider text-foreground/40">
                    {block.lang}
                  </div>
                )}
                <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[12.5px] leading-relaxed text-foreground/80">
                  <code>{block.code}</code>
                </pre>
              </div>
            );
          case "ul":
            return (
              <ul
                key={i}
                className="mt-4 list-disc space-y-1.5 pl-5 text-[15px] leading-7 text-foreground/75 marker:text-primary/70"
              >
                {block.items.map((item, j) => (
                  <li key={j}>{renderInline(item, `ul-${i}-${j}`)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol
                key={i}
                className="mt-4 list-decimal space-y-2 pl-5 text-[15px] leading-7 text-foreground/75 marker:font-semibold marker:text-foreground/40"
              >
                {block.items.map((item, j) => (
                  <li key={j} className="pl-1">
                    {renderInline(item, `ol-${i}-${j}`)}
                  </li>
                ))}
              </ol>
            );
          default:
            return (
              <p key={i} className="mt-4 text-[15px] leading-7 text-foreground/75">
                {renderInline(block.text, `p-${i}`)}
              </p>
            );
        }
      })}
    </div>
  );
}
