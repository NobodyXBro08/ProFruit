import { formatPrice } from './formatPrice';
import { paymentMethodLabel } from '../config/payments';
import { SITE } from '../config/site';

/**
 * @param {object} params
 * @param {number} params.orderId
 * @param {string} params.customerName
 * @param {string} params.customerPhone
 * @param {string} params.city
 * @param {string} params.address
 * @param {string} params.paymentMethod
 * @param {number} params.total
 * @param {Array<{ name: string; quantity: number; price: number }>} params.lines
 */
export function buildWhatsAppOrderMessage({
  orderId,
  customerName,
  customerPhone,
  city,
  address,
  paymentMethod,
  total,
  lines,
}) {
  const itemsText = lines
    .map((l) => `• ${l.name} × ${l.quantity} — ${formatPrice(l.quantity * l.price)}`)
    .join('\n');

  return [
    'Hola ProFruit, quiero confirmar mi pedido:',
    '',
    `Pedido #${orderId}`,
    `Nombre: ${customerName}`,
    `Teléfono: ${customerPhone}`,
    `Ciudad: ${city}`,
    `Dirección: ${address}`,
    `Pago: ${paymentMethodLabel(paymentMethod)}`,
    '',
    'Productos:',
    itemsText,
    '',
    `Total: ${formatPrice(total)}`,
  ].join('\n');
}

export function buildWhatsAppUrl(message) {
  const phone = SITE.phoneTel.replace(/\D/g, '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppCustomerUrl(customerPhone, message) {
  const digits = String(customerPhone ?? '').replace(/\D/g, '');
  const phone = digits.length >= 10 ? digits : SITE.phoneTel.replace(/\D/g, '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
