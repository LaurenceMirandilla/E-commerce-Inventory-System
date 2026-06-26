export function statusVariant(status) {
  switch (status) {
    case 'Delivered':
      return 'success';
    case 'Shipped':
      return 'info';
    case 'Processing':
      return 'warning';
    case 'Pending':
      return 'pending';
    case 'Cancelled':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function stockVariant(quantity, lowStockThreshold) {
  if (quantity <= 0) return 'danger';
  if (quantity <= lowStockThreshold) return 'warning';
  return 'success';
}

export default function Badge({ variant = 'neutral', children }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}
