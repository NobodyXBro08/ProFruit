import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const CatalogContext = createContext(null);

export function CatalogProvider({ children }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('default'); // default | price-asc | price-desc | name
  const [pricePreset, setPricePreset] = useState('all'); // all | low | mid | high

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setCategory('all');
    setSort('default');
    setPricePreset('all');
  }, []);

  const value = useMemo(
    () => ({
      searchQuery,
      setSearchQuery,
      category,
      setCategory,
      sort,
      setSort,
      pricePreset,
      setPricePreset,
      resetFilters,
    }),
    [searchQuery, category, sort, pricePreset, resetFilters],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog debe usarse dentro de CatalogProvider');
  return ctx;
}
