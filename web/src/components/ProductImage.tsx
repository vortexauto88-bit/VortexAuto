import { useState } from 'react';
import type { Product } from '../data/site';
import { ClutchSpider, BrakeShoe } from './PartVisual';

/**
 * Renders product.image if available; otherwise falls back to an SVG
 * illustration matching the category.
 */
export function ProductImage({
  product,
  className = '',
  imgClassName = '',
}: {
  product: Product;
  className?: string;
  imgClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!product.image || failed) {
    const Art =
      product.category === 'kampas-rem' ? BrakeShoe : ClutchSpider;
    return (
      <div className={className}>
        <Art className="w-full h-full" />
      </div>
    );
  }

  return (
    <div className={className}>
      <img
        src={product.image}
        alt={`${product.name} ${product.model} (${product.code})`}
        className={`w-full h-full object-contain ${imgClassName}`}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
