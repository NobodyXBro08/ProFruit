/** Claves internas para filtros (sin columna en BD). */
export const CATEGORY_ORDER = ['all', 'citrus', 'tropical', 'berries', 'snacks', 'other'];

export const CATEGORY_LABELS = {
  all: 'Todos',
  citrus: 'Cítricos',
  tropical: 'Tropicales',
  berries: 'Frutos rojos',
  snacks: 'Deshidratados',
  other: 'Otros',
};

/**
 * @param {{ name?: string, description?: string }} product
 * @returns {keyof typeof CATEGORY_LABELS}
 */
export function inferProductCategory(product) {
  const t = `${product?.name || ''} ${product?.description || ''}`.toLowerCase();
  if (/naranja|lim[oó]n|mandarina|c[ií]trico|toronja|lima/.test(t)) return 'citrus';
  if (/mango|piña|pina|banano|banana|coco|papaya|maracuy[aá]|tropical|guayaba|lulo|curuba/.test(t)) return 'tropical';
  if (/manzana|uva|fresa|mora|ar[aá]ndano|berries|frutos rojos/.test(t)) return 'berries';
  if (/chips|deshidrat|snack|anillo|deshi/.test(t)) return 'snacks';
  return 'other';
}
