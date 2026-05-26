"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  LogOut,
  Shield,
  ShieldCheck,
  Eye,
  Pencil,
  Users,
  Settings,
  BarChart3,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/components/layout/LocaleProvider";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { FormField } from "@/components/ui/FormField";
import type { AuthDemoRole, AuthDemoSession } from "@/lib/auth-demo/constants";
import {
  type AuthFieldErrors,
  type AuthFieldKey,
  hasFieldErrors,
  validateLoginForm,
  validateSignupForm,
} from "@/lib/auth-demo/validate-form";
import { cn } from "@/lib/utils";

const DEMO_ACCOUNTS = [
  { role: "admin" as const, email: "admin@demo.local", password: "demo123" },
  { role: "editor" as const, email: "editor@demo.local", password: "demo123" },
  { role: "viewer" as const, email: "viewer@demo.local", password: "demo123" },
];

const ROLE_STYLES: Record<
  AuthDemoRole,
  { badge: string; icon: typeof Shield }
> = {
  admin: {
    badge: "bg-purple-500/15 text-purple-600 border-purple-500/30 dark:text-purple-400",
    icon: ShieldCheck,
  },
  editor: {
    badge: "bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400",
    icon: Pencil,
  },
  viewer: {
    badge: "bg-foreground/10 text-foreground/70 border-foreground/20",
    icon: Eye,
  },
};

function canAccess(role: AuthDemoRole, minRole: AuthDemoRole): boolean {
  const order: AuthDemoRole[] = ["viewer", "editor", "admin"];
  return order.indexOf(role) >= order.indexOf(minRole);
}

export function AuthDemoView() {
  const { t } = useLocale();
  const [user, setUser] = useState<AuthDemoSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/projects/auth/session");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user ?? null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  function clearFieldError(key: AuthFieldKey) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const errors = validateLoginForm(email, password, t);
    setFieldErrors(errors);
    if (hasFieldErrors(errors)) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/projects/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      setUser(data.user);
      resetAuthForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    const errors = validateSignupForm(
      name,
      email,
      password,
      confirmPassword,
      t
    );
    setFieldErrors(errors);
    if (hasFieldErrors(errors)) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/projects/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) throw new Error(t("authDemo.emailTaken"));
        throw new Error(data.error ?? "Sign up failed");
      }
      setUser(data.user);
      resetAuthForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign up failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/projects/auth/logout", { method: "POST" });
    setUser(null);
    resetAuthForm();
  }

  function resetAuthForm() {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setFieldErrors({});
  }

  function fillDemo(account: (typeof DEMO_ACCOUNTS)[number]) {
    setMode("login");
    setEmail(account.email);
    setPassword(account.password);
    setConfirmPassword("");
    setError(null);
  }

  function switchMode(next: "login" | "signup") {
    setMode(next);
    setError(null);
    setFieldErrors({});
    setConfirmPassword("");
  }

  if (loading) {
    return (
      <Container className="flex min-h-[40vh] items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-foreground/50" />
      </Container>
    );
  }

  return (
    <Container className="py-16">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {t("projects.backToProjects")}
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
        {t("authDemo.title")}
      </h1>
      <p className="mt-2 max-w-xl text-foreground/70">{t("authDemo.subtitle")}</p>

      {!user ? (
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="rounded-xl border border-foreground/10 p-5">
            <div className="flex gap-1 rounded-lg bg-foreground/5 p-1">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  mode === "login"
                    ? "bg-background shadow-sm"
                    : "text-foreground/55 hover:text-foreground"
                )}
              >
                {t("authDemo.signIn")}
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  mode === "signup"
                    ? "bg-background shadow-sm"
                    : "text-foreground/55 hover:text-foreground"
                )}
              >
                {t("authDemo.signUp")}
              </button>
            </div>

            <form
              noValidate
              onSubmit={mode === "login" ? handleLogin : handleSignup}
              className="mt-4 space-y-3"
            >
              {mode === "signup" && (
                <FormField
                  id="auth-name"
                  label={t("authDemo.name")}
                  error={fieldErrors.name}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearFieldError("name");
                  }}
                  placeholder={t("authDemo.namePlaceholder")}
                  maxLength={80}
                  autoComplete="name"
                />
              )}

              <FormField
                id="auth-email"
                label={t("authDemo.email")}
                type="email"
                error={fieldErrors.email}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError("email");
                }}
                placeholder={
                  mode === "login" ? "admin@demo.local" : "you@example.com"
                }
                autoComplete="email"
              />

              <FormField
                id="auth-password"
                label={t("authDemo.password")}
                type="password"
                error={fieldErrors.password}
                hint={
                  mode === "signup" && !fieldErrors.password
                    ? t("authDemo.validation.passwordHint")
                    : undefined
                }
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError("password");
                }}
                placeholder={mode === "login" ? "demo123" : "••••••••"}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
              />

              {mode === "signup" && (
                <>
                  <FormField
                    id="auth-confirm-password"
                    label={t("authDemo.confirmPassword")}
                    type="password"
                    error={fieldErrors.confirmPassword}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearFieldError("confirmPassword");
                    }}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <p className="text-[11px] text-foreground/45">
                    {t("authDemo.signupRoleHint")}
                  </p>
                </>
              )}

              {error && (
                <p
                  role="alert"
                  className="flex items-start gap-1.5 rounded-md border border-red-500/25 bg-red-500/10 px-2.5 py-2 text-sm text-red-600 dark:text-red-400"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  {error}
                </p>
              )}

              <Button
                type="submit"
                size="sm"
                className="mt-4"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === "login" ? (
                  t("authDemo.signIn")
                ) : (
                  t("authDemo.signUp")
                )}
              </Button>
            </form>
          </div>

          <div className="rounded-xl border border-foreground/10 p-5">
            <h2 className="text-sm font-semibold">{t("authDemo.demoAccounts")}</h2>
            <p className="mt-1 text-xs text-foreground/55">
              {t("authDemo.demoAccountsHint")}
            </p>
            <ul className="mt-4 space-y-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <li key={acc.email}>
                  <button
                    type="button"
                    onClick={() => fillDemo(acc)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-foreground/10 px-3 py-2.5 text-left text-sm transition-colors hover:bg-foreground/5"
                  >
                    <span>
                      <span className="font-medium capitalize">{acc.role}</span>
                      <span className="mt-0.5 block text-xs text-foreground/50">
                        {acc.email}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-foreground/40">
                      demo123
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <Dashboard user={user} onLogout={handleLogout} t={t} />
      )}
    </Container>
  );
}

function Dashboard({
  user,
  onLogout,
  t,
}: {
  user: AuthDemoSession;
  onLogout: () => void;
  t: (key: import("@/lib/i18n/translations").TranslationKey) => string;
}) {
  const style = ROLE_STYLES[user.role];
  const RoleIcon = style.icon;

  const panels = [
    {
      id: "analytics",
      minRole: "viewer" as AuthDemoRole,
      icon: BarChart3,
      titleKey: "authDemo.panel.analytics" as const,
      descKey: "authDemo.panel.analyticsDesc" as const,
    },
    {
      id: "content",
      minRole: "editor" as AuthDemoRole,
      icon: Pencil,
      titleKey: "authDemo.panel.content" as const,
      descKey: "authDemo.panel.contentDesc" as const,
    },
    {
      id: "users",
      minRole: "admin" as AuthDemoRole,
      icon: Users,
      titleKey: "authDemo.panel.users" as const,
      descKey: "authDemo.panel.usersDesc" as const,
    },
    {
      id: "settings",
      minRole: "admin" as AuthDemoRole,
      icon: Settings,
      titleKey: "authDemo.panel.settings" as const,
      descKey: "authDemo.panel.settingsDesc" as const,
    },
  ];

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-foreground/10 p-4">
        <div>
          <p className="text-sm text-foreground/55">{t("authDemo.signedInAs")}</p>
          <p className="mt-0.5 font-semibold">{user.name}</p>
          <p className="text-xs text-foreground/50">{user.email}</p>
          <span
            className={cn(
              "mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              style.badge
            )}
          >
            <RoleIcon className="h-3 w-3" />
            {user.role}
          </span>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onLogout}>
          <LogOut className="h-4 w-4" /> {t("authDemo.signOut")}
        </Button>
      </div>

      <p className="mt-6 text-sm text-foreground/60">{t("authDemo.rbacHint")}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {panels.map((panel) => {
          const allowed = canAccess(user.role, panel.minRole);
          const Icon = panel.icon;
          return (
            <div
              key={panel.id}
              className={cn(
                "rounded-xl border p-4 transition-opacity",
                allowed
                  ? "border-foreground/10"
                  : "border-foreground/5 opacity-45"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "rounded-lg p-2",
                    allowed ? "bg-primary-soft" : "bg-foreground/5"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      allowed ? "text-primary-text" : "text-foreground/40"
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{t(panel.titleKey)}</p>
                  <p className="mt-1 text-xs text-foreground/55">
                    {t(panel.descKey)}
                  </p>
                  <p
                    className={cn(
                      "mt-2 text-[10px] font-medium uppercase tracking-wide",
                      allowed
                        ? "text-primary-text"
                        : "text-foreground/40"
                    )}
                  >
                    {allowed
                      ? t("authDemo.accessGranted")
                      : t("authDemo.accessDenied").replace(
                          "{role}",
                          panel.minRole
                        )}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
