# Product photos — drop files here

The site **auto-discovers** every image in this folder at build time.
No code changes needed to add or remove products.

## Filename format

Two formats are accepted:

```
{Category} ({Code}).{ext}                          # simple
{Category} ({Model}) - {Code}.{ext}                # with explicit model
```

Examples that work out of the box:

```
Rumah Roller (2DP).png
Rumah Roller (K35).jpg
V-Belt (KVY).webp
V-Belt Assy + Roller (KZL).png
Mangkok Ganda (Vario 125) - KWN.png
Mangkok Ganda (Scoopy) - K16 FCC.png
Tutup Rumah Roller (KVB).png
Kampas Ganda (Beat Esp) - K81.png
```

## Supported categories

The part name before the first parenthesis must match one of:

- `Mangkok Ganda`
- `Rumah Roller`
- `Tutup Rumah Roller`
- `V-Belt`
- `V-Belt Assy + Roller`
- `Kampas Ganda`
- `Kampas Rem`

Any file whose category prefix is not in that list is **ignored**
(the site logs nothing, it just skips). Add a new category by editing
`src/data/site.ts` → the `categories` array.

## Mapping a code to a motorcycle

The motor model is derived from a lookup table in
`src/data/site.ts` → `codeMap`. If a code is missing from the table,
the product defaults to `"Universal"`. Add your code to `codeMap`
whenever you introduce a new SKU.

## Supported extensions

`.png`, `.jpg`, `.jpeg`, `.webp` (case-insensitive).

## After adding files

If the dev server is running, Vite hot-reloads automatically within
a second. If it isn't running:

```bash
npm run dev
```
