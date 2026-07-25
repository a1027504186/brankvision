import type { AgentAssetKind } from "./types";

const OUTPUT_SIZE: Record<Exclude<AgentAssetKind, "brand-logo">, { width: number; height: number }> = {
  "meituan-cover": { width: 1024, height: 1024 },
  "meituan-service": { width: 1024, height: 1024 },
  "xhs-profile": { width: 1024, height: 768 },
  "xhs-note": { width: 1024, height: 1365 },
  "wechat-cover": { width: 1024, height: 768 },
  "wechat-poster": { width: 1024, height: 1820 },
};

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character]!);
}

async function toDataUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to load brand image: ${response.status}`);
  const contentType = response.headers.get("content-type") || "image/png";
  return `data:${contentType};base64,${Buffer.from(await response.arrayBuffer()).toString("base64")}`;
}

export async function composeExactBrandIdentity(
  sourceUrl: string,
  logoUrl: string,
  kind: Exclude<AgentAssetKind, "brand-logo">,
  palette: string[],
) {
  const { width, height } = OUTPUT_SIZE[kind];
  const [source, logo] = await Promise.all([toDataUrl(sourceUrl), toDataUrl(logoUrl)]);
  const markSize = Math.round(width * 0.14);
  const margin = Math.round(width * 0.045);
  const badgePadding = Math.round(markSize * 0.13);
  const badgeSize = markSize + badgePadding * 2;
  const stripeHeight = Math.max(8, Math.round(height * 0.006));
  const [primary = "#2C3E50", secondary = "#BDC3C7", accent = "#E07A5F"] = palette;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <image href="${escapeXml(source)}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>
  <rect x="0" y="0" width="${Math.round(width * 0.68)}" height="${stripeHeight}" fill="${escapeXml(primary)}"/>
  <rect x="${Math.round(width * 0.68)}" y="0" width="${Math.round(width * 0.2)}" height="${stripeHeight}" fill="${escapeXml(secondary)}"/>
  <rect x="${Math.round(width * 0.88)}" y="0" width="${Math.round(width * 0.12)}" height="${stripeHeight}" fill="${escapeXml(accent)}"/>
  <rect x="${width - margin - badgeSize}" y="${margin}" width="${badgeSize}" height="${badgeSize}" rx="${Math.round(badgeSize * 0.22)}" fill="#FFFFFF" fill-opacity="0.94"/>
  <image href="${escapeXml(logo)}" x="${width - margin - badgeSize + badgePadding}" y="${margin + badgePadding}" width="${markSize}" height="${markSize}" preserveAspectRatio="xMidYMid meet"/>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
