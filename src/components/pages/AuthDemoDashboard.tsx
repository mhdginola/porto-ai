"use client";

import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Crown,
  FileText,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  Pencil,
  Save,
  Settings,
  Shield,
  ShieldCheck,
  TrendingUp,
  Users,
  Eye,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { AuthDemoRole, AuthDemoSession } from "@/lib/auth-demo/constants";
import {
  AUTH_DEMO_MODULE_IDS,
  MANAGEABLE_ROLES,
  type AuthDemoModuleId,
  type ManageableRole,
  type PermissionMatrix,
  countAllowedModules,
  hasModuleAccess,
} from "@/lib/auth-demo/permissions";
import type { TranslationKey } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

const ROLE_STYLES: Record<
  AuthDemoRole,
  { badge: string; ring: string; gradient: string; icon: typeof Shield }
> = {
  superadmin: {
    badge: "bg-amber-500/15 text-amber-600 border-amber-500/35 dark:text-amber-300",
    ring: "ring-amber-500/30",
    gradient: "from-amber-500/20 via-primary/10 to-transparent",
    icon: Crown,
  },
  admin: {
    badge: "bg-purple-500/15 text-purple-600 border-purple-500/35 dark:text-purple-300",
    ring: "ring-purple-500/30",
    gradient: "from-purple-500/20 via-primary/10 to-transparent",
    icon: ShieldCheck,
  },
  editor: {
    badge: "bg-blue-500/15 text-blue-600 border-blue-500/35 dark:text-blue-300",
    ring: "ring-blue-500/30",
    gradient: "from-blue-500/20 via-primary/10 to-transparent",
    icon: Pencil,
  },
  viewer: {
    badge: "bg-foreground/10 text-foreground/80 border-foreground/20",
    ring: "ring-foreground/20",
    gradient: "from-foreground/10 via-primary/5 to-transparent",
    icon: Eye,
  },
};

const MODULE_META: {
  id: AuthDemoModuleId;
  icon: typeof BarChart3;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  stat: string;
}[] = [
  {
    id: "analytics",
    icon: BarChart3,
    titleKey: "authDemo.panel.analytics",
    descKey: "authDemo.panel.analyticsDesc",
    stat: "12.4k",
  },
  {
    id: "content",
    icon: FileText,
    titleKey: "authDemo.panel.content",
    descKey: "authDemo.panel.contentDesc",
    stat: "86",
  },
  {
    id: "users",
    icon: Users,
    titleKey: "authDemo.panel.users",
    descKey: "authDemo.panel.usersDesc",
    stat: "24",
  },
  {
    id: "settings",
    icon: Settings,
    titleKey: "authDemo.panel.settings",
    descKey: "authDemo.panel.settingsDesc",
    stat: "—",
  },
];

const ACTIVITY_KEYS = [
  "authDemo.activity.1",
  "authDemo.activity.2",
  "authDemo.activity.3",
] as const;

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type Props = {
  user: AuthDemoSession;
  onLogout: () => void;
  t: (key: TranslationKey) => string;
};

export function AuthDemoDashboard({ user, onLogout, t }: Props) {
  const [matrix, setMatrix] = useState<PermissionMatrix | null>(null);
  const [draft, setDraft] = useState<PermissionMatrix | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [loadingPerms, setLoadingPerms] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permError, setPermError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadPermissions = useCallback(async () => {
    setLoadingPerms(true);
    setPermError(null);
    try {
      const res = await fetch("/api/projects/auth/permissions");
      if (!res.ok) throw new Error("Failed to load permissions");
      const data = await res.json();
      setMatrix(data.matrix);
      setDraft(data.matrix);
      setCanEdit(Boolean(data.canEdit));
    } catch {
      setPermError(t("authDemo.permissionsLoadError"));
    } finally {
      setLoadingPerms(false);
    }
  }, [t]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const style = ROLE_STYLES[user.role];
  const RoleIcon = style.icon;
  const activeMatrix = matrix ?? draft;
  const allowedCount = activeMatrix
    ? countAllowedModules(activeMatrix, user.role)
    : 0;

  async function handleSavePermissions() {
    if (!draft || !canEdit) return;
    setSaving(true);
    setPermError(null);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/projects/auth/permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matrix: draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setMatrix(data.matrix);
      setDraft(data.matrix);
      setSaveSuccess(true);
    } catch (e) {
      setPermError(
        e instanceof Error ? e.message : t("authDemo.permissionsSaveError")
      );
    } finally {
      setSaving(false);
    }
  }

  function togglePermission(role: ManageableRole, moduleId: AuthDemoModuleId) {
    if (!canEdit || !draft) return;
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [role]: {
          ...prev[role],
          [moduleId]: !prev[role][moduleId],
        },
      };
    });
    setSaveSuccess(false);
  }

  const stats = [
    {
      labelKey: "authDemo.stat.modules" as const,
      value: `${allowedCount}/4`,
      trend: t("authDemo.stat.modulesTrend"),
      icon: LayoutDashboard,
    },
    {
      labelKey: "authDemo.stat.role" as const,
      value: user.role,
      trend: t("authDemo.stat.roleTrend"),
      icon: RoleIcon,
    },
    {
      labelKey: "authDemo.stat.sessions" as const,
      value: "1",
      trend: t("authDemo.stat.sessionsTrend"),
      icon: Activity,
    },
    {
      labelKey: "authDemo.stat.uptime" as const,
      value: "99.9%",
      trend: t("authDemo.stat.uptimeTrend"),
      icon: TrendingUp,
    },
  ];

  const stagger = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  const displayMatrix = canEdit ? draft : matrix;
  const isDirty =
    canEdit &&
    draft &&
    matrix &&
    JSON.stringify(draft) !== JSON.stringify(matrix);

  return (
    <motion.div
      className="mt-10"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      <motion.div
        variants={item}
        className={cn(
          "relative overflow-hidden rounded-2xl border border-foreground/10 p-6 sm:p-8",
          "bg-gradient-to-br",
          style.gradient
        )}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-4">
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-2xl border text-lg font-bold",
                style.badge,
                style.ring,
                "ring-2"
              )}
            >
              {initials(user.name)}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-foreground/50">
                {t("authDemo.dashboardWelcome")}
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                {user.name}
              </h2>
              <p className="mt-1 text-sm text-foreground/60">{user.email}</p>
              <span
                className={cn(
                  "mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
                  style.badge
                )}
              >
                <RoleIcon className="h-3.5 w-3.5" />
                {user.role}
              </span>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onLogout}>
            <LogOut className="h-4 w-4" /> {t("authDemo.signOut")}
          </Button>
        </div>
      </motion.div>

      <motion.div
        variants={item}
        className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.labelKey}
              className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4 backdrop-blur-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-foreground/55">
                  {t(stat.labelKey)}
                </p>
                <div className="rounded-lg bg-primary-soft p-2">
                  <Icon className="h-4 w-4 text-primary-text" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-semibold capitalize tracking-tight">
                {stat.value}
              </p>
              <p className="mt-1 text-[11px] text-foreground/45">{stat.trend}</p>
            </div>
          );
        })}
      </motion.div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <motion.div variants={item} className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">{t("authDemo.modulesTitle")}</h3>
            <p className="text-xs text-foreground/50">{t("authDemo.rbacHint")}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {MODULE_META.map((panel) => {
              const allowed =
                displayMatrix &&
                hasModuleAccess(displayMatrix, user.role, panel.id);
              const Icon = panel.icon;
              return (
                <div
                  key={panel.id}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border p-4 transition-all duration-300",
                    allowed
                      ? "border-primary/25 bg-primary-soft/20 hover:border-primary/40 hover:shadow-md hover:shadow-primary/10"
                      : "border-foreground/5 bg-foreground/[0.02] opacity-55"
                  )}
                >
                  {allowed && (
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={cn(
                        "rounded-xl p-2.5",
                        allowed ? "bg-primary-soft" : "bg-foreground/5"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          allowed ? "text-primary-text" : "text-foreground/35"
                        )}
                      />
                    </div>
                    {allowed ? (
                      <CheckCircle2 className="h-4 w-4 text-primary-text" />
                    ) : (
                      <Lock className="h-4 w-4 text-foreground/35" />
                    )}
                  </div>
                  <p className="mt-3 font-semibold">{t(panel.titleKey)}</p>
                  <p className="mt-1 text-xs leading-relaxed text-foreground/55">
                    {t(panel.descKey)}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className={cn(
                        "text-[10px] font-semibold uppercase tracking-wide",
                        allowed ? "text-primary-text" : "text-foreground/40"
                      )}
                    >
                      {allowed
                        ? t("authDemo.accessGranted")
                        : t("authDemo.accessDeniedRole")}
                    </span>
                    {allowed && panel.stat !== "—" && (
                      <span className="text-xs font-mono text-foreground/45">
                        {panel.stat}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div variants={item} className="space-y-4">
          <div className="rounded-xl border border-foreground/10 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold">
                  {t("authDemo.permissionsTitle")}
                </h3>
                {canEdit ? (
                  <p className="mt-1 text-xs text-foreground/50">
                    {t("authDemo.permissionsEditHint")}
                  </p>
                ) : null}
              </div>
              {canEdit && isDirty ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={saving || !draft}
                  onClick={handleSavePermissions}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {t("authDemo.savePermissions")}
                </Button>
              ) : null}
            </div>

            {permError ? (
              <p className="mt-3 text-xs text-red-500">{permError}</p>
            ) : null}
            {saveSuccess ? (
              <p className="mt-3 text-xs text-primary-text">
                {t("authDemo.permissionsSaved")}
              </p>
            ) : null}

            {loadingPerms ? (
              <div className="mt-6 flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-foreground/40" />
              </div>
            ) : displayMatrix ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-foreground/45">
                      <th className="pb-2 pr-2 font-medium">
                        {t("authDemo.permModule")}
                      </th>
                      {MANAGEABLE_ROLES.map((r) => (
                        <th
                          key={r}
                          className={cn(
                            "pb-2 px-1 text-center font-medium capitalize",
                            user.role === r && "text-primary-text"
                          )}
                        >
                          {r}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {AUTH_DEMO_MODULE_IDS.map((moduleId) => {
                      const meta = MODULE_META.find((m) => m.id === moduleId)!;
                      return (
                        <tr
                          key={moduleId}
                          className="border-t border-foreground/5"
                        >
                          <td className="py-2 pr-2 font-medium">
                            {t(meta.titleKey)}
                          </td>
                          {MANAGEABLE_ROLES.map((r) => {
                            const ok = displayMatrix[r][moduleId];
                            return (
                              <td key={r} className="py-2 px-1 text-center">
                                {canEdit ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      togglePermission(r, moduleId)
                                    }
                                    className={cn(
                                      "mx-auto flex h-7 w-7 items-center justify-center rounded-md border transition-colors",
                                      ok
                                        ? "border-primary/40 bg-primary-soft text-primary-text"
                                        : "border-foreground/10 text-foreground/25 hover:border-foreground/20"
                                    )}
                                    aria-label={`${r} ${moduleId}`}
                                  >
                                    {ok ? (
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                    ) : (
                                      <span>—</span>
                                    )}
                                  </button>
                                ) : ok ? (
                                  <CheckCircle2
                                    className={cn(
                                      "mx-auto h-3.5 w-3.5",
                                      user.role === r
                                        ? "text-primary-text"
                                        : "text-foreground/35"
                                    )}
                                  />
                                ) : (
                                  <span className="text-foreground/25">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-foreground/10 p-4">
            <h3 className="text-sm font-semibold">
              {t("authDemo.activityTitle")}
            </h3>
            <ul className="mt-3 space-y-3">
              {ACTIVITY_KEYS.map((key, i) => (
                <li key={key} className="flex gap-3 text-xs">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="text-foreground/75">{t(key)}</p>
                    <p className="mt-0.5 text-foreground/40">
                      {i === 0
                        ? t("authDemo.activity.justNow")
                        : t("authDemo.activity.minutesAgo").replace(
                            "{n}",
                            String((i + 1) * 4)
                          )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
