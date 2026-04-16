/**
 * Auto-discover product images. Drop files into `src/assets/products/`
 * using the format:
 *
 *   "{Category} ({Code}).{ext}"                 e.g. "Rumah Roller (2DP).png"
 *   "{Category} ({Model}) - {Code}.{ext}"       e.g. "Mangkok Ganda (Vario 125) - KWN.png"
 *
 * Supported categories (match the part-name text before the first
 * parenthesis, case-insensitive):
 *   Mangkok Ganda, Rumah Roller, Tutup Rumah Roller, V-Belt,
 *   V-Belt Assy + Roller, Kampas Ganda, Kampas Rem
 *
 * Extensions: .png, .jpg, .jpeg, .webp
 */

const modules = import.meta.glob<{ default: string }>(
  '../assets/products/*.{png,jpg,jpeg,webp,PNG,JPG,JPEG,WEBP}',
  { eager: true, import: 'default' }
);

export type ParsedImage = {
  url: string;
  filename: string;      // "Rumah Roller (2DP)"
  category: string;      // "Rumah Roller"
  code: string;          // "2DP" or "KWN" or "K16 FCC"
  model?: string;        // "Vario 125" (only if filename has " - " split)
};

function parseFilename(path: string): ParsedImage | null {
  const file = path.split('/').pop() ?? path;
  const base = file.replace(/\.(png|jpe?g|webp)$/i, '');
  // 1) "Category (Model) - Code"
  const full = base.match(/^(.+?)\s*\(([^)]+)\)\s*-\s*(.+)$/);
  if (full) {
    return {
      url: '',
      filename: base,
      category: full[1].trim(),
      model: full[2].trim(),
      code: full[3].trim(),
    };
  }
  // 2) "Category (Code)"
  const simple = base.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (simple) {
    return {
      url: '',
      filename: base,
      category: simple[1].trim(),
      code: simple[2].trim(),
    };
  }
  return null;
}

export const productImages: ParsedImage[] = Object.entries(modules)
  .map(([path, url]) => {
    const parsed = parseFilename(path);
    if (parsed) parsed.url = url as unknown as string;
    return parsed;
  })
  .filter((p): p is ParsedImage => p !== null);

function norm(s: string) {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Look up an image by category + code. */
export function findImage(category: string, code: string): string | null {
  const c = norm(category);
  const k = norm(code);
  const hit = productImages.find(
    (p) => norm(p.category) === c && norm(p.code) === k
  );
  return hit?.url ?? null;
}
