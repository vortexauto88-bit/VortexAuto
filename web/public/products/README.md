# Product photos

Drop your product photos in **this folder** and the site picks them up
automatically. No code changes needed.

## Naming rule

Name each file using the **part code** (exactly as it appears in the
catalog), followed by `.jpg`, `.png`, or `.webp`.

Slashes (`/`) in a code become dashes (`-`) in the filename.

| Part                         | Code        | Filename        |
| ---------------------------- | ----------- | --------------- |
| Kampas Ganda Jupiter MX      | `1S7`       | `1S7.jpg`       |
| Kampas Ganda NMax 155cc      | `2DP`       | `2DP.jpg`       |
| Kampas Ganda Aerox 155cc     | `B65`       | `B65.jpg`       |
| Kampas Ganda Vario 110 CW    | `GCC/KVB`   | `GCC-KVB.jpg`   |
| Kampas Ganda Scoopy ESP      | `K2FA/K1A`  | `K2FA-K1A.jpg`  |
| Kampas Ganda Vario 125       | `KWN`       | `KWN.jpg`       |
| Kampas Ganda Beat FI         | `KZL`       | `KZL.jpg`       |

The site will try `.jpg` first, then `.png`, then `.webp`. If no file
is found for a given code, the stylized SVG illustration is shown as a
fallback — so you can add photos gradually.

## Format tips

- **Square** (1:1) or **4:3** images look best.
- Transparent PNGs (just the part cut out) match the Apple-clean theme
  perfectly.
- If you only have branded tiles (part on a blue background with logo),
  those work too — they'll just look more like the original site.
- Typical dimensions: **800 × 800** or **1200 × 900** px.
- File size: keep under ~300 KB each for fast loading. Use
  [squoosh.app](https://squoosh.app) to compress.

## Overriding a single product with a URL

If you want to point a single product at a remote URL (e.g. your CDN)
instead of a local file, edit `web/src/data/site.ts` and add an
`image` field to that product:

```ts
{ code: '1S7', name: 'Kampas Ganda', model: 'Jupiter MX', motor: 'Yamaha',
  category: 'kampas-ganda', image: 'https://cdn.example.com/1s7.jpg' },
```

The explicit `image` URL wins over the local file convention.
