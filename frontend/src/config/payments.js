export const PAYMENT_METHODS = [
  {
    id: 'whatsapp',
    label: 'Atención por WhatsApp',
    hint: 'Envías el resumen del pedido por chat y lo confirmamos contigo.',
  },
  {
    id: 'efectivo',
    label: 'Efectivo contra entrega',
    hint: 'Pagas al recibir. Envía el resumen por WhatsApp para coordinar la entrega.',
  },
];

export function paymentMethodLabel(id) {
  return PAYMENT_METHODS.find((m) => m.id === id)?.label ?? id;
}
