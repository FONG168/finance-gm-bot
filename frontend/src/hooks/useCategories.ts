'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/api';
import { Category, CATEGORIES } from '@shared/types';
import { useAuth } from './useAuth';

export function useCategories() {
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const list = await apiService.categories.list();
      // Ensure we have a valid array
      if (Array.isArray(list)) {
        setCategories(list);
      } else {
        setCategories(CATEGORIES);
      }
    } catch (e) {
      console.error('Failed to fetch categories:', e);
      setCategories(CATEGORIES); // Fallback to hardcoded list on error
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
    }
  }, [isAuthenticated, fetchCategories]);

  const addCategory = async (data: {
    name: string;
    label: string;
    icon: string;
    color: string;
    type: 'income' | 'expense' | 'both';
  }) => {
    apiService.clearCache();
    const newCat = await apiService.categories.create(data);
    await fetchCategories();
    return newCat;
  };

  return {
    categories,
    isLoading,
    refresh: fetchCategories,
    addCategory,
  };
}
