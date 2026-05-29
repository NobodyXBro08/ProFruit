import MangoDeshidratado from '../assets/images/MangoDeshidratado.jpg';
import PinaDeshidratada from '../assets/images/PiñaAnillos.jpg';
import ChipsBanano from '../assets/images/ChipsDeBanano.jpg';
import AnillosManzana from '../assets/images/AnillosDeManzana.jpg';

const defaultImages = [MangoDeshidratado, PinaDeshidratada, ChipsBanano, AnillosManzana];

export function getProductImage(product, index = 0) {
  if (product?.image && (product.image.startsWith('http') || product.image.startsWith('data:'))) {
    return product.image;
  }
  const i = Number.isFinite(index) ? index : 0;
  return defaultImages[i % defaultImages.length];
}

export { defaultImages };
