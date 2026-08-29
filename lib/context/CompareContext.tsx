'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/types';
import { DataStore } from '@/lib/store/data-store';

interface CompareContextType {
  compareIds: string[];
  compareProducts: Product[];
  addToCompare: (productId: string) => { success: boolean; message: string };
  removeFromCompare: (productId: string) => void;
  isInCompare: (productId: string) => boolean;
  clearCompare: () => void;
  count: number;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const COMPARE_KEY = 'ozeira_compare_v1';
const MAX_COMPARE_ITEMS = 4;

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COMPARE_KEY);
      if (stored) {
        setCompareIds(JSON.parse(stored));
      }
      setProducts(DataStore.getProducts());
    } catch (e) {
      console.error('Failed to load compare items', e);
    }
  }, []);

  const addToCompare = (productId: string): { success: boolean; message: string } => {
    if (compareIds.includes(productId)) {
      removeFromCompare(productId);
      return { success: true, message: 'Removed from product comparison.' };
    }
    if (compareIds.length >= MAX_COMPARE_ITEMS) {
      return { success: false, message: `You can compare up to ${MAX_COMPARE_ITEMS} products at once.` };
    }
    const updated = [...compareIds, productId];
    setCompareIds(updated);
    try {
      localStorage.setItem(COMPARE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving compare items', e);
    }
    return { success: true, message: 'Added to product comparison.' };
  };

  const removeFromCompare = (productId: string) => {
    const updated = compareIds.filter((id) => id !== productId);
    setCompareIds(updated);
    try {
      localStorage.setItem(COMPARE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving compare items', e);
    }
  };

  const isInCompare = (productId: string) => compareIds.includes(productId);

  const clearCompare = () => {
    setCompareIds([]);
    localStorage.removeItem(COMPARE_KEY);
  };

  const compareProducts = products.filter((p) => compareIds.includes(p.id));

  return (
    <CompareContext.Provider
      value={{
        compareIds,
        compareProducts,
        addToCompare,
        removeFromCompare,
        isInCompare,
        clearCompare,
        count: compareIds.length,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
