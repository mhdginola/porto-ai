import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = `${siteConfig.name} — ${siteConfig.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "#0a0a0a",
          backgroundImage:
            "radial-gradient(ellipse at top left, rgba(134,239,172,0.18), transparent 55%)",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "9999px",
              background: "#86efac",
            }}
          />
          <div style={{ fontSize: "28px", color: "#86efac", letterSpacing: "0.04em" }}>
            {siteConfig.url.replace(/^https?:\/\//, "")}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ fontSize: "92px", fontWeight: 700, letterSpacing: "-0.03em" }}>
            {siteConfig.name}
          </div>
          <div style={{ fontSize: "44px", color: "#86efac", fontWeight: 600 }}>
            {siteConfig.title}
          </div>
        </div>

        <div style={{ fontSize: "30px", color: "rgba(250,250,250,0.6)", maxWidth: "900px" }}>
          {siteConfig.description}
        </div>
      </div>
    ),
    { ...size }
  );
}
