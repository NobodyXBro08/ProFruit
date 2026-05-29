export const PAYMENT_METHODS = [
  {
    id: 'mercadopago',
    label: 'Mercado Pago',
    hint: 'Tarjeta crédito, débito o PSE. Pago seguro en línea.',
    online: true,
  },
  {
    id: 'pse',
    label: 'PSE (transferencia bancaria)',
    hint: 'Débito desde tu cuenta bancaria vía Mercado Pago.',
    online: true,
  },
  {
    id: 'efectivo',
    label: 'Efectivo / Contra entrega',
    hint: 'Coordinamos el pago al recibir tu pedido (sujeto a ciudad).',
    online: false,
  },
];

export function paymentMethodLabel(id) {
  return PAYMENT_METHODS.find((m) => m.id === id)?.label ?? id;
}
