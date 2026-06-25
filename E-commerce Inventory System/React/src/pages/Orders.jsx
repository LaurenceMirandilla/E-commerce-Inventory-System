import { useEffect, useState } from 'react';
import { ordersApi, productsApi, customersApi } from '../api';
import Topbar from '../components/Topbar';
import Badge, { statusVariant } from '../components/Badge';
import Modal from '../components/Modal';
import '../components/Table.css';
import '../components/Form.css';
import './Products.css';

const STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

// Customer.Email is required on the backend but the create-order flow only
// asks for a name, so a placeholder is generated: lowercase the name,
// replace anything that isn't a letter/number with a dot, then append a
// few random digits to avoid collisions between customers with the same
// or similar names (e.g. two "Juan Dela Cruz" entries).
function placeholderEmail(fullName) {
  const slug = fullName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '') || 'customer';
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${slug}${suffix}@gmail.com`;
}

export default function Orders() {
  const [orders, setOrders]       = useState([]);
  const [products, setProducts]   = useState([]);
  const [customers, setCustomers] = useState([]);
  const [statusFilter, setStatus] = useState('');
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null);
  const [selected, setSelected]   = useState(null);
  const [detail, setDetail]       = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [form, setForm]           = useState({ customerName: '', notes: '', items: [{ productId: '', quantity: 1 }] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [error, setError]         = useState('');

  const load = () => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    ordersApi.getAll(params).then(setOrders).finally(() => setLoading(false));
  };

  useEffect(() => {
    productsApi.getAll().then(setProducts);
    customersApi.getAll().then(setCustomers);
  }, []);

  useEffect(() => { load(); }, [statusFilter]);

  const openCreate = () => { setForm({ customerName: '', notes: '', items: [{ productId: '', quantity: 1 }] }); setError(''); setModal('create'); };
  const openDetail = async (o) => { const d = await ordersApi.getById(o.orderId); setDetail(d); setModal('detail'); };
  const openStatus = (o) => { setSelected(o); setNewStatus(o.status); setError(''); setModal('status'); };
  const closeModal = () => { setModal(null); setSelected(null); setDetail(null); };

  const addItem    = () => setForm({ ...form, items: [...form.items, { productId: '', quantity: 1 }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const setItem    = (i, field, val) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };
    setForm({ ...form, items });
  };

  const handleCreate = async () => {
    const name = form.customerName.trim();
    if (!name) { setError('Customer name is required.'); return; }

    setCreatingCustomer(true);
    try {
      // Exact, case-insensitive match against already-loaded customers.
      // If multiple customers share the same name, this picks the first —
      // there's no other way to disambiguate from a name alone, since the
      // backend has no search-by-name endpoint.
      let customer = customers.find((c) => c.fullName.trim().toLowerCase() === name.toLowerCase());

      if (!customer) {
        customer = await customersApi.create({
          fullName: name,
          email: placeholderEmail(name),
        });
        setCustomers((prev) => [...prev, customer]);
      }

      const dto = {
        customerId: customer.customerId,
        notes: form.notes,
        items: form.items.map(i => ({ productId: +i.productId, quantity: +i.quantity })),
      };
      await ordersApi.create(dto);
      closeModal(); load();
    } catch (e) {
      setError(e.message);
    } finally {
      setCreatingCustomer(false);
    }
  };

  const handleStatus = async () => {
    try {
      await ordersApi.updateStatus(selected.orderId, newStatus);
      closeModal(); load();
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="page">
      <Topbar title="Orders" subtitle="Track and manage customer orders" />
      <div className="page-content">
        <div className="toolbar">
          <select value={statusFilter} onChange={e => setStatus(e.target.value)} className="filter-select">
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-primary" onClick={openCreate}>
            <i className="ti ti-plus" aria-hidden="true" /> New order
          </button>
        </div>

        {loading ? <div className="page-loading">Loading...</div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Order #</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.orderId}>
                    <td style={{ fontWeight: 500, fontFamily: 'monospace', fontSize: 12 }}>{o.orderNumber}</td>
                    <td>{o.customerName}</td>
                    <td style={{ color: '#6b7280' }}>{new Date(o.orderDate).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600 }}>₱{o.totalAmount.toLocaleString()}</td>
                    <td><Badge variant={statusVariant(o.status)}>{o.status}</Badge></td>
                    <td>
                      <div className="table-actions">
                        <button className="icon-btn" onClick={() => openDetail(o)} title="View details"><i className="ti ti-eye" /></button>
                        <button className="icon-btn" onClick={() => openStatus(o)} title="Update status"><i className="ti ti-edit" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={6}><div className="empty-state"><i className="ti ti-shopping-cart" />No orders found</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal === 'create' && (
        <Modal title="New order" onClose={closeModal}>
          {error && <div className="form-error">{error}</div>}
          <div className="form-group" style={{ position: 'relative' }}>
            <label>Customer name</label>
            <input
              value={form.customerName}
              onChange={(e) => { setForm({ ...form, customerName: e.target.value }); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
              placeholder="Start typing a name..."
              autoComplete="off"
            />
            {showSuggestions && form.customerName.trim() && (() => {
              const q = form.customerName.trim().toLowerCase();
              const matches = customers.filter((c) => c.fullName.toLowerCase().includes(q)).slice(0, 6);
              const exact = customers.some((c) => c.fullName.trim().toLowerCase() === q);
              if (matches.length === 0 && exact) return null;
              return (
                <div className="autocomplete-list">
                  {matches.map((c) => (
                    <button
                      type="button"
                      key={c.customerId}
                      className="autocomplete-item"
                      onMouseDown={() => { setForm({ ...form, customerName: c.fullName }); setShowSuggestions(false); }}
                    >
                      {c.fullName}
                    </button>
                  ))}
                  {!exact && (
                    <div className="autocomplete-hint">
                      <i className="ti ti-user-plus" aria-hidden="true" /> No exact match — a new customer named "{form.customerName.trim()}" will be created when you place this order.
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          <div className="form-group"><label>Notes</label><input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Optional" /></div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>Items</label>
          </div>
          {form.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <select style={{ flex: 2, padding: '7px 8px', border: '0.5px solid #d1d5db', borderRadius: 6, fontSize: 13 }}
                value={item.productId} onChange={e => setItem(i, 'productId', e.target.value)}>
                <option value="">Select product</option>
                {products.map(p => <option key={p.productId} value={p.productId}>{p.name} (₱{p.unitPrice})</option>)}
              </select>
              <input type="number" min="1" style={{ width: 70, padding: '7px 8px', border: '0.5px solid #d1d5db', borderRadius: 6, fontSize: 13 }}
                value={item.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} />
              {form.items.length > 1 && (
                <button className="icon-btn danger" onClick={() => removeItem(i)}><i className="ti ti-x" /></button>
              )}
            </div>
          ))}
          <button className="btn btn-sm" onClick={addItem} style={{ marginBottom: 16 }}>
            <i className="ti ti-plus" /> Add item
          </button>
          <div className="form-actions">
            <button className="btn" onClick={closeModal}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={creatingCustomer}>
              {creatingCustomer ? 'Placing order...' : 'Place order'}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'detail' && detail && (
        <Modal title={`Order — ${detail.orderNumber}`} onClose={closeModal}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, fontSize: 13 }}>
            <div><span style={{ color: '#6b7280' }}>Customer:</span> <strong>{detail.customerName}</strong></div>
            <div><span style={{ color: '#6b7280' }}>Status:</span> <Badge variant={statusVariant(detail.status)}>{detail.status}</Badge></div>
            <div><span style={{ color: '#6b7280' }}>Date:</span> {new Date(detail.orderDate).toLocaleDateString()}</div>
            <div><span style={{ color: '#6b7280' }}>Total:</span> <strong>₱{detail.totalAmount.toLocaleString()}</strong></div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Product</th><th>Qty</th><th>Unit price</th><th>Subtotal</th></tr></thead>
              <tbody>
                {detail.items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.productName}</td>
                    <td>{item.quantity}</td>
                    <td>₱{item.unitPrice.toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>₱{item.subtotal.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      {modal === 'status' && selected && (
        <Modal title="Update order status" onClose={closeModal}>
          {error && <div className="form-error">{error}</div>}
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>Order: <strong>{selected.orderNumber}</strong></p>
          <div className="form-group">
            <label>New status</label>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {newStatus === 'Cancelled' && (
            <div style={{ background: '#FEF2F2', border: '0.5px solid #FCA5A5', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#B91C1C', marginBottom: 14 }}>
              Cancelling will restore stock for all items in this order.
            </div>
          )}
          <div className="form-actions">
            <button className="btn" onClick={closeModal}>Cancel</button>
            <button className="btn btn-primary" onClick={handleStatus}>Update status</button>
          </div>
        </Modal>
      )}
    </div>
  );
}