import { ImageResponse } from "next/og";
import type { CompanyTemplate } from "@/content/company-templates";

export const ogSize = { width: 1200, height: 630 };

/** Branded share image for a template (company card or catalog card). */
export function templateOgImage(t: CompanyTemplate, mode: "brand" | "catalog") {
  const dark = t.theme.dark;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: dark ? "#0a0a0a" : "#ffffff",
          backgroundImage: `radial-gradient(circle at 85% 15%, ${t.theme.primary}55, transparent 50%), radial-gradient(circle at 10% 100%, ${t.theme.accent}44, transparent 45%)`,
          color: dark ? "#fafafa" : "#0f172a",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: t.theme.primary,
              color: "#fff",
              fontSize: "36px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {t.company.name[0]}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "34px", fontWeight: 700 }}>{t.company.name}</div>
            <div style={{ fontSize: "22px", opacity: 0.65 }}>{t.company.tagline}</div>
          </div>
        </div>
        <div style={{ display: "flex", fontSize: mode === "brand" ? "58px" : "54px", fontWeight: 800, lineHeight: 1.1, maxWidth: "1000px" }}>
          {mode === "brand" ? t.hero.title : `Template website ${t.industry.id.toLowerCase()}`}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "24px" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "999px", background: t.theme.primary }} />
            <div style={{ width: "28px", height: "28px", borderRadius: "999px", background: t.theme.accent }} />
          </div>
          <div style={{ opacity: 0.7 }}>
            {mode === "brand" ? `${t.seo.locality} · ${t.contact.phone}` : "Live preview · desktop, tablet & mobile"}
          </div>
        </div>
      </div>
    ),
    ogSize
  );
}
