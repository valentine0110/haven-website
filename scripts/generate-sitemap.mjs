import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const siteUrl = (process.env.VITE_SITE_URL || "").replace(/\/$/, "");

const staticRoutes = ["/", "/properties", "/buy", "/rent", "/about", "/services", "/team", "/contact", "/faq"];

async function main() {
  if (!siteUrl) {
    console.warn("⚠️ VITE_SITE_URL is not set. Skipping sitemap generation.");
    return;
  }
  if (!url || !anonKey) {
    console.warn("⚠️ VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not set. Skipping sitemap generation.");
    return;
  }

  const supabase = createClient(url, anonKey);
  const { data, error } = await supabase.from("public_properties").select("slug,updated_at");
  if (error) throw new Error(`Sitemap query failed: ${error.message}`);
  const slugs = (data || []).map((p) => ({ path: `/properties/${encodeURIComponent(p.slug)}`, lastmod: p.updated_at }));

  const rows = [];
  for (const path of staticRoutes) rows.push({ path, changefreq: path === "/" ? "weekly" : "weekly" });
  for (const item of slugs) rows.push({ path: item.path, changefreq: "daily", lastmod: item.lastmod });

  const xmlRows = rows.map((r) => [
    `  <url><loc>${siteUrl}${r.path}</loc>`,
    r.lastmod ? `<lastmod>${new Date(r.lastmod).toISOString()}</lastmod>` : "",
    `<changefreq>${r.changefreq}</changefreq></url>`,
  ].join(""));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlRows.join("\n")}\n</urlset>\n`;
  await mkdir("public", { recursive: true });
  await writeFile("public/sitemap.xml", xml, "utf8");
  await writeFile("public/robots.txt", `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${siteUrl}/sitemap.xml\n`, "utf8");
  console.log(`Sitemap: wrote ${rows.length} URLs.`);
}

main().catch((error) => { console.error(error); process.exit(1); });
