"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  LayoutDashboard,
  Package,
  Search,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLocale } from "@/components/layout/LocaleProvider";
import {
  CategoryDonut,
  RevenueAreaChart,
} from "@/components/pages/marketplace-dashboard-charts";
import { MarketplaceStatCard } from "@/components/pages/marketplace-stat-card";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import {
  marketplaceStats,
  orders,
  products,
  revenueByMonth,
  topCategories,
  type OrderStatus,
} from "@/data/marketplace-dashboard-mock";
import type { TranslationKey } from "@/lib/i18n/translations";
import {
  formatIdr,
  formatNumberKpi,
  formatOrderDate,
  formatRevenueKpi,
  formatVisitorsKpi,
} from "@/lib/format-idr";
import { cn } from "@/lib/utils";

type NavId = "overview" | "products" | "orders";

const STATUS_STYLES: Record<OrderStatus, string> = {
  paid: "bg-emerald-500/20 text-emerald-400 border-emerald-400/40 shadow-[0_0_12px_rgba(52,211,153,0.15)]",
  pending:
    "bg-amber-500/20 text-amber-400 border-amber-400/40 shadow-[0_0_12px_rgba(251,191,36,0.12)]",
  shipped:
    "bg-blue-500/20 text-blue-400 border-blue-400/40 shadow-[0_0_12px_rgba(96,165,250,0.15)]",
  cancelled:
    "bg-red-500/20 text-red-400 border-red-400/40 shadow-[0_0_12px_rgba(248,113,113,0.12)]",
};

const CATEGORY_GRADIENT: Record<string, string> = {
  Electronics: "from-emerald-500/25 via-primary/15 to-transparent",
  Food: "from-amber-500/20 via-orange-500/10 to-transparent",
  Fashion: "from-blue-500/25 via-indigo-500/10 to-transparent",
  Home: "from-yellow-500/20 via-amber-500/10 to-transparent",
  Sports: "from-purple-500/25 via-violet-500/10 to-transparent",
};

const CATEGORY_BAR: Record<string, string> = {
  Electronics: "bg-gradient-to-r from-primary to-emerald-400",
  Food: "bg-gradient-to-r from-emerald-500 to-teal-400",
  Fashion: "bg-gradient-to-r from-blue-500 to-cyan-400",
  Home: "bg-gradient-to-r from-amber-500 to-orange-400",
  Sports: "bg-gradient-to-r from-purple-500 to-violet-400",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function GlassCard({
  children,
  className,
  glow,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: "primary" | "none";
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-foreground/10 bg-background/60 shadow-xl backdrop-blur-xl",
        glow === "primary" &&
          "before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/10 before:via-transparent before:to-transparent",
        className
      )}
    >
      {children}
    </div>
  );
}

export function MarketplaceDashboardDemo() {
  const { t, locale } = useLocale();
  const [nav, setNav] = useState<NavId>("overview");
  const [query, setQuery] = useState("");
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  const loc = locale === "id" ? "id" : "en";

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [query]);

  const navItems: {
    id: NavId;
    labelKey: TranslationKey;
    icon: typeof LayoutDashboard;
  }[] = [
    { id: "overview", labelKey: "marketplace.nav.overview", icon: LayoutDashboard },
    { id: "products", labelKey: "marketplace.nav.products", icon: Package },
    { id: "orders", labelKey: "marketplace.nav.orders", icon: ShoppingCart },
  ];

  const statCards = [
    {
      label: t("marketplace.stat.revenue"),
      display: formatRevenueKpi(marketplaceStats.revenue, loc),
      change: marketplaceStats.revenueChange,
      icon: TrendingUp,
      barClass: "bg-primary",
      index: 0,
    },
    {
      label: t("marketplace.stat.orders"),
      display: {
        ...formatNumberKpi(marketplaceStats.orders, loc),
        caption: t("marketplace.stat.captionMtdOrders"),
      },
      change: marketplaceStats.ordersChange,
      icon: ShoppingCart,
      barClass: "bg-blue-500",
      index: 1,
    },
    {
      label: t("marketplace.stat.products"),
      display: {
        ...formatNumberKpi(marketplaceStats.products, loc),
        caption: t("marketplace.stat.captionMtdProducts"),
      },
      change: marketplaceStats.productsChange,
      icon: Package,
      barClass: "bg-violet-500",
      index: 2,
    },
    {
      label: t("marketplace.stat.visitors"),
      display: (() => {
        const v = formatVisitorsKpi(marketplaceStats.visitors, loc);
        return {
          ...v,
          caption: `${v.caption} — ${t("marketplace.stat.captionMtdVisitors")}`,
        };
      })(),
      change: marketplaceStats.visitorsChange,
      icon: Users,
      barClass: "bg-amber-500",
      index: 3,
    },
  ];

  const activeMonth =
    revenueByMonth.find((m) => m.label === hoveredMonth) ??
    revenueByMonth[revenueByMonth.length - 1];

  return (
    <div className="relative isolate overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
      >
        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-blue-500/10 blur-[90px]" />
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <Container className="relative py-10 sm:py-14">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-foreground/60 transition-colors hover:text-primary-text"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {t("projects.backToProjects")}
        </Link>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary-text">
              <Sparkles className="h-3.5 w-3.5" />
              {t("marketplace.badge")}
            </p>
            <h1 className="mt-2 bg-gradient-to-br from-foreground via-foreground to-foreground/60 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
              {t("marketplace.title")}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-foreground/55">
              {t("marketplace.subtitle")}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary-soft/50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary-text backdrop-blur-md">
            <Zap className="h-3 w-3" />
            {t("marketplace.demoData")}
          </span>
        </div>

        <GlassCard className="mt-8 p-1" glow="primary">
          <div className="flex flex-col gap-0 lg:flex-row">
            <aside className="border-b border-foreground/10 p-3 lg:w-56 lg:border-b-0 lg:border-r">
              <div className="mb-4 hidden px-2 lg:block">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground/40">
                  Store
                </p>
                <p className="mt-0.5 font-semibold tracking-tight">Nusantara Mart</p>
              </div>
              <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = nav === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setNav(item.id)}
                      className={cn(
                        "relative flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                        active
                          ? "text-primary-text shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_40%,transparent)]"
                          : "text-foreground/55 hover:bg-foreground/5 hover:text-foreground"
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="marketplace-nav-pill"
                          className="absolute inset-0 rounded-xl bg-primary-soft"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <Icon
                        className={cn(
                          "relative z-10 h-4 w-4",
                          active && "text-primary-text"
                        )}
                      />
                      <span className="relative z-10">{t(item.labelKey)}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <div className="min-w-0 flex-1 p-4 sm:p-5">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <div className="relative min-w-[200px] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/35" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("marketplace.searchPlaceholder")}
                    className="w-full rounded-xl border border-foreground/10 bg-foreground/[0.04] py-2.5 pl-10 pr-3 text-sm outline-none ring-primary/30 transition-shadow placeholder:text-foreground/35 focus:border-primary/40 focus:ring-2"
                  />
                </div>
                <button
                  type="button"
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-foreground/10 bg-foreground/[0.04] text-foreground/50 transition-colors hover:border-primary/30 hover:text-primary-text"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
                </button>
                <Button type="button" size="sm" variant="outline" disabled>
                  {t("marketplace.export")}
                </Button>
              </div>

              <AnimatePresence mode="wait">
                {nav === "overview" && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5"
                  >
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {statCards.map((stat) => (
                        <MarketplaceStatCard key={stat.label} {...stat} />
                      ))}
                    </div>

                    <div className="grid gap-5 lg:grid-cols-5">
                      <div className="relative overflow-hidden rounded-2xl border border-foreground/10 bg-gradient-to-br from-background/80 via-background/60 to-primary/5 p-5 backdrop-blur-xl lg:col-span-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h2 className="text-sm font-semibold">
                              {t("marketplace.chartTitle")}
                            </h2>
                            <p className="mt-1 text-sm font-medium tabular-nums text-primary-text">
                              {activeMonth.label}
                              <span className="mx-1.5 text-foreground/30">·</span>
                              {formatIdr(activeMonth.value, loc)}
                            </p>
                          </div>
                          <span className="rounded-lg border border-primary/20 bg-primary-soft/60 px-2 py-1 text-[10px] font-semibold text-primary-text">
                            +18% YoY
                          </span>
                        </div>
                        <div
                          className="mt-4 h-44"
                          onMouseLeave={() => setHoveredMonth(null)}
                        >
                          <RevenueAreaChart data={revenueByMonth} className="h-full" />
                        </div>
                        <div className="mt-1 flex justify-between gap-1 px-1">
                          {revenueByMonth.map((point) => (
                            <button
                              key={point.label}
                              type="button"
                              onMouseEnter={() => setHoveredMonth(point.label)}
                              className={cn(
                                "flex-1 rounded-md py-1 text-center text-[10px] font-medium transition-colors",
                                hoveredMonth === point.label
                                  ? "bg-primary-soft text-primary-text"
                                  : "text-foreground/35 hover:text-foreground/60"
                              )}
                            >
                              {point.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-foreground/10 bg-background/50 p-5 backdrop-blur-xl lg:col-span-2">
                        <h2 className="text-sm font-semibold">
                          {t("marketplace.categoriesTitle")}
                        </h2>
                        <CategoryDonut categories={topCategories} />
                        <ul className="mt-4 space-y-3">
                          {topCategories.map((cat, i) => (
                            <li key={cat.name}>
                              <div className="mb-1.5 flex justify-between text-xs">
                                <span className="font-medium">{cat.name}</span>
                                <span className="tabular-nums text-foreground/45">
                                  {cat.share}%
                                </span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-foreground/8">
                                <motion.div
                                  className={cn(
                                    "h-full rounded-full",
                                    CATEGORY_BAR[cat.name] ?? "bg-primary"
                                  )}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${cat.share}%` }}
                                  transition={{
                                    duration: 0.7,
                                    delay: 0.2 + i * 0.08,
                                    ease: "easeOut",
                                  }}
                                />
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-background/50 backdrop-blur-xl">
                      <div className="border-b border-foreground/10 bg-foreground/[0.03] px-5 py-4">
                        <h2 className="text-sm font-semibold">
                          {t("marketplace.recentOrders")}
                        </h2>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[520px] text-left text-sm">
                          <thead className="text-xs uppercase tracking-wider text-foreground/40">
                            <tr>
                              <th className="px-5 py-3 font-medium">ID</th>
                              <th className="px-5 py-3 font-medium">
                                {t("marketplace.col.customer")}
                              </th>
                              <th className="hidden px-5 py-3 font-medium sm:table-cell">
                                {t("marketplace.col.product")}
                              </th>
                              <th className="px-5 py-3 text-right font-medium">
                                {t("marketplace.col.amount")}
                              </th>
                              <th className="px-5 py-3 font-medium">
                                {t("marketplace.col.status")}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.slice(0, 5).map((order, i) => (
                              <motion.tr
                                key={order.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="group border-t border-foreground/5 transition-colors hover:bg-primary/[0.04]"
                              >
                                <td className="px-5 py-3.5 font-mono text-xs text-foreground/55">
                                  {order.id}
                                </td>
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-3">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/40 to-emerald-600/30 text-xs font-bold text-primary-text ring-2 ring-background">
                                      {initials(order.customer)}
                                    </span>
                                    <div className="min-w-0">
                                      <span className="block font-medium leading-snug">
                                        {order.customer}
                                      </span>
                                      <span className="mt-0.5 block truncate text-xs text-foreground/45 sm:hidden">
                                        {order.product}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="hidden max-w-[12rem] truncate px-5 py-3.5 text-foreground/65 sm:table-cell">
                                  {order.product}
                                </td>
                                <td className="whitespace-nowrap px-5 py-3.5 text-right font-semibold tabular-nums">
                                  {formatIdr(order.amount, loc)}
                                </td>
                                <td className="px-5 py-3.5">
                                  <span
                                    className={cn(
                                      "inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                                      STATUS_STYLES[order.status]
                                    )}
                                  >
                                    {t(`marketplace.status.${order.status}`)}
                                  </span>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}

                {nav === "products" && (
                  <motion.div
                    key="products"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                  >
                    {filteredProducts.map((product, i) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04 }}
                        whileHover={{ y: -6 }}
                        className={cn(
                          "group relative overflow-hidden rounded-2xl border border-foreground/10 p-4 backdrop-blur-md transition-all hover:border-primary/30 hover:shadow-[0_12px_40px_rgba(34,197,94,0.1)]",
                          `bg-gradient-to-br ${CATEGORY_GRADIENT[product.category] ?? "from-primary/10 to-transparent"}`
                        )}
                      >
                        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-100 opacity-0" />
                        <div className="relative flex items-start gap-3">
                          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-foreground/10 bg-background/80 text-3xl shadow-inner backdrop-blur-sm transition-transform group-hover:scale-105">
                            {product.image}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold leading-snug">{product.name}</p>
                            <p className="mt-0.5 text-xs font-medium text-primary-text/80">
                              {product.category}
                            </p>
                          </div>
                        </div>
                        <div className="relative mt-4 grid grid-cols-3 gap-2 text-center text-[11px]">
                          {[
                            { label: t("marketplace.col.price"), val: formatIdr(product.price, loc) },
                            { label: t("marketplace.col.stock"), val: String(product.stock) },
                            { label: t("marketplace.col.sales"), val: String(product.sales) },
                          ].map((cell) => (
                            <div
                              key={cell.label}
                              className="rounded-xl border border-foreground/8 bg-background/50 px-2 py-2.5 backdrop-blur-sm"
                            >
                              <p className="text-foreground/40">{cell.label}</p>
                              <p className="mt-0.5 font-bold tabular-nums">{cell.val}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {nav === "orders" && (
                  <motion.div
                    key="orders"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="overflow-hidden rounded-2xl border border-foreground/10 bg-background/50 backdrop-blur-xl"
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] text-left text-sm">
                        <thead className="bg-foreground/[0.04] text-xs uppercase tracking-wider text-foreground/40">
                          <tr>
                            <th className="px-5 py-3 font-medium">ID</th>
                            <th className="px-5 py-3 font-medium">
                              {t("marketplace.col.customer")}
                            </th>
                            <th className="px-5 py-3 font-medium">
                              {t("marketplace.col.product")}
                            </th>
                            <th className="px-5 py-3 text-right font-medium">
                              {t("marketplace.col.amount")}
                            </th>
                            <th className="px-5 py-3 font-medium">
                              {t("marketplace.col.status")}
                            </th>
                            <th className="px-5 py-3 font-medium">
                              {t("marketplace.col.date")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((order, i) => (
                            <motion.tr
                              key={order.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.03 }}
                              className="border-t border-foreground/5 transition-colors hover:bg-primary/[0.04]"
                            >
                              <td className="px-5 py-3.5 font-mono text-xs text-foreground/60">
                                {order.id}
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-bold">
                                    {initials(order.customer)}
                                  </span>
                                  {order.customer}
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-foreground/65">
                                {order.product}
                              </td>
                              <td className="whitespace-nowrap px-5 py-3.5 text-right font-semibold tabular-nums">
                                {formatIdr(order.amount, loc)}
                              </td>
                              <td className="px-5 py-3.5">
                                <span
                                  className={cn(
                                    "inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase",
                                    STATUS_STYLES[order.status]
                                  )}
                                >
                                  {t(`marketplace.status.${order.status}`)}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-5 py-3.5 text-foreground/50 tabular-nums">
                                {formatOrderDate(order.date, loc)}
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </GlassCard>
      </Container>
    </div>
  );
}
