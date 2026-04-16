import { useState } from 'react';
import type { Product } from '../data/site';
import { ClutchSpider, BrakeShoe } from './PartVisual';

/**
 * Convention-based product image:
 *
 *   1. Explicit `product.image` URL from data/site.ts (highest priority)
 *   2. /products/{code}.jpg
 *   3. /products/{code}.png
 *   4. /products/{code}.webp
 *   5. SVG fallback (ClutchSpider / BrakeShoe)
 *
 * Slashes in the part code (e.g. "K2FA/K1A") are converted to dashes
 * for the filename ("K2FA-K1A.jpg").
 */
function safeName(code: string) {
  return code.replace(/[^\w\-]+/g, '-');
}

const EXTS = ['jpg', 'png', 'webp'] as const;

export function ProductImage({
  product,
  className = '',
  imgClassName = '',
}: {
  product: Product;
  className?: string;
  imgClassName?: string;
}) {
  const [extIndex, setExtIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  if (failed || (!product.image && extIndex >= EXTS.length)) {
    const Art = product.category === 'kampas-ganda' ? ClutchSpider : BrakeShoe;
    return (
      <div className={className}>
        <Art className="w-full h-full" />
      </div>
    );
  }

  const src =
    product.image
    ?? `/products/${safeName(product.code)}.${EXTS[extIndex]}`;

  return (
    <div className={className}>
      <img
        src={src}
        alt={`${product.name} ${product.model} (${product.code})`}
        className={`w-full h-full object-contain ${imgClassName}`}
        loading="lazy"
        onError={() => {
          if (product.image) {
            setFailed(true);
          } else if (extIndex + 1 < EXTS.length) {
            setExtIndex(extIndex + 1);
          } else {
            setFailed(true);
          }
        }}
      />
    </div>
  );
}
