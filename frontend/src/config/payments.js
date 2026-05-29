export const PAYMENT_METHODS = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    hint: 'Recibes el resumen del pedido y lo confirmas por chat con nuestro equipo.',
  },
  {
    id: 'efectivo',
    label: 'Efectivo / Contra entrega',
    hint: 'Pagas al recibir tu pedido. Te enviamos la confirmación por correo.',
  },
];

export function paymentMethodLabel(id) {
  return PAYMENT_METHODS.find((m) => m.id === id)?.label ?? id;
}
