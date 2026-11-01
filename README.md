# Investy — Marketing Website

A fast, static, dependency-free marketing site positioning Investy as a **success partner in software, scale and growth**.
Plain HTML + CSS + JavaScript: no build step, no `npm install`. Deploy the folder as-is.

```
investy-website/
├── index.html            ← all page content and copy
├── 404.html
├── robots.txt
├── sitemap.xml
├── brand/              ← the Investy logo (original file + light/dark background versions)
└── assets/
    ├── css/styles.css    ← design tokens at the top (:root)
    ├── js/main.js        ← CONFIG block at the top (form, booking, WhatsApp)
    ├── js/world-map.js   ← dotted world map with routes and live clocks (edit markers in index.html → #reach)
    ├── js/ai-effects.js  ← neural-network background, headline rotator, AI console, card glow
    └── img/
        ├── logo-light-text.png ← logo for dark backgrounds (white letters)
        ├── logo-dark-text.png  ← logo for light backgrounds (black letters)
        ├── favicon.png / apple-touch-icon.png
        ├── og-image.png  ← 1200×630 social share image
        └── work/         ← put project screenshots here
```

## Run locally

```bash
cd investy-website
python3 -m http.server 8000     # or: npx serve .
# open http://localhost:8000
```

## Deploy

Any static host works. Point it at this folder with **no build command**.

- **Netlify / Vercel / Cloudflare Pages:** drag-and-drop the folder, or connect a repo with output directory `/`.
- **cPanel / shared hosting:** upload the folder contents into `public_html/`.

Then make sure `https://investysolutions.com/` resolves, and submit `sitemap.xml` in Google Search Console.

---

## Before going live — checklist

### 1. Contact form (required)
Open `assets/js/main.js` and set `CONFIG.FORM_ENDPOINT` to a form backend that accepts JSON POSTs, for example:
- Formspree: `https://formspree.io/f/XXXXXXX`
- Getform, Basin, or a Netlify/Vercel serverless function that emails the team

Fields sent: `name`, `email`, `company`, `budget`, `message`.
**Until this is set, the form still works:** it opens WhatsApp with the visitor's message pre-filled, so no lead is lost.

### 2. Booking link (optional, recommended)
Set `CONFIG.BOOKING_URL` to a Calendly / Cal.com link. Every "Book a strategy call" button will then open it directly.

### 3. Content to confirm or replace
| Item | Where | Status |
|---|---|---|
| Working hours (`Mon – Fri · 9 AM – 5 PM`) | `index.html` → Contact | **Confirm** — the old site showed two different schedules |
| "Now accepting new projects" pill | `index.html` → Hero | Confirm it's true; remove if not |
| Stats (6+ products, 3 markets, 5+ industries) | `index.html` → Stats | Based on the public portfolio; update as you grow |
| FAQ answers (pricing model, code ownership, timelines) | `index.html` → FAQ | **Review** — make sure they match how you actually work |
| AI section + AI items in Services / FAQ | `index.html` → `#ai`, Services, FAQ | **Confirm** you offer these AI services; remove any tiles you don't |
| AI console & headline phrases | `assets/js/ai-effects.js` → `scripts`, `words` | Edit the example prompts / rotating words to match your offer |
| Tech stack chips | `index.html` → Toolkit | Edit to the tools your team really uses |
| Email address | not shown anywhere yet | Add one to Contact + footer if you want it public |
| Social links (LinkedIn / Instagram / Facebook) | `index.html` → footer `.socials` | Add once you have the URLs |
| Halal Depot & Vesty "View case study" | `index.html` → Work | Currently link to the Behance profile; point to their own case studies when published |

### 4. Project screenshots
Each project card shows a coded placeholder mockup. To use real screenshots:
1. Export images at **1600×1000** (16:10), save as `.webp` in `assets/img/work/` (e.g. `halal-depot.webp`).
2. In `index.html`, replace the `<div class="mock">…</div>` inside that card's `.case-media` with:
   ```html
   <img src="assets/img/work/halal-depot.webp" alt="Halal Depot platform homepage" width="1600" height="1000" loading="lazy">
   ```

### 5. Results on case studies (biggest conversion lever)
Each card has a commented-out outcome line. Uncomment and fill it with a real result, e.g.:
```html
<p class="case-outcome"><svg aria-hidden="true"><use href="#i-trend"/></svg>Launched in 8 weeks · orders moved fully online</p>
```
Only use numbers you can stand behind.

### 6. Testimonials
The testimonials section is built but **hidden** (`hidden` attribute on `#testimonials`). Add 2–3 real quotes (with client permission), then remove `hidden`.

### 7. Client logos
The client strip uses styled text. To use real logos, replace each `<li>` text with
`<img src="assets/img/clients/NAME.svg" alt="NAME">` — CSS already greys them out and restores colour on hover.

### 8. Analytics
Add Google Analytics / Meta Pixel snippets just before `</head>`. CTA links carry `data-cta="hero|nav|band|band-wa|wa-float|mobile-bar"` attributes so you can track which buttons convert.

---

## Light & dark mode
The site follows the visitor's system setting and has a sun/moon toggle in the header; the choice is remembered in the browser. All colours are tokens in the theme block at the top of `styles.css` (dark in `:root`, light in the `prefers-color-scheme: light` and `[data-theme="light"]` blocks). The AI console and insight card stay dark in both themes (`.force-dark`).

## Design system

Defined as CSS custom properties at the top of `assets/css/styles.css`.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0A0A0B` | Page background |
| `--surface` / `--surface-2` | `#111214` / `#17181B` | Cards, raised sections |
| `--text` / `--text-muted` | `#F4F4F5` / `#A1A1AA` | Body copy (both pass WCAG AA on `--bg`) |
| `--accent` | `#FFD400` | Investy yellow: CTAs, highlights, key numbers only |
| `--cyan` | `#7DD3FC` | Secondary "data/code" accent, used rarely |

Fonts (Google Fonts): **Space Grotesk** (headings), **Inter** (body), **JetBrains Mono** (labels, code, eyebrows).

### Built-in quality
- Fully responsive, mobile-first; tested at 390px and 1440px
- Keyboard accessible: skip link, visible focus rings, focus-trapped mobile menu (Esc to close)
- Respects `prefers-reduced-motion` (all animation, including the neural canvas, stops); canvas pauses when off-screen
- Form: visible labels, inline validation on blur, errors linked with `aria-describedby`, live status region, honeypot spam trap
- SEO: meta + Open Graph tags, JSON-LD (`ProfessionalService`), `sitemap.xml`, `robots.txt`, custom 404
- Conversion: one primary CTA repeated through the page, floating WhatsApp button (desktop), sticky "Book a call + WhatsApp" bar on mobile that hides when the contact form is on screen

## Arabic / RTL later
The page uses `dir="ltr"` on `<html>`. For an Arabic version, duplicate `index.html` as `ar/index.html`, set `lang="ar" dir="rtl"`, and add an Arabic font such as IBM Plex Sans Arabic or Noto Sans Arabic to `--font-body`.
