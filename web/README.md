# YSP Motorindo Parts — 4D Experience

A "crazy visualization" multi-route website for **YSP Motorindo Parts**
(sparepart motor & mobil). Built with Vite + React + TypeScript, Three.js
via React Three Fiber, custom GLSL shaders, Framer Motion, Tailwind CSS,
and React Router.

## What's in here

- **True 4D tesseract** (hypercube) rotated in the XW, YW, ZW planes and
  stereographically projected to 3D — not a fake "4D cube", real 4D math.
  See `src/scenes/Tesseract.tsx`.
- **Custom nebula shader** background (fBm noise, scanlines, vignette).
  See `src/shaders/NebulaBackground.tsx`.
- **Orbiting "parts field"** — torii (bearings/gears), cylinders (pistons),
  octahedra (bolts) floating through 3D space. See `src/scenes/PartsField.tsx`.
- **Post-processing**: Bloom, chromatic aberration, noise, vignette.
- **Route-aware scene**: the 3D backdrop morphs per-route (Home / Products /
  About / Contact). Scene persists across navigation with blur page transitions.
- **Multi-route** app: Home, Products (search + category filter), About,
  Contact (form that opens WhatsApp).
- **Full effects on mobile** with adaptive DPR, antialias and particle count
  for performance.
- **Cursor-reactive** global glow, glitch text, marquee, grid overlay.
- `prefers-reduced-motion` respected.

## Routes

| Path        | What it is                                       |
|-------------|--------------------------------------------------|
| `/`         | Hero with 4D tesseract, categories, featured, testimonials, CTA |
| `/products` | Searchable catalog w/ 6 categories and WA inquiry per part |
| `/about`    | Story, pillars, timeline                         |
| `/contact`  | Contact card + form that sends to WhatsApp       |

## Run it

```bash
cd web
npm install
npm run dev    # http://localhost:5173
npm run build  # production build
npm run preview
```

## Content

Content in `src/data/site.ts` is based on reasonable assumptions for an
Indonesian motorcycle/automotive spare parts shop called "YSP Motorindo Parts"
(the live site was not reachable from the build environment). Replace the
phone number, WhatsApp, email, address, and featured SKUs with real values
from yspmotorindoparts.com when ready — everything is centralized in one file.

## File map

```
web/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── public/favicon.svg
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── components/     # Nav, Footer, Reveal, RouteTransition, ScrollToTop
    ├── data/site.ts    # all content lives here
    ├── hooks/useCursorGlow.ts
    ├── routes/         # Home, Products, About, Contact
    ├── scenes/         # BackgroundCanvas, Tesseract, PartsField
    ├── shaders/        # NebulaBackground (GLSL)
    └── styles/index.css
```

## Performance notes

- Canvas DPR is clamped (`[1, 1.25]` mobile, `[1, 1.75]` desktop).
- Particle count drops on mobile; antialiasing disabled on mobile.
- Route lazy-loading via `React.lazy`.
- Scene is a single persistent `<Canvas>` shared across routes — no
  re-initialization cost on navigation.
