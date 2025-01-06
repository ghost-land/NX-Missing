import { useState, useCallback, useEffect } from 'react';
import { TableType } from '../types';

interface SearchParams {
  tab?: TableType;
  search?: string;
}

export function useSearchParams() {
  const [searchParams, setSearchParams] = useState<SearchParams>(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      tab: params.get('tab') as TableType || 'missing-titles',
      search: params.get('search') || '',
    };
  });

  const updateSearchParams = useCallback((newParams: Partial<SearchParams>) => {
    setSearchParams(current => {
      const updated = { ...current, ...newParams };
      const params = new URLSearchParams();
      
      if (updated.tab) params.set('tab', updated.tab);
      if (updated.search) params.set('search', updated.search);
      
      window.history.pushState({}, '', `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`);
      
      return updated;
    });
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setSearchParams({
        tab: params.get('tab') as TableType || 'missing-titles',
        search: params.get('search') || '',
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return { searchParams, updateSearchParams };
}