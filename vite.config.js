import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import yaml from "js-yaml";

const configPath = resolve(__dirname, "config.yaml");
const cfg = yaml.load(readFileSync(configPath, "utf8"));
const site = cfg.site || {};
const og = cfg.og || {};
const icons = cfg.icons || {};
const social = cfg.social || {};

const url = (site.url || "https://example.com").replace(/\/$/, "");
const name = site.name || "Bluesky Archive";
const title = site.title || name;
const desc = site.description || "";
const bg = cfg.theme?.background || "#111318";

function buildIconTags() {
  const tags = [];
  if (icons.favicon) tags.push(`<link rel="icon" href="${icons.favicon}" />`);
  if (icons.favicon_png) {
    const ext = icons.favicon_png.split(".").pop().toLowerCase();
    const mime = { png: "image/png", webp: "image/webp", jpg: "image/jpeg", jpeg: "image/jpeg", svg: "image/svg+xml", ico: "image/x-icon" }[ext] || "image/png";
    tags.push(`<link rel="icon" type="${mime}" href="${icons.favicon_png}" />`);
  }
  if (icons.apple_touch) tags.push(`<link rel="apple-touch-icon" href="${icons.apple_touch}" />`);
  return tags.join("\n  ");
}

function buildJsonLd() {
  if (!cfg.jsonld?.enabled) return "";
  const ld = {
    "@context": "https://schema.org",
    "@type": cfg.jsonld.type || "WebSite",
    name: name,
    url: url,
    description: desc,
    inLanguage: site.language || "en",
  };
  if (site.author) {
    ld.author = { "@type": "Person", name: site.author };
    const bsky = social.bluesky || cfg.actor;
    if (bsky) ld.author.url = `https://bsky.app/profile/${bsky}`;
  }
  if (og.image) ld.image = `${url}${og.image}`;
  if (cfg.jsonld.genre?.length) ld.genre = cfg.jsonld.genre;
  return `<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}

function buildMetaTags() {
  const tags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${desc}" />`,
    `<meta name="theme-color" content="${bg}" />`,
    `<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />`,
    `<link rel="canonical" href="${url}" />`,
  ];
  if (site.keywords) tags.push(`<meta name="keywords" content="${site.keywords}" />`);
  if (site.author) tags.push(`<meta name="author" content="${site.author}" />`);

  // Open Graph
  tags.push(`<meta property="og:title" content="${title}" />`);
  tags.push(`<meta property="og:description" content="${desc}" />`);
  tags.push(`<meta property="og:type" content="${og.type || "website"}" />`);
  tags.push(`<meta property="og:url" content="${url}" />`);
  tags.push(`<meta property="og:site_name" content="${name}" />`);
  tags.push(`<meta property="og:locale" content="${site.locale || "en_US"}" />`);
  if (og.image) {
    tags.push(`<meta property="og:image" content="${url}${og.image}" />`);
    if (og.image_width) tags.push(`<meta property="og:image:width" content="${og.image_width}" />`);
    if (og.image_height) tags.push(`<meta property="og:image:height" content="${og.image_height}" />`);
    tags.push(`<meta property="og:image:alt" content="${og.image_alt || name}" />`);
  }

  // Twitter
  tags.push(`<meta name="twitter:card" content="summary_large_image" />`);
  tags.push(`<meta name="twitter:title" content="${title}" />`);
  tags.push(`<meta name="twitter:description" content="${desc}" />`);
  if (og.image) {
    tags.push(`<meta name="twitter:image" content="${url}${og.image}" />`);
    tags.push(`<meta name="twitter:image:alt" content="${og.image_alt || name}" />`);
  }
  if (social.twitter) tags.push(`<meta name="twitter:site" content="${social.twitter}" />`);

  return tags.join("\n  ");
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: "yaml-config",
      resolveId(id) { if (id === "virtual:config") return "\0virtual:config"; },
      load(id) { if (id === "\0virtual:config") return `export default ${JSON.stringify(cfg)};`; },

      transformIndexHtml(html) {
        return html
          .replace("<!-- __META__ -->", buildMetaTags())
          .replace("<!-- __ICONS__ -->", buildIconTags())
          .replace("<!-- __JSONLD__ -->", buildJsonLd())
          .replace(/__THEME_BG__/g, bg)
          .replace(/__LANG__/g, site.language || "en");
      },

      // Generate sitemap.xml at build time
      closeBundle() {
        if (!cfg.sitemap?.enabled) return;
        const sm = cfg.sitemap;
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${url}/</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>${sm.changefreq || "daily"}</changefreq>
    <priority>${sm.priority || "1.0"}</priority>${og.image ? `
    <image:image>
      <image:loc>${url}${og.image}</image:loc>
      <image:title>${name}</image:title>
    </image:image>` : ""}
  </url>
</urlset>`;
        try {
          mkdirSync(resolve(__dirname, "dist"), { recursive: true });
          writeFileSync(resolve(__dirname, "dist/sitemap.xml"), sitemap);
        } catch (e) { console.warn("Could not write sitemap.xml:", e.message); }
      },
    },
  ],
});
