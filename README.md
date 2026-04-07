# Bluesky Archive

A configurable post archive powered by the [Bluesky](https://bsky.app) public API. No authentication required.

## Quick Start

```bash
git clone https://github.com/yourname/bsky-archive.git
cd bsky-archive
npm install
npm run dev
```

## Configuration

Everything lives in **`config.yaml`**. See `config.example.yaml` for a full poetry archive setup.

### Actor

```yaml
actor: "yourname.bsky.social"   # Lock to one handle
actor: ""                        # Demo mode — prompts visitor (defaults to tn02.ink)
```

### Site & SEO

```yaml
site:
  url: "https://yourdomain.com"
  name: "My Archive"
  title: "My Archive — Custom Title"    # Defaults to site.name
  description: "Description for search engines."
  keywords: "bluesky, archive, posts"
  author: "Your Name"
  locale: "en_US"
  language: "en"
```

All injected into `<head>` at build time — `<title>`, meta description, keywords, author, canonical URL, Open Graph, Twitter Card.

### Social

```yaml
social:
  bluesky: "yourname.bsky.social"   # Profile link in footer
  twitter: "@yourhandle"            # twitter:site meta tag
```

### Icons

Supports `.ico`, `.png`, `.webp`, `.jpg`, `.svg`. Place files in `public/`.

```yaml
icons:
  favicon: "/favicon.ico"           # Classic favicon (set "" to skip)
  favicon_png: "/icon-512.png"      # Modern browsers — auto-detects mime from extension
  apple_touch: "/apple-touch.png"   # iOS home screen
```

### Open Graph / Social Cards

```yaml
og:
  image: "/preview.png"             # 1200x630 recommended
  image_width: "1200"
  image_height: "630"
  image_alt: "My Archive"           # Defaults to site.name
  type: "website"
```

### Sitemap

Generated automatically at build time into `dist/sitemap.xml`.

```yaml
sitemap:
  enabled: true
  changefreq: "daily"
  priority: "1.0"
```

### JSON-LD Structured Data

```yaml
jsonld:
  enabled: true
  type: "WebSite"                   # WebSite, CollectionPage, Blog, etc.
  genre: ["Poetry", "Creative Writing"]
```

### Feed Filters

```yaml
post_tags:                          # Required on original posts (empty = show all)
  - "#poetry"
reply_tags:                         # Required on replies (empty = show all)
  - "#haikufeels"
excluded_words:                     # Stripped from displayed text
  - "#poetry"
```

### Bio

```yaml
show_bio: false                     # Display user bio in hero section
bio_exclude:                        # Hide bio lines containing these
  - "linktr.ee"
```

### Theme

```yaml
theme:
  background: "#111318"
  text_primary: "rgba(230, 233, 240, 0.92)"
  text_secondary: "rgba(180, 190, 210, 0.65)"
  text_accent: "rgba(100, 160, 230, 0.55)"
  text_muted: "rgba(140, 150, 170, 0.3)"
  card_bg: "rgba(25, 28, 38, 0.55)"
  card_border: "rgba(100, 130, 180, 0.1)"
  card_border_hover: "rgba(120, 160, 220, 0.3)"
  card_glow: "rgba(80, 130, 200, 0.08)"
  card_accent: "rgba(100, 160, 230, 0.3)"
  accent: "rgba(100, 160, 230, 0.6)"
  accent_strong: "#4a9ade"
  loading_color: "rgba(180, 200, 230, 0.8)"
```

### Spotlights

Blurred colored circles that drift behind the content. Add, remove, or recolor freely.

```yaml
spotlights:
  - color: "rgba(70, 140, 230, 0.18)"    # Any CSS color
    size: "60vmax"                         # CSS size
    position: { top: "-10%", left: "-15%" }
    speed: 22                              # Drift cycle in seconds
    blur: 100                              # Blur radius in px

background_vignette: 0.4                   # Edge darkening (0-1)
background_noise: 0.02                     # Film grain overlay (0-1)
```

## Deploy to Cloudflare Pages

```bash
npm run build
npm run deploy
```

Or connect via Git: Cloudflare Dashboard → Workers & Pages → Create → Connect to Git. Build command: `npm run build`, output: `dist`.

### Custom Domain

Cloudflare Dashboard → Workers & Pages → your project → Custom domains.

### Optional: Bluesky Handle as Domain

1. Get your DID: `https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=yourname.bsky.social`
2. Add DNS TXT: `_atproto.yourdomain.com` → `did=did:plc:your-did-here`
3. Bluesky → Settings → Change Handle → "I have my own domain"

## Project Structure

```
bsky-archive/
├── config.yaml               # All configuration
├── config.example.yaml        # Poetry archive example
├── package.json
├── vite.config.js             # YAML → JS module, SEO injection, sitemap generation
├── wrangler.toml
├── index.html                 # Template — populated at build time
├── public/
│   ├── robots.txt
│   ├── _headers               # Security + cache
│   └── _redirects             # SPA routing
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── styles.js
    ├── utils/helpers.js
    └── components/
        ├── Spotlights.jsx     # Background blurs
        ├── Slider.jsx         # Timeline scrubber
        ├── ReadingMode.jsx    # Full-screen reader
        ├── UserPrompt.jsx     # Demo mode input
        └── Loading.jsx        # Loading animation
```

## License

MIT
