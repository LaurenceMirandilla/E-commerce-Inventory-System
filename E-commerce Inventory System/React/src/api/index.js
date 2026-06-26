import client from './client';

function toQuery(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null);
  if (entries.length === 0) return '';
  const qs = new URLSearchParams(entries).toString();
  return `?${qs}`;
}

export const productsApi = {
  getAll: (params) => client.get(`/products${toQuery(params)}`),
  getById: (id) => client.get(`/products/${id}`),

  create: (dto) => client.post('/products', {
    SKU: dto.sku,
    Name: dto.name,
    Description: dto.description || null,
    CategoryName: dto.categoryName,
    UnitPrice: dto.unitPrice,
    CostPrice: dto.costPrice,
    StockQuantity: dto.stockQuantity,
    LowStockThreshold: dto.lowStockThreshold,
  }),

  update: (id, dto) => client.put(`/products/${id}`, {
    SKU: dto.sku,
    Name: dto.name,
    Description: dto.description || null,
    CategoryName: dto.categoryName,
    UnitPrice: dto.unitPrice,
    CostPrice: dto.costPrice,
    StockQuantity: dto.stockQuantity,
    LowStockThreshold: dto.lowStockThreshold,
    IsActive: dto.isActive,
  }),

  delete: (id) => client.del(`/products/${id}`),
};

export const ordersApi = {
  getAll: (params) => client.get(`/Orders${toQuery(params)}`),
  getById: (id) => client.get(`/Orders/${id}`),


  create: (dto) => client.post('/Orders', {
    CustomerId: dto.customerId,
    Notes: dto.notes || null,
    Items: dto.items.map((i) => ({ ProductId: i.productId, Quantity: i.quantity })),
  }),

  updateStatus: (id, status) => client.patch(`/Orders/${id}/status`, { Status: status }),
};

export const customersApi = {
  getAll: () => client.get('/Customers'),
  getById: (id) => client.get(`/Customers/${id}`),

  create: (dto) => client.post('/Customers', {
    FullName: dto.fullName,
    Email: dto.email,
    Phone: dto.phone || null,
    Address: dto.address || null,
  }),
};

export const categoriesApi = {
  getAll: () => client.get('/categories'),
  getById: (id) => client.get(`/categories/${id}`),

  create: (dto) => client.post('/categories', {
    Name: dto.name,
    Description: dto.description || null,
  }),

  update: (id, dto) => client.put(`/categories/${id}`, {
    Name: dto.name,
    Description: dto.description || null,
  }),

  delete: (id) => client.del(`/categories/${id}`),
};

export const analyticsApi = {
  getInventoryValue: () => client.get('/Analytics/inventory-value'),
  getLowStock: () => client.get('/Analytics/low-stock'),

  getSalesOverTime: (from, to) => client.get(`/Analytics/sales${toQuery({
    from: from instanceof Date ? from.toISOString() : from,
    to: to instanceof Date ? to.toISOString() : to,
  })}`),

  getTopProducts: (limit = 5, days = 30) => client.get(`/Analytics/top-products${toQuery({ limit, days })}`),
};