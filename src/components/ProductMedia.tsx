import React, { useState } from 'react';
import { getMediaUrl } from '../data/catalog';
import type { Product, ProductColorway } from '../types/commerce';
import { ProductArt } from './ProductArt';

interface ProductMediaProps {
  product: Product;
  colorway: ProductColorway;
  variant?: 'primary' | 'detail' | 'lighting';
  className?: string;
  alt?: string;
  loading?: 'lazy' | 'eager';
}

/**
 * Real Hasselblad medium-format WebP studio photography renderer with smooth optical colorway
 * tone shifts, alternate macro/lighting detail crops, and graceful SVG fallback on error.
 */
export const ProductMedia: React.FC<ProductMediaProps> = ({
  product,
  colorway,
  variant = 'primary',
  className = 'h-full w-full',
  alt,
  loading = 'lazy',
}) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <ProductArt
        product={product}
        colorway={colorway}
        variant={variant === 'primary' ? 'primary' : 'detail'}
        className={className}
      />
    );
  }

  const baseFilter =
    colorway.photoFilter && colorway.photoFilter !== 'none'
      ? colorway.photoFilter
      : '';

  const variantFilter =
    variant === 'lighting'
      ? `${baseFilter} contrast(1.14) brightness(0.94)`.trim()
      : baseFilter;

  const transformClass =
    variant === 'detail'
      ? 'scale-[1.28] object-[50%_36%]'
      : variant === 'lighting'
      ? 'scale-[1.12] object-[50%_58%]'
      : 'scale-100 object-center';

  return (
    <img
      src={getMediaUrl(product.imageFile)}
      alt={alt ?? `${product.name.en} — ${colorway.name.en}`}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
      style={{ filter: variantFilter || undefined }}
      className={`${className} object-cover transition-all duration-700 ease-out ${transformClass}`}
    />
  );
};
