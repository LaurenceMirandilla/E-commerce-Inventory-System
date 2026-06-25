import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { analyticsApi } from '../api';
import Topbar from '../components/Topbar';
import '../components/Table.css';
import './Analytics.css';

const RANGES = {
  '30d':  { label: 'Last 30 days', days: 30 },
  '3mo':  { label: 'Last 3 months', days: 90 },
  '6mo':  { label: 'Last 6 months', days: 180 },
  '12mo': { label: 'Last 12 months', days: 365 },
};

const monthLabel = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

export default function Analytics() {
  const [range, setRange]       = useState('6mo');
  const [sales, setSales]       = useState([]);
  const [topProducts, setTop]   = useState([]);
  const [inventory, setInv]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    let cancelled = false;
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - RANGES[range].days);

    Promise.all([
      analyticsApi.getSalesOverTime(from, to),
      analyticsApi.getTopProducts(5, RANGES[range].days),
      analyticsApi.getInventoryValue(),
    ])
      .then(([s, tp, inv]) => {
        if (cancelled) return;
        setSales(s);
        setTop(tp);
        setInv(inv);
        setError('');
        setLoading(false);
      })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false); } });

    return () => { cancelled = true; };
  }, [range]);

  const handleRangeChange = (e) => {
    setLoading(true);
    setRange(e.target.value);
  };

  // GET /Analytics/sales groups by day server-side. For 30 days we show
  // daily bars; for longer ranges we aggregate days into months client-side
  // so the chart stays readable instead of showing 180+ tiny bars.
  const chartData = useMemo(() => {
    if (range === '30d') {
      return [...sales]
        .sort((a, b) => new Date(a.saleDate) - new Date(b.saleDate))
        .map((s) => ({
          label: new Date(s.saleDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: s.revenue,
        }));
    }
    const byMonth = new Map();
    sales.forEach((s) => {
      const key = monthLabel(s.saleDate);
      byMonth.set(key, (byMonth.get(key) || 0) + s.revenue);
    });
    return Array.from(byMonth, ([label, revenue]) => ({ label, revenue }));
  }, [sales, range]);

  const totalRevenue = sales.reduce((sum, s) => sum + s.revenue, 0);
  const totalOrders  = sales.reduce((sum, s) => sum + s.totalOrders, 0);
  const totalUnits   = sales.reduce((sum, s) => sum + s.unitsSold, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="page">
      <Topbar title="Analytics" subtitle="Sales performance and inventory value" />
      <div className="page-content">
        {error && <div className="form-error">{error}</div>}

        <div className="toolbar">
          <div className="toolbar-left">
            <select className="filter-select" value={range} onChange={handleRangeChange}>
              {Object.entries(RANGES).map(([key, r]) => (
                <option key={key} value={key}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-top"><i className="ti ti-currency-peso stat-icon-mini" aria-hidden="true" /><span className="stat-label">Revenue</span></div>
            <p className="stat-value">{loading ? '—' : `₱${totalRevenue.toLocaleString()}`}</p>
          </div>
          <div className="stat-card">
            <div className="stat-top"><i className="ti ti-shopping-cart stat-icon-mini" aria-hidden="true" /><span className="stat-label">Orders</span></div>
            <p className="stat-value">{loading ? '—' : totalOrders}</p>
          </div>
          <div className="stat-card">
            <div className="stat-top"><i className="ti ti-package stat-icon-mini" aria-hidden="true" /><span className="stat-label">Units sold</span></div>
            <p className="stat-value">{loading ? '—' : totalUnits}</p>
          </div>
          <div className="stat-card">
            <div className="stat-top"><i className="ti ti-receipt stat-icon-mini" aria-hidden="true" /><span className="stat-label">Avg order value</span></div>
            <p className="stat-value">{loading ? '—' : `₱${avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}</p>
          </div>
        </div>

        <div className="dash-panel revenue-panel">
          <div className="dash-panel-header">
            <h3>Revenue — {RANGES[range].label.toLowerCase()}</h3>
          </div>
          {loading ? (
            <div className="page-loading">Loading...</div>
          ) : chartData.length === 0 ? (
            <div className="empty-state"><i className="ti ti-chart-bar" />No revenue data for this period</div>
          ) : (
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    interval={Math.max(0, Math.floor(chartData.length / 8) - 1)}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                  />
                  <Tooltip
                    formatter={(value) => [`₱${value.toLocaleString()}`, 'Revenue']}
                    cursor={{ fill: 'rgba(16, 179, 163, 0.06)' }}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={40} fill="#10b3a3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="analytics-grid">
          <div className="dash-panel">
            <div className="dash-panel-header"><h3>Top products by units sold — {RANGES[range].label.toLowerCase()}</h3></div>
            {loading ? (
              <div className="page-loading">Loading...</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Product</th><th>Units sold</th><th>Revenue</th></tr></thead>
                  <tbody>
                    {topProducts.map((p) => (
                      <tr key={p.productId}>
                        <td>{p.name}</td>
                        <td>{p.unitsSold}</td>
                        <td>₱{p.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                    {topProducts.length === 0 && (
                      <tr><td colSpan={3}><div className="empty-state"><i className="ti ti-package" />No sales data yet</div></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="dash-panel">
            <div className="dash-panel-header"><h3>Inventory value</h3></div>
            {loading ? (
              <div className="page-loading">Loading...</div>
            ) : !inventory ? (
              <div className="empty-state"><i className="ti ti-database" />No inventory data</div>
            ) : (
              <div className="inv-grid">
                <div className="inv-cell">
                  <span className="period-stat-label">Total products</span>
                  <span className="period-stat-value">{inventory.totalProducts}</span>
                </div>
                <div className="inv-cell">
                  <span className="period-stat-label">Total units</span>
                  <span className="period-stat-value">{inventory.totalUnits}</span>
                </div>
                <div className="inv-cell">
                  <span className="period-stat-label">Cost value</span>
                  <span className="period-stat-value">₱{inventory.totalCostValue.toLocaleString()}</span>
                </div>
                <div className="inv-cell">
                  <span className="period-stat-label">Retail value</span>
                  <span className="period-stat-value">₱{inventory.totalRetailValue.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
