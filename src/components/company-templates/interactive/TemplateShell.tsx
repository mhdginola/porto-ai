"use client";

import { ArrowUp, Check, Copy, MessageCircle, X } from "lucide-react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type WhatsAppRequest = { title: string; message: string };
const Ctx = createContext<(req: WhatsAppRequest) => void>(() => {});

/** Open the WhatsApp preview from any interactive piece of a template. */
export function useWhatsApp() {
  return useContext(Ctx);
}

/**
 * Client wrapper for a template page: WhatsApp preview dialog, floating
 * WhatsApp button and back-to-top. The demo never opens wa.me — the numbers in
 * the templates are fictional and could belong to real people.
 */
export function TemplateShell({
  companyName,
  whatsapp,
  dark,
  children,
}: {
  companyName: string;
  whatsapp: string;
  dark: boolean;
  children: ReactNode;
}) {
  const [request, setRequest] = useState<WhatsAppRequest | null>(null);
  const [copied, setCopied] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!request) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setRequest(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [request]);

  function open(req: WhatsAppRequest) {
    setCopied(false);
    setRequest(req);
  }

  async function copy() {
    if (!request) return;
    try {
      await navigator.clipboard.writeText(request.message);
      setCopied(true);
    } catch {
      /* clipboard blocked (e.g. inside a sandboxed frame) */
    }
  }

  return (
    <Ctx.Provider value={open}>
      {children}

      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
        <button
          type="button"
          aria-label="Kembali ke atas"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-all duration-300",
            dark ? "bg-neutral-800 text-neutral-100" : "bg-white text-slate-700 ring-1 ring-slate-200",
            scrolled ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
          )}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => open({ title: "Chat WhatsApp", message: `Halo ${companyName}, saya ingin bertanya.` })}
          className="group flex items-center gap-2 rounded-full bg-[#25D366] py-3 pl-3 pr-4 font-semibold text-white shadow-xl transition-transform hover:scale-105"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm">Chat kami</span>
        </button>
      </div>

      {request && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-label={request.title}>
          <button type="button" aria-label="Tutup" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRequest(null)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#ECE5DD] text-slate-900 shadow-2xl">
            <div className="flex items-center gap-3 bg-[#075E54] px-4 py-3 text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                {companyName[0]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{companyName}</p>
                <p className="text-[11px] text-white/75">{whatsapp}</p>
              </div>
              <button type="button" aria-label="Tutup" onClick={() => setRequest(null)} className="rounded-full p-1 hover:bg-white/15">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-4">
              <div className="ml-auto max-w-[90%] whitespace-pre-wrap rounded-lg rounded-tr-none bg-[#DCF8C6] px-3 py-2 text-sm shadow-sm">
                {request.message}
              </div>
            </div>
            <div className="space-y-3 bg-white p-4">
              <p className="text-xs leading-relaxed text-slate-500">
                <strong className="text-slate-700">Mode demo.</strong> Di website asli, tombol ini membuka WhatsApp ke nomor
                bisnis Anda dengan pesan di atas sudah terisi.
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => void copy()} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 py-2 text-sm font-medium hover:bg-slate-50">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Tersalin" : "Salin pesan"}
                </button>
                <button type="button" onClick={() => setRequest(null)} className="flex-1 rounded-lg bg-[#25D366] py-2 text-sm font-semibold text-white">
                  Mengerti
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
