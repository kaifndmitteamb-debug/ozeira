import React from 'react';
import { Product } from '@/types';

interface ProductJsonLdProps {
  product: Product;
  url: string;
}

export function ProductJsonLd({ product, url }: ProductJsonLdProps) {
  const images = (product.images || []).map((img) => img.image_url);
  const primaryImage = images[0] || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=1200';

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: images.length > 0 ? images : [primaryImage],
    description: product.description || product.short_description || product.title,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Ozeira Atelier',
    },
    offers: {
      '@type': 'Offer',
      url: url,
      priceCurrency: 'INR',
      price: product.sale_price || product.base_price,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.total_stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Ozeira Atelier',
      },
    },
    aggregateRating: product.review_count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating_avg.toFixed(1),
      reviewCount: product.review_count,
      bestRating: '5',
      worstRating: '1',
    } : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}
