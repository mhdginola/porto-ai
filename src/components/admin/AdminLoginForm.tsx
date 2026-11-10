"use client";

import { Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace("/admin/leads");
        router.refresh();
        return;
      }
      setError(
        res.status === 429
          ? "Too many attempts. Try again later."
          : "Wrong password."
      );
    } catch {
      setError("Something went wrong.");
    }
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary-text">
            <Lock className="h-4 w-4" />
          </span>
          <div>
            <h1 className="text-base font-semibold">Admin</h1>
            <p className="text-xs text-foreground/50">Owner access only</p>
          </div>
        </div>
        <FormField
          id="admin-password"
          type="password"
          label="Password"
          autoComplete="current-password"
          autoFocus
          value={password}
          error={error ?? undefined}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" className="w-full" disabled={busy || !password}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign in
        </Button>
      </form>
    </div>
  );
}
