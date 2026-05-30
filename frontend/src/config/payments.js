export const PAYMENT_METHODS = [
  {
    id: 'whatsapp',
    label: 'Atención por WhatsApp',
    hint: 'Te enviamos el resumen del pedido y lo confirmas por chat con nuestro equipo.',
  },
  {
    id: 'efectivo',
    label: 'Efectivo contra entrega',
    hint: 'Pagas al recibir tu pedido. Te enviamos la confirmación al correo que indiques.',
  },
];

export function paymentMethodLabel(id) {
  return PAYMENT_METHODS.find((m) => m.id === id)?.label ?? id;
}
