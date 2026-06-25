import { useEffect, useState } from 'react';
import { analyticsApi } from '../api';
import Topbar from '../components/Topbar';
import Badge, { stockVariant } from '../components/Badge';
import '../components/Table.css';
import './LowStock.css';

export default function LowStock() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]    = useState(true);
  const [error, setError]        = useState('');

  useEffect(() => {
    analyticsApi.getLowStock()
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <Topbar title="Low Stock" subtitle="Products at or below their reorder threshold" />
      <div className="page-content">
        {error && <div className="form-error">{error}</div>}

        {loading ? (
          <div className="page-loading">Loading...</div>
        ) : products.length === 0 ? (
          <div className="table-wrap">
            <div className="empty-state" style={{ padding: '48px 0' }}>
              <i className="ti ti-check" aria-hidden="true" />
              All items are above their low-stock threshold.
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>SKU</th><th>Category</th><th>In stock</th><th>Threshold</th><th>Shortfall</th></tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.productId}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>{p.sku}</td>
                    <td>{p.categoryName}</td>
                    <td><Badge variant={stockVariant(p.stockQuantity, p.lowStockThreshold)}>{p.stockQuantity}</Badge></td>
                    <td style={{ color: '#6b7280' }}>{p.lowStockThreshold}</td>
                    <td style={{ color: p.stockQuantity <= 0 ? '#B91C1C' : '#B45309', fontWeight: 500 }}>
                      {Math.max(0, p.lowStockThreshold - p.stockQuantity)} short
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
