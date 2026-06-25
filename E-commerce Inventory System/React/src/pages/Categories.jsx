import { useEffect, useState } from 'react';
import { categoriesApi } from '../api';
import Topbar from '../components/Topbar';
import Modal from '../components/Modal';
import '../components/Table.css';
import '../components/Form.css';
import './Categories.css';

const emptyForm = { name: '', description: '' };

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch]          = useState('');
  const [loading, setLoading]        = useState(true);
  const [modal, setModal]            = useState(null);
  const [selected, setSelected]      = useState(null);
  const [form, setForm]              = useState(emptyForm);
  const [saving, setSaving]          = useState(false);
  const [error, setError]            = useState('');

  const load = () => {
    categoriesApi.getAll().then(setCategories).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const visibleCategories = search
    ? categories.filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase()))
    : categories;

  const openCreate = () => { setForm(emptyForm); setError(''); setModal('create'); };
  const openEdit = (c) => { setSelected(c); setForm({ name: c.name, description: c.description || '' }); setError(''); setModal('edit'); };
  const openDelete = (c) => { setSelected(c); setError(''); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await categoriesApi.create({ name: form.name.trim(), description: form.description });
      closeModal(); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleEdit = async () => {
    setSaving(true);
    try {
      await categoriesApi.update(selected.categoryId, { name: form.name.trim(), description: form.description });
      closeModal(); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await categoriesApi.delete(selected.categoryId);
      closeModal(); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="page">
      <Topbar title="Categories" subtitle="Organize your product catalog" />
      <div className="page-content">
        {error && modal === null && <div className="form-error">{error}</div>}

        <div className="toolbar">
          <div className="toolbar-left">
            <input
              className="search-input"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            <i className="ti ti-plus" aria-hidden="true" /> Add category
          </button>
        </div>

        {loading ? (
          <div className="page-loading">Loading...</div>
        ) : visibleCategories.length === 0 ? (
          <div className="table-wrap">
            <div className="empty-state" style={{ padding: '48px 0' }}>
              <i className="ti ti-folder" aria-hidden="true" />
              {search ? 'No categories match your search.' : 'No categories yet.'}
            </div>
          </div>
        ) : (
          <div className="category-grid">
            {visibleCategories.map((c) => (
              <div className="category-card" key={c.categoryId}>
                <div className="category-card-top">
                  <span className="category-name">{c.name}</span>
                  <div className="category-actions">
                    <button className="icon-btn" onClick={() => openEdit(c)} title="Edit">
                      <i className="ti ti-edit" aria-hidden="true" />
                    </button>
                    <button
                      className="icon-btn danger"
                      onClick={() => c.productCount === 0 && openDelete(c)}
                      title={c.productCount > 0 ? `Can't delete — ${c.productCount} product(s) assigned` : 'Delete'}
                      disabled={c.productCount > 0}
                    >
                      <i className={c.productCount > 0 ? 'ti ti-lock' : 'ti ti-trash'} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                {c.description && <p className="category-description">{c.description}</p>}
                <p className="category-count">{c.productCount} product{c.productCount === 1 ? '' : 's'}</p>
              </div>
            ))}
          </div>
        )}

        {!loading && categories.some((c) => c.productCount === 0) && (
          <div className="category-hint">
            <i className="ti ti-info-circle" aria-hidden="true" />
            Categories with products can be renamed but not deleted, since every product needs a category.
            Delete is only enabled once a category has zero products.
          </div>
        )}
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'create' ? 'Add category' : 'Edit category'} onClose={closeModal}>
          {error && <div className="form-error">{error}</div>}
          <div className="form-group">
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Description (optional)</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-actions">
            <button className="btn" onClick={closeModal}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={modal === 'create' ? handleCreate : handleEdit}
              disabled={saving || !form.name.trim()}
            >
              {saving ? 'Saving...' : modal === 'create' ? 'Add category' : 'Save changes'}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'delete' && selected && (
        <Modal title="Delete category" onClose={closeModal}>
          {error && <div className="form-error">{error}</div>}
          <p style={{ fontSize: 13, color: '#374151' }}>
            Delete <strong>{selected.name}</strong>? This category has no products assigned, so this is permanent.
          </p>
          <div className="form-actions">
            <button className="btn" onClick={closeModal}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
              {saving ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}