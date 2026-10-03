/**
 * Temporary mock catalogue data. Categories will come from the backend; screens must only
 * use the functions exported here so swapping in the API later touches this file alone.
 */

import type { Category } from '@/types/catalog';

const categories: Category[] = [
  {
    id: 'cat-1',
    name: 'Stationery',
    slug: 'stationery',
    description: 'Notebooks, pens and school supplies',
    imageUrl: null,
    displayOrder: 1,
    isActive: true,
  },
  {
    id: 'cat-2',
    name: 'Gift Items',
    slug: 'gift-items',
    description: 'Mugs, frames and gift boxes',
    imageUrl: null,
    displayOrder: 2,
    isActive: true,
  },
  {
    id: 'cat-3',
    name: 'Toys',
    slug: 'toys',
    description: 'Fun picks for every age',
    imageUrl: null,
    displayOrder: 3,
    isActive: true,
  },
  {
    id: 'cat-4',
    name: 'Sports Items',
    slug: 'sports-items',
    description: 'Cricket, football and more',
    imageUrl: null,
    displayOrder: 4,
    isActive: true,
  },
  {
    id: 'cat-5',
    name: 'Decoration Items',
    slug: 'decoration-items',
    description: 'Lights and party decor',
    imageUrl: null,
    displayOrder: 5,
    isActive: true,
  },
];

export function getActiveCategories(): Category[] {
  return categories
    .filter((category) => category.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((category) => category.isActive && category.slug === slug);
}

export function getCategoryById(id: string): Category | undefined {
  return categories.find((category) => category.id === id);
}
