import React, { createContext, useContext, useMemo, useState } from 'react';

const CatalogContext = createContext(null);

export function CatalogProvider({ children }) {
  const [searchQuery, setSearchQuery] = useState('');

  const value = useMemo(() => ({ searchQuery, setSearchQuery }), [searchQuery]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog debe usarse dentro de CatalogProvider');
  return ctx;
}
