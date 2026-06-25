import { useEffect, useMemo, useState } from 'react';
import { productsApi } from '../api';
import Topbar from '../components/Topbar';
import Badge, { stockVariant } from '../components/Badge';
import Modal from '../components/Modal';
import '../components/Table.css';
import '../components/Form.css';
import './Products.css';

// Shared shape for both create and edit — the backend's ProductCreateDto
// and ProductUpdateDto both take CategoryName (string, auto-creates a new
// Category row if no exact match exists) and a plain StockQuantity field
// (absolute value — there is no separate stock-adjustment endpoint).
const emptyForm = {
  sku: '', name: '', description: '', categoryName: '',
  unitPrice: '', costPrice: '', stockQuantity: '', lowStockThreshold: '10', isActive: true,
};

const PAGE_SIZE = 10;

export default function Products() {
  const [products, setProducts]   = useState([]);
  const [search, setSearch]       = useState('');
  const [categoryFilter, setCatF] = useState('');
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null);
  const [selected, setSelected]   = useState(null);
  const [form, setForm]           = useState(emptyForm);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // No /categories endpoint exists on the backend. Category names come
  // back denormalized on every product, so dropdown/autocomplete options
  // are derived from whatever products are currently loaded. There is no
  // categoryId anymore — categories are matched and created by name on the
  // backend (exact match after Trim()).
  const categoryNames = useMemo(() => {
    const set = new Set();
    products.forEach((p) => { if (p.categoryName) set.add(p.categoryName); });
    return Array.from(set).sort();
  }, [products]);

  const load = () => {
    const params = {};
    if (search) params.search = search;
    productsApi.getAll(params).then(setProducts).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search]);

  const visibleProducts = categoryFilter
    ? products.filter((p) => p.categoryName === categoryFilter)
    : products;

  // Client-side pagination for now — slices whatever's already loaded into
  // pages of PAGE_SIZE. If the product list ever grows large enough that
  // loading everything upfront gets slow, this can be swapped to
  // backend-driven pagination by having `load()` pass page/pageSize params
  // to productsApi.getAll() instead of slicing here — visibleProducts would
  // then just be `products` directly (the backend already returns one page),
  // and totalPages would come from a response header/field instead of
  // visibleProducts.length.
  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / PAGE_SIZE));
  // Clamp directly during render instead of correcting via an effect —
  // avoids a synchronous setState-in-effect (flagged by react-hooks lint)
  // and avoids an extra render cycle when filters shrink the result set.
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageProducts = visibleProducts.slice(pageStart, pageStart + PAGE_SIZE);

  const openCreate = () => { setForm(emptyForm); setError(''); setModal('create'); };
  const openEdit = (p) => {
    setSelected(p);
    setForm({
      sku: p.sku,
      name: p.name,
      description: p.description || '',
      categoryName: p.categoryName,
      unitPrice: p.unitPrice,
      costPrice: p.costPrice,
      stockQuantity: p.stockQuantity,
      lowStockThreshold: p.lowStockThreshold,
      isActive: p.isActive,
    });
    setError(''); setModal('edit');
  };
  const openDelete = (p) => { setSelected(p); setError(''); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); setShowSuggestions(false); };

  const buildDto = () => ({
    sku: form.sku,
    name: form.name,
    description: form.description,
    categoryName: form.categoryName.trim(),
    unitPrice: +form.unitPrice,
    costPrice: +form.costPrice,
    stockQuantity: +form.stockQuantity,
    lowStockThreshold: +form.lowStockThreshold,
    isActive: form.isActive,
  });

  const handleCreate = async () => {
    setSaving(true);
    try {
      // POST returns 201 with a null body — nothing to read back, just reload the list.
      await productsApi.create(buildDto());
      closeModal(); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleEdit = async () => {
    setSaving(true);
    try {
      // PUT returns 204 No Content — nothing to read back, just reload the list.
      await productsApi.update(selected.productId, buildDto());
      closeModal(); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      // Soft delete server-side (IsActive = false) — row stays in the list
      // unless you also filter inactive products out. Returns 204.
      await productsApi.delete(selected.productId);
      closeModal(); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const renderCategoryField = () => {
    const q = form.categoryName.trim().toLowerCase();
    const matches = q ? categoryNames.filter((c) => c.toLowerCase().includes(q)).slice(0, 6) : categoryNames.slice(0, 6);
    const exact = categoryNames.some((c) => c.toLowerCase() === q);

    return (
      <div className="form-group" style={{ position: 'relative' }}>
        <label>Category</label>
        <input
          value={form.categoryName}
          onChange={(e) => { setForm({ ...form, categoryName: e.target.value }); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
          placeholder="Start typing a category..."
          autoComplete="off"
        />
        {showSuggestions && matches.length > 0 && (
          <div className="autocomplete-list">
            {matches.map((c) => (
              <button
                type="button"
                key={c}
                className="autocomplete-item"
                onMouseDown={() => { setForm({ ...form, categoryName: c }); setShowSuggestions(false); }}
              >
                {c}
              </button>
            ))}
            {q && !exact && (
              <div className="autocomplete-hint">
                <i className="ti ti-folder-plus" aria-hidden="true" /> No exact match — a new category named "{form.categoryName.trim()}" will be created when you save.
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page">
      <Topbar title="Products" subtitle="Manage your product catalog and stock" />
      <div className="page-content">
        <div className="toolbar">
          <div className="toolbar-left">
            <input
              className="search-input"
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
            <select className="filter-select" value={categoryFilter} onChange={(e) => { setCatF(e.target.value); setCurrentPage(1); }}>
              <option value="">All categories</option>
              {categoryNames.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            <i className="ti ti-plus" aria-hidden="true" /> Add product
          </button>
        </div>

        {loading ? <div className="page-loading">Loading...</div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {pageProducts.map((p) => (
                  <tr key={p.productId} style={{ opacity: p.isActive ? 1 : 0.5 }}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>{p.sku}</td>
                    <td>{p.categoryName}</td>
                    <td>₱{p.unitPrice.toLocaleString()}</td>
                    <td><Badge variant={stockVariant(p.stockQuantity, p.lowStockThreshold)}>{p.stockQuantity}</Badge></td>
                    <td>{p.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="neutral">Inactive</Badge>}</td>
                    <td>
                      <div className="table-actions">
                        <button className="icon-btn" onClick={() => openEdit(p)} title="Edit"><i className="ti ti-edit" /></button>
                        <button className="icon-btn danger" onClick={() => openDelete(p)} title="Deactivate"><i className="ti ti-trash" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pageProducts.length === 0 && (
                  <tr><td colSpan={7}><div className="empty-state"><i className="ti ti-package" />No products found</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && visibleProducts.length > PAGE_SIZE && (
          <div className="pagination">
            <span className="pagination-info">
              Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, visibleProducts.length)} of {visibleProducts.length}
            </span>
            <div className="pagination-controls">
              <button
                className="btn btn-sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
              >
                <i className="ti ti-chevron-left" aria-hidden="true" /> Prev
              </button>
              <span className="pagination-page">Page {safePage} of {totalPages}</span>
              <button
                className="btn btn-sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
              >
                Next <i className="ti ti-chevron-right" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'create' ? 'Add product' : 'Edit product'} onClose={closeModal}>
          {error && <div className="form-error">{error}</div>}
          <div className="form-row">
            <div className="form-group">
              <label>SKU</label>
              <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          {renderCategoryField()}
          <div className="form-row">
            <div className="form-group">
              <label>Unit price (₱)</label>
              <input type="number" min="0.01" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Cost price (₱)</label>
              <input type="number" min="0.01" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{modal === 'create' ? 'Starting stock' : 'Stock quantity'}</label>
              <input type="number" min="0" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} />
              {modal === 'edit' && (
                <p style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 4 }}>
                  This sets the stock total directly — there's no separate adjust-by-amount option anymore.
                </p>
              )}
            </div>
            <div className="form-group">
              <label>Low stock threshold</label>
              <input type="number" min="0" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} />
            </div>
          </div>
          {modal === 'edit' && (
            <div className="form-group">
              <label>Status</label>
              <select value={form.isActive ? 'true' : 'false'} onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          )}
          <div className="form-actions">
            <button className="btn" onClick={closeModal}>Cancel</button>
            <button className="btn btn-primary" onClick={modal === 'create' ? handleCreate : handleEdit} disabled={saving}>
              {saving ? 'Saving...' : modal === 'create' ? 'Add product' : 'Save changes'}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'delete' && selected && (
        <Modal title="Deactivate product" onClose={closeModal}>
          {error && <div className="form-error">{error}</div>}
          <p style={{ fontSize: 13, color: '#374151' }}>
            Deactivate <strong>{selected.name}</strong>? This marks it inactive rather than
            deleting it — the record stays in your catalog but won't be available for new orders.
          </p>
          <div className="form-actions">
            <button className="btn" onClick={closeModal}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
              {saving ? 'Working...' : 'Deactivate'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}