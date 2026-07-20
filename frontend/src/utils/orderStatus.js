/** Etiquetas y flujo de estados de pedido (cliente y admin). */

export const ORDER_STATUS_LABELS = {
  pending: 'Pendiente',
  paid: 'Confirmado',
  preparing: 'Preparando',
  shipped: 'En camino',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export function orderStatusLabel(status) {
  return ORDER_STATUS_LABELS[status] || status;
}

/** Siguiente estado de entrega (solo post-pago). */
export function nextFulfillmentStatus(status) {
  if (status === 'paid') return 'preparing';
  if (status === 'preparing') return 'shipped';
  if (status === 'shipped') return 'delivered';
  return null;
}

export const NEXT_FULFILLMENT_LABELS = {
  preparing: 'Marcar preparado',
  shipped: 'Marcar en camino',
  delivered: 'Marcar entregado',
};
