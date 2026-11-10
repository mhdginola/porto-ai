"use client";

import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Inbox,
  Loader2,
  LogOut,
  Mail,
  MailOpen,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  LEAD_VIEWS,
  type Lead,
  type LeadsResponse,
  type LeadStatus,
  type LeadView,
} from "@/lib/admin/types";
import { CONTACT_CATEGORIES } from "@/lib/contact/schema";
import { cn } from "@/lib/utils";

const VIEW_LABEL: Record<LeadView, string> = {
  inbox: "Inbox",
  unread: "Unread",
  archived: "Archived",
  spam: "Spam",
  all: "All",
};

const CATEGORY_LABEL: Record<string, string> = {
  job_offer: "Job offer",
  freelance: "Freelance",
  collaboration: "Collaboration",
  question: "Question",
  spam: "Spam",
  other: "Other",
  unclassified: "Unclassified",
};

const CATEGORY_STYLE: Record<string, string> = {
  job_offer: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  freelance: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  collaboration: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  question: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  spam: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
  other: "border-foreground/15 bg-foreground/5 text-foreground/60",
  unclassified: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

function CategoryBadge({ category }: { category: string | null }) {
  const key = category ?? "unclassified";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
        CATEGORY_STYLE[key]
      )}
    >
      {CATEGORY_LABEL[key]}
    </span>
  );
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
function relativeTime(iso: string) {
  const diff = (Date.parse(iso) - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return "just now";
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86_400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 30 * 86_400) return rtf.format(Math.round(diff / 86_400), "day");
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fullDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LeadsInbox() {
  const router = useRouter();
  const [view, setView] = useState<LeadView>("inbox");
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<LeadsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Debounce search input.
  useEffect(() => {
    const id = setTimeout(() => {
      setQ(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ view, page: String(page) });
    if (category) params.set("category", category);
    if (q.trim()) params.set("q", q.trim());
    try {
      const res = await fetch(`/api/admin/leads?${params}`, { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) throw new Error();
      setData((await res.json()) as LeadsResponse);
      setError(null);
    } catch {
      setError("Could not load leads.");
    } finally {
      setLoading(false);
    }
  }, [view, category, q, page, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState runs after the fetch resolves
    void load();
  }, [load]);

  async function patchStatus(lead: Lead, status: LeadStatus) {
    setBusy(status);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      const { lead: updated } = (await res.json()) as { lead: Lead };
      setSelected((cur) => (cur?.id === updated.id ? updated : cur));
      await load();
    } catch {
      setError("Update failed.");
    } finally {
      setBusy(null);
    }
  }

  async function reclassify(lead: Lead) {
    setBusy("ai");
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}/classify`, { method: "POST" });
      if (!res.ok) throw new Error();
      const { lead: updated } = (await res.json()) as { lead: Lead };
      setSelected(updated);
      await load();
    } catch {
      setError("Re-running AI failed.");
    } finally {
      setBusy(null);
    }
  }

  function open(lead: Lead) {
    setSelected(lead);
    setCopied(false);
    if (lead.status === "new") void patchStatus(lead, "read");
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  async function copyReply(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  const stats = data?.stats;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/45">Admin</p>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => void load()} aria-label="Refresh">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => void logout()}>
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Button>
        </div>
      </header>

      {/* Stats */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Unread", value: stats?.unread, tone: "text-primary-text" },
          { label: "High priority unread", value: stats?.highPriorityUnread, tone: "text-amber-600 dark:text-amber-400" },
          { label: "Spam", value: stats?.spam, tone: "text-foreground/60" },
          { label: "Total", value: stats?.total, tone: "text-foreground" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-3">
            <p className="text-[11px] text-foreground/50">{s.label}</p>
            <p className={cn("mt-1 text-2xl font-semibold tabular-nums", s.tone)}>{s.value ?? "–"}</p>
          </div>
        ))}
      </div>
      {stats && Object.keys(stats.last30Days).length > 0 && (
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-foreground/50">
          Last 30 days:
          {Object.entries(stats.last30Days)
            .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
            .map(([cat, n]) => (
              <span key={cat} className="rounded-full bg-foreground/5 px-2 py-0.5">
                {CATEGORY_LABEL[cat] ?? cat} {n}
              </span>
            ))}
        </p>
      )}

      {/* Filters */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-lg border border-foreground/10 p-1">
          {(Object.keys(LEAD_VIEWS) as LeadView[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setView(v);
                setPage(1);
              }}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                view === v ? "bg-foreground text-background" : "text-foreground/60 hover:text-foreground"
              )}
            >
              {VIEW_LABEL[v]}
              {v === "unread" && stats?.unread ? ` (${stats.unread})` : ""}
            </button>
          ))}
        </div>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="h-8 rounded-lg border border-foreground/15 bg-background px-2 text-xs"
          aria-label="Category"
        >
          <option value="">All categories</option>
          {[...CONTACT_CATEGORIES, "unclassified"].map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/35" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, company, message…"
            className="h-8 w-full rounded-lg border border-foreground/15 bg-background pl-8 pr-2 text-xs outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-md border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {/* List + detail */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className={cn("min-w-0", selected && "hidden lg:block")}>
          <div className="overflow-hidden rounded-xl border border-foreground/10">
            {loading && !data ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-foreground/40" />
              </div>
            ) : data && data.items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-sm text-foreground/50">
                <Inbox className="h-6 w-6" />
                No messages here.
              </div>
            ) : (
              <ul className="divide-y divide-foreground/5">
                {data?.items.map((lead) => (
                  <li key={lead.id}>
                    <button
                      type="button"
                      onClick={() => open(lead)}
                      className={cn(
                        "flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-foreground/[0.03]",
                        selected?.id === lead.id && "bg-primary-soft/40"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {lead.status === "new" && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
                        )}
                        <span className={cn("truncate text-sm", lead.status === "new" ? "font-semibold" : "font-medium text-foreground/80")}>
                          {lead.name}
                        </span>
                        {lead.company && (
                          <span className="truncate text-xs text-foreground/45">· {lead.company}</span>
                        )}
                        <span className="ml-auto shrink-0 text-[11px] text-foreground/45">
                          {relativeTime(lead.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CategoryBadge category={lead.category} />
                        {lead.priority === "high" && (
                          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">⚡ High</span>
                        )}
                      </div>
                      <p className="line-clamp-2 text-xs text-foreground/55">
                        {lead.summary ?? lead.message}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {data && totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between text-xs text-foreground/55">
              <span>
                Page {data.page} of {totalPages} · {data.total} messages
              </span>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </section>

        <section className={cn("min-w-0", !selected && "hidden lg:block")}>
          {selected ? (
            <LeadDetail
              lead={selected}
              busy={busy}
              copied={copied}
              onBack={() => setSelected(null)}
              onStatus={(s) => void patchStatus(selected, s)}
              onReclassify={() => void reclassify(selected)}
              onCopy={(text) => void copyReply(text)}
            />
          ) : (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-foreground/15 text-sm text-foreground/45">
              <MailOpen className="h-6 w-6" />
              Select a message to read it.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function LeadDetail({
  lead,
  busy,
  copied,
  onBack,
  onStatus,
  onReclassify,
  onCopy,
}: {
  lead: Lead;
  busy: string | null;
  copied: boolean;
  onBack: () => void;
  onStatus: (status: LeadStatus) => void;
  onReclassify: () => void;
  onCopy: (text: string) => void;
}) {
  const subject = `Re: ${lead.summary ? lead.summary.slice(0, 80) : "your message"}`;
  const mailto = `mailto:${lead.email}?subject=${encodeURIComponent(subject)}${
    lead.suggestedReply ? `&body=${encodeURIComponent(lead.suggestedReply)}` : ""
  }`;
  const needsAi = !lead.category || !!lead.aiError;

  return (
    <article className="rounded-xl border border-foreground/10 p-5">
      <button
        type="button"
        onClick={onBack}
        className="mb-3 inline-flex items-center gap-1 text-xs text-foreground/55 hover:text-foreground lg:hidden"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">{lead.name}</h2>
          <p className="truncate text-sm text-foreground/60">
            <a href={`mailto:${lead.email}`} className="hover:underline">
              {lead.email}
            </a>
            {lead.company && <> · {lead.company}</>}
          </p>
          <p className="mt-1 text-[11px] text-foreground/45">
            {fullDate(lead.createdAt)} · {lead.locale.toUpperCase()} · #{lead.id}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <CategoryBadge category={lead.category} />
          {lead.confidence != null && (
            <span className="text-[10px] text-foreground/45">{lead.confidence}%</span>
          )}
          {lead.priority && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                lead.priority === "high"
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  : "bg-foreground/5 text-foreground/55"
              )}
            >
              {lead.priority}
            </span>
          )}
        </div>
      </div>

      {lead.summary && (
        <p className="mt-4 flex gap-2 rounded-lg bg-primary-soft/40 px-3 py-2 text-sm">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary-text" />
          {lead.summary}
        </p>
      )}
      {lead.aiError && (
        <p className="mt-4 flex gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          AI triage failed: {lead.aiError}
        </p>
      )}

      <h3 className="mt-5 text-xs font-semibold uppercase tracking-wider text-foreground/45">Message</h3>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">{lead.message}</p>

      {lead.suggestedReply && (
        <>
          <div className="mt-5 flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/45">
              Suggested reply (AI draft)
            </h3>
            <button
              type="button"
              onClick={() => onCopy(lead.suggestedReply!)}
              className="inline-flex items-center gap-1 text-[11px] text-foreground/55 hover:text-foreground"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-2 whitespace-pre-wrap rounded-lg bg-foreground/[0.04] px-3 py-2 text-sm leading-relaxed text-foreground/80">
            {lead.suggestedReply}
          </p>
        </>
      )}

      <div className="mt-5 flex flex-wrap gap-2 border-t border-foreground/10 pt-4">
        <a
          href={mailto}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Mail className="h-3.5 w-3.5" />
          {lead.suggestedReply ? "Reply with draft" : "Reply"}
        </a>
        {lead.status === "read" && (
          <Button size="sm" variant="outline" disabled={!!busy} onClick={() => onStatus("new")}>
            <MailOpen className="h-3.5 w-3.5" /> Mark unread
          </Button>
        )}
        {lead.status === "archived" ? (
          <Button size="sm" variant="outline" disabled={!!busy} onClick={() => onStatus("read")}>
            <Inbox className="h-3.5 w-3.5" /> Move to inbox
          </Button>
        ) : (
          lead.status !== "spam" && (
            <Button size="sm" variant="outline" disabled={!!busy} onClick={() => onStatus("archived")}>
              <Archive className="h-3.5 w-3.5" /> Archive
            </Button>
          )
        )}
        {lead.status === "spam" ? (
          <Button size="sm" variant="outline" disabled={!!busy} onClick={() => onStatus("read")}>
            <ShieldCheck className="h-3.5 w-3.5" /> Not spam
          </Button>
        ) : (
          <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => onStatus("spam")}>
            <ShieldAlert className="h-3.5 w-3.5" /> Spam
          </Button>
        )}
        <Button
          size="sm"
          variant={needsAi ? "outline" : "ghost"}
          disabled={!!busy}
          onClick={onReclassify}
          className="ml-auto"
        >
          {busy === "ai" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          Re-run AI
        </Button>
      </div>

      <p className="mt-4 text-[11px] text-foreground/40">
        {lead.notifiedAt ? `Email notification sent ${relativeTime(lead.notifiedAt)}` : "No email notification sent"}
        {" · "}
        {lead.autoRepliedAt ? "auto-reply sent" : "no auto-reply"}
        {lead.aiModel && ` · ${lead.aiModel}`}
      </p>
    </article>
  );
}
