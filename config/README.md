# ⚙️ Config — Configuration Files

This folder contains all configuration files for the Face AI app.

---

## 📂 File Overview

| File | Description |
|---|---|
| `manifest.json` | PWA manifest — app name, icons, theme color |
| `package.json` | Node.js dependencies & scripts |
| `netlify.toml` | Netlify deployment settings |
| `robots.txt` | SEO — tells search engines what to index |
| `sitemap.xml` | SEO sitemap — all pages listed for Google |
| `ads.txt` | Authorized ad sellers declaration |

---

## 📋 File Details

### `manifest.json` — PWA Setup
Controls how the app appears when installed on phone/desktop:
- App name & short name
- Theme & background color
- Icon paths
- Display mode (standalone / fullscreen)

### `package.json` — Dependencies
```bash
npm install    # Install all dependencies listed here
```

### `netlify.toml` — Deployment
Auto-configures Netlify:
- Build command
- Publish directory
- Redirect rules
- Function paths

### `robots.txt` — SEO
Tells Google/Bing which pages to crawl and index.

### `sitemap.xml` — SEO
Full list of all pages — helps Google discover and rank all pages faster.

### `ads.txt` — Monetization
Declares authorized digital sellers for ad networks (AdSense, etc.)

---

## 🚀 Netlify Deployment

The `netlify.toml` file means **zero manual config** needed on Netlify:

1. Push to GitHub
2. Connect repo on Netlify
3. It auto-reads `netlify.toml` ✅
4. Done — live in minutes!
