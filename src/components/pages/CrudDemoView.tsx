"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useTheme } from "@teispace/next-themes";
import { useCallback, useEffect, useState } from "react";
import "sweetalert2/dist/sweetalert2.min.css";
import { useLocale } from "@/components/layout/LocaleProvider";
import { confirmDialog } from "@/lib/confirm-dialog";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Modal } from "@/components/ui/Modal";
import type { DemoItem } from "@/lib/db/schema";

type FormState = { title: string; description: string };

const emptyForm: FormState = { title: "", description: "" };
const PAGE_SIZE = 5;

type ListResponse = {
  items: DemoItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function CrudDemoView() {
  const { t } = useLocale();
  const { resolvedTheme } = useTheme();
  const [items, setItems] = useState<DemoItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async (targetPage: number) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/projects/crud/items?page=${targetPage}&limit=${PAGE_SIZE}`
      );
      const data: ListResponse & { error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setItems(data.items ?? []);
      setPage(data.page ?? targetPage);
      setTotalPages(data.totalPages ?? 1);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [page, load]);

  function closeModal() {
    setModalOpen(false);
    resetForm();
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function openCreate() {
    resetForm();
    setModalOpen(true);
  }

  function openEdit(item: DemoItem) {
    setEditingId(item.id);
    setForm({ title: item.title, description: item.description });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const url =
        editingId != null
          ? `/api/projects/crud/items/${editingId}`
          : "/api/projects/crud/items";
      const res = await fetch(url, {
        method: editingId != null ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      closeModal();
      const nextPage = editingId != null ? page : 1;
      if (nextPage !== page) setPage(nextPage);
      else await load(page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    const ok = await confirmDialog({
      title: t("crudDemo.confirmDeleteTitle"),
      text: t("crudDemo.confirmDelete"),
      confirmText: t("crudDemo.delete"),
      cancelText: t("crudDemo.cancel"),
      isDark: resolvedTheme === "dark",
    });
    if (!ok) return;
    setError(null);
    try {
      const res = await fetch(`/api/projects/crud/items/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      if (modalOpen && editingId === id) closeModal();
      const nextPage =
        items.length === 1 && page > 1 ? page - 1 : page;
      if (nextPage !== page) setPage(nextPage);
      else await load(page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  const pageLabel = t("crudDemo.pageOf")
    .replace("{page}", String(page))
    .replace("{total}", String(totalPages));

  return (
    <Container className="py-16">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {t("projects.backToProjects")}
      </Link>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("crudDemo.title")}
          </h1>
          <p className="mt-2 max-w-xl text-foreground/70">
            {t("crudDemo.subtitle")}
          </p>
        </div>
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> {t("crudDemo.newItem")}
        </Button>
      </div>

      <div className="mt-10 min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">{t("crudDemo.listTitle")}</h2>
          {!loading && total > 0 && (
            <span className="text-xs text-foreground/50">
              {t("crudDemo.totalItems").replace("{count}", String(total))}
            </span>
          )}
        </div>

        {error && (
          <p className="mb-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-foreground/50">
            <Loader2 className="h-4 w-4 animate-spin" /> {t("crudDemo.loading")}
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-foreground/15 px-4 py-8 text-center text-sm text-foreground/50">
            {t("crudDemo.empty")}
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex gap-3 rounded-xl border border-foreground/10 p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.title}</p>
                  {item.description ? (
                    <p className="mt-1 text-sm text-foreground/60">
                      {item.description}
                    </p>
                  ) : null}
                  <p className="mt-2 text-[10px] text-foreground/40">
                    #{item.id} · {formatDate(item.updatedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("crudDemo.editItem")}
                    onClick={() => openEdit(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("crudDemo.delete")}
                    onClick={() => remove(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <nav
            className="mt-6 flex flex-wrap items-center justify-between gap-3"
            aria-label={t("crudDemo.pagination")}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              {t("crudDemo.prev")}
            </Button>
            <span className="text-sm text-foreground/60">{pageLabel}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              {t("crudDemo.next")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </nav>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={
          editingId != null ? t("crudDemo.editItem") : t("crudDemo.newItem")
        }
      >
        <form onSubmit={handleSubmit}>
          <label className="block text-xs font-medium text-foreground/60">
            {t("crudDemo.fieldTitle")}
          </label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="mt-1 w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
            placeholder={t("crudDemo.titlePlaceholder")}
            maxLength={120}
            required
            autoFocus
          />

          <label className="mt-3 block text-xs font-medium text-foreground/60">
            {t("crudDemo.fieldDescription")}
          </label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            rows={3}
            className="mt-1 w-full resize-y rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
            placeholder={t("crudDemo.descriptionPlaceholder")}
            maxLength={500}
          />

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={closeModal}
              disabled={saving}
            >
              {t("crudDemo.cancel")}
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingId != null ? (
                t("crudDemo.save")
              ) : (
                t("crudDemo.add")
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </Container>
  );
}

function formatDate(value: Date | string) {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
