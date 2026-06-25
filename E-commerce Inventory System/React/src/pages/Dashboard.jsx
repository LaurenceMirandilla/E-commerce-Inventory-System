import { useEffect, useRef, useState } from 'react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { productsApi, ordersApi, analyticsApi } from '../api';
import Topbar from '../components/Topbar';
import './Dashboard.css';

const dayLabel = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const POLL_MS = 60000; // 60s

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders]     = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [sales, setSales]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    const load = () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 29); // 30-day window including today

      Promise.all([
        productsApi.getAll(),
        ordersApi.getAll(),
        analyticsApi.getLowStock().catch(() => []),
        analyticsApi.getSalesOverTime(from, to).catch(() => []),
      ])
        .then(([p, o, ls, s]) => {
          if (cancelledRef.current) return;
          setProducts(p);
          setOrders(o);
          setLowStock(ls);
          setSales(s);
          setError('');
        })
        .catch((e) => { if (!cancelledRef.current) setError(e.message); })
        .finally(() => { if (!cancelledRef.current) setLoading(false); });
    };

    load();
    const interval = setInterval(load, POLL_MS);
    return () => { cancelledRef.current = true; clearInterval(interval); };
  }, []);

  const categoryCount = new Set(products.map((p) => p.categoryName)).size;

  const totalRevenue = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const completedCount = orders.filter((o) => o.status === 'Delivered').length;
  const pendingCount = orders.filter((o) => o.status === 'Pending').length;

  const chartData = [...sales]
    .sort((a, b) => new Date(a.saleDate) - new Date(b.saleDate))
    .map((s) => ({ day: dayLabel(s.saleDate), revenue: s.revenue, orders: s.totalOrders, units: s.unitsSold }));

  const periodRevenue = sales.reduce((sum, s) => sum + s.revenue, 0);
  const periodOrders  = sales.reduce((sum, s) => sum + s.totalOrders, 0);
  const periodUnits   = sales.reduce((sum, s) => sum + s.unitsSold, 0);

  const today = new Date();
  const fullDate = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="page">
      <Topbar title="Dashboard" subtitle={fullDate} />
      <div className="page-content">
        {error && <div className="form-error">{error}</div>}

        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-top">
              <i className="ti ti-package stat-icon-mini" aria-hidden="true" />
              <span className="stat-label">Products</span>
            </div>
            <p className="stat-value">{loading ? '—' : products.length}</p>
            <p className="stat-foot">{loading ? '' : `${categoryCount} categories`}</p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <i className="ti ti-shopping-cart stat-icon-mini" aria-hidden="true" />
              <span className="stat-label">Orders</span>
            </div>
            <p className="stat-value">{loading ? '—' : orders.length}</p>
            <p className="stat-foot">{loading ? '' : `${pendingCount} pending`}</p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <i className="ti ti-currency-peso stat-icon-mini" aria-hidden="true" />
              <span className="stat-label">Revenue</span>
            </div>
            <p className="stat-value">{loading ? '—' : `₱${totalRevenue.toLocaleString()}`}</p>
            <p className="stat-foot">{loading ? '' : `${completedCount} completed orders`}</p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <i className="ti ti-alert-triangle stat-icon-mini stat-icon-warn" aria-hidden="true" />
              <span className="stat-label">Low Stock</span>
            </div>
            <p className="stat-value">{loading ? '—' : lowStock.length}</p>
            <p className="stat-foot">
              {loading ? '' : lowStock.length === 0 ? 'all items healthy' : 'needs attention'}
            </p>
          </div>
        </div>

        <div className="dash-panel revenue-panel">
          <div className="dash-panel-header">
            <h3>Last 30 days</h3>
            <a href="/analytics" className="view-all">Full report →</a>
          </div>

          {!loading && sales.length > 0 && (
            <div className="period-stats">
              <div><span className="period-stat-label">Revenue</span><span className="period-stat-value">₱{periodRevenue.toLocaleString()}</span></div>
              <div><span className="period-stat-label">Orders</span><span className="period-stat-value">{periodOrders}</span></div>
              <div><span className="period-stat-label">Units sold</span><span className="period-stat-value">{periodUnits}</span></div>
            </div>
          )}

          {loading ? (
            <div className="page-loading">Loading...</div>
          ) : chartData.length === 0 ? (
            <div className="empty-state"><i className="ti ti-chart-bar" />No revenue data in the last 30 days</div>
          ) : (
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    interval={Math.max(0, Math.floor(chartData.length / 6) - 1)}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                  />
                  <Tooltip
                    formatter={(value, name) => name === 'revenue' ? [`₱${value.toLocaleString()}`, 'Revenue'] : [value, name]}
                    cursor={{ fill: 'rgba(16, 179, 163, 0.06)' }}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={24} fill="#10b3a3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
