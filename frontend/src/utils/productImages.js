import MangoDeshidratado from '../assets/images/MangoDeshidratado.jpg';
import PinaAnillos from '../assets/images/PiñaAnillos.jpg';
import ChipsDeBanano from '../assets/images/ChipsDeBanano.jpg';
import AnillosDeManzana from '../assets/images/AnillosDeManzana.jpg';
import ManzanaDeshidratada from '../assets/images/ManzanaDeshidratada.jpg';
import BananaDeshidratada from '../assets/images/BananaDeshidratada.jpg';
import MixEnergetico from '../assets/images/MixEnergetico.jpg';
import Arandanos from '../assets/images/Arandanos.jpg';
import UvasPasas from '../assets/images/UvasPasas.jpg';
import CocoDeshidratado from '../assets/images/CocoDeshidratdo.jpg';
import Papaya from '../assets/images/Papaya.jpg';
import Guayaba from '../assets/images/Guayaba.jpg';
import FresasSecas from '../assets/images/FresasSecas.jpg';
import Kiwi from '../assets/images/Kiwi.jpg';
import Aguacate from '../assets/images/Aguacate.jpg';
import Limon from '../assets/images/Limon.jpg';
import Sandia from '../assets/images/Sandia.jpg';
import Naranja from '../assets/images/Naranja.jpg';

/** Catálogo local de imágenes de producto (sin logo de marca). */
export const productImages = [
  MangoDeshidratado,
  PinaAnillos,
  ChipsDeBanano,
  AnillosDeManzana,
  ManzanaDeshidratada,
  BananaDeshidratada,
  MixEnergetico,
  Arandanos,
  UvasPasas,
  CocoDeshidratado,
  Papaya,
  Guayaba,
  FresasSecas,
  Kiwi,
  Aguacate,
  Limon,
  Sandia,
  Naranja,
];

/** Palabras clave → imagen. La primera coincidencia gana. */
const NAME_RULES = [
  { keys: ['mango'], image: MangoDeshidratado },
  { keys: ['piña', 'pina'], image: PinaAnillos },
  { keys: ['anillos de manzana', 'anillo de manzana'], image: AnillosDeManzana },
  { keys: ['manzana'], image: ManzanaDeshidratada },
  { keys: ['banano', 'banana'], image: BananaDeshidratada },
  { keys: ['mix', 'energético', 'energetico'], image: MixEnergetico },
  { keys: ['arándano', 'arandano'], image: Arandanos },
  { keys: ['uva', 'pasas', 'pasa'], image: UvasPasas },
  { keys: ['coco'], image: CocoDeshidratado },
  { keys: ['papaya'], image: Papaya },
  { keys: ['guayaba'], image: Guayaba },
  { keys: ['fresa'], image: FresasSecas },
  { keys: ['kiwi'], image: Kiwi },
  // Antes que "chips", para que "Chips de aguacate" no use la foto de banano.
  { keys: ['aguacate', 'palta'], image: Aguacate },
  { keys: ['chips', 'chip'], image: ChipsDeBanano },
  { keys: ['limón', 'limon'], image: Limon },
  { keys: ['sandía', 'sandia'], image: Sandia },
  { keys: ['naranja'], image: Naranja },
];

function normalizeName(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function matchByName(name) {
  const normalized = normalizeName(name);
  if (!normalized) return null;

  for (const rule of NAME_RULES) {
    if (rule.keys.some((key) => normalized.includes(normalizeName(key)))) {
      return rule.image;
    }
  }
  return null;
}

/**
 * Resuelve la imagen de un producto.
 * 1. URL en BD (http / data)
 * 2. Coincidencia por nombre
 * 3. Fallback estable por id o índice (sin repetir hasta agotar el catálogo)
 */
export function getProductImage(product, index = 0) {
  if (product?.image && (product.image.startsWith('http') || product.image.startsWith('data:'))) {
    return product.image;
  }

  const byName = matchByName(product?.name);
  if (byName) return byName;

  const id = Number(product?.id);
  const slot = Number.isInteger(id) && id > 0 ? id - 1 : index;
  return productImages[slot % productImages.length];
}
