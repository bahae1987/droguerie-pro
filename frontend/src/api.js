/* Client API + session (frontend web) — v3 */
const API = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
let token = localStorage.getItem("dp_token") || null;
export const setToken = (t) => { token = t; t ? localStorage.setItem("dp_token", t) : localStorage.removeItem("dp_token"); };
export const API_URL = API;
export const authHeader = () => (token ? { Authorization: "Bearer " + token } : {});

async function req(path, opts = {}) {
  const res = await fetch(API + path, { ...opts, headers: { "Content-Type": "application/json", ...authHeader(), ...(opts.headers || {}) } });
  if (res.status === 401) { setToken(null); location.reload(); }
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Erreur " + res.status);
  return res.json();
}

export const api = {
  login: (login, password) => req("/auth/login", { method: "POST", body: JSON.stringify({ login, password }) }),
  me: () => req("/auth/me"),
  changePassword: (ancien, nouveau) => req("/auth/password", { method: "POST", body: JSON.stringify({ ancien, nouveau }) }),
  dashboard: () => req("/dashboard"),

  // Produits (+ date_expiration)
  products: () => req("/products"),
  saveProduct: (p) => p.id ? req("/products/" + p.id, { method: "PUT", body: JSON.stringify(p) }) : req("/products", { method: "POST", body: JSON.stringify(p) }),
  deleteProduct: (id) => req("/products/" + id, { method: "DELETE" }),
  addStock: (id, qte, motif) => req("/products/" + id + "/stock", { method: "POST", body: JSON.stringify({ qte, motif }) }),
  peremptions: (jours = 90) => req("/products/peremption?jours=" + jours),

  clients: () => req("/clients"),
  saveClient: (c) => c.id ? req("/clients/" + c.id, { method: "PUT", body: JSON.stringify(c) }) : req("/clients", { method: "POST", body: JSON.stringify(c) }),
  deleteClient: (id) => req("/clients/" + id, { method: "DELETE" }),
  suppliers: () => req("/suppliers"),
  saveSupplier: (s) => s.id ? req("/suppliers/" + s.id, { method: "PUT", body: JSON.stringify(s) }) : req("/suppliers", { method: "POST", body: JSON.stringify(s) }),
  deleteSupplier: (id) => req("/suppliers/" + id, { method: "DELETE" }),

  // Achats (partiel)
  purchaseOrders: () => req("/purchase-orders"),
  createPurchaseOrder: (d) => req("/purchase-orders", { method: "POST", body: JSON.stringify(d) }),
  deletePurchaseOrder: (id) => req("/purchase-orders/" + id, { method: "DELETE" }),
  purchasePending: (fournisseur_id, type, base) => req(`/purchase-orders/pending?fournisseur_id=${fournisseur_id}&type=${type}&base=${base || ""}`),
  receptions: () => req("/receptions"),
  createReception: (d) => req("/receptions", { method: "POST", body: JSON.stringify(d) }),
  deleteReception: (id) => req("/receptions/" + id, { method: "DELETE" }),
  supplierInvoices: () => req("/supplier-invoices"),
  createSupplierInvoice: (d) => req("/supplier-invoices", { method: "POST", body: JSON.stringify(d) }),
  paySupplierInvoice: (id, p) => req("/supplier-invoices/" + id + "/pay", { method: "POST", body: JSON.stringify(p) }),
  cancelSupplierPayment: (id, payId) => req(`/supplier-invoices/${id}/pay/${payId}`, { method: "DELETE" }),
  deleteSupplierInvoice: (id) => req("/supplier-invoices/" + id, { method: "DELETE" }),

  // Ventes (partiel)
  salesOrders: () => req("/sales-orders"),
  createSalesOrder: (d) => req("/sales-orders", { method: "POST", body: JSON.stringify(d) }),
  confirmSalesOrder: (id) => req("/sales-orders/" + id + "/confirm", { method: "POST" }),
  deleteSalesOrder: (id) => req("/sales-orders/" + id, { method: "DELETE" }),
  salesPending: (client_id, type, base) => req(`/sales-orders/pending?client_id=${client_id}&type=${type}&base=${base || ""}`),
  deliveries: () => req("/deliveries"),
  createDelivery: (d) => req("/deliveries", { method: "POST", body: JSON.stringify(d) }),
  deleteDelivery: (id) => req("/deliveries/" + id, { method: "DELETE" }),
  customerInvoices: () => req("/customer-invoices"),
  createCustomerInvoice: (d) => req("/customer-invoices", { method: "POST", body: JSON.stringify(d) }),
  payCustomerInvoice: (id, p) => req("/customer-invoices/" + id + "/pay", { method: "POST", body: JSON.stringify(p) }),
  cancelCustomerPayment: (id, payId) => req(`/customer-invoices/${id}/pay/${payId}`, { method: "DELETE" }),
  deleteCustomerInvoice: (id) => req("/customer-invoices/" + id, { method: "DELETE" }),
  saleDirect: (d) => req("/sales/direct", { method: "POST", body: JSON.stringify(d) }),

  // Finance : créances / dettes + relevés
  financeClients: () => req("/finance/clients"),
  financeSuppliers: () => req("/finance/suppliers"),
  clientStatement: (id) => req("/finance/clients/" + id),
  supplierStatement: (id) => req("/finance/suppliers/" + id),

  // Charges & déplacements
  trips: () => req("/trips"),
  saveTrip: (t) => t.id ? req("/trips/" + t.id, { method: "PUT", body: JSON.stringify(t) }) : req("/trips", { method: "POST", body: JSON.stringify(t) }),
  deleteTrip: (id) => req("/trips/" + id, { method: "DELETE" }),
  tripMargin: (id) => req("/trips/" + id + "/margin"),
  expenses: (trip_id) => req("/expenses" + (trip_id ? "?trip_id=" + trip_id : "")),
  expenseCategories: () => req("/expense-categories"),
  saveExpense: (e) => e.id ? req("/expenses/" + e.id, { method: "PUT", body: JSON.stringify(e) }) : req("/expenses", { method: "POST", body: JSON.stringify(e) }),
  deleteExpense: (id) => req("/expenses/" + id, { method: "DELETE" }),

  // Pièces jointes (toute entité)
  attachments: (entityType, entityId) => req(`/attachments/${entityType}/${entityId}`),
  uploadAttachment: async (entityType, entityId, file) => {
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch(`${API}/attachments/${entityType}/${entityId}`, { method: "POST", headers: { ...authHeader() }, body: fd });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Échec upload");
    return res.json();
  },
  attachmentUrl: (id) => `${API}/attachments/file/${id}`,          // ouvrir avec le header Authorization (fetch blob) ou lien signé
  downloadAttachment: async (id, name) => { const res = await fetch(`${API}/attachments/file/${id}`, { headers: { ...authHeader() } }); const blob = await res.blob(); const u = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = name || "piece-jointe"; a.click(); URL.revokeObjectURL(u); },
  deleteAttachment: (id) => req("/attachments/" + id, { method: "DELETE" }),

  settings: () => req("/settings"),
  saveSettings: (s) => req("/settings", { method: "PUT", body: JSON.stringify(s) }),
  roles: () => req("/roles"),
  users: () => req("/users"),
  saveUser: (u) => u.id ? req("/users/" + u.id, { method: "PUT", body: JSON.stringify(u) }) : req("/users", { method: "POST", body: JSON.stringify(u) }),
  deleteUser: (id) => req("/users/" + id, { method: "DELETE" }),
  audit: () => req("/audit"),
};
export const can = (perms, key) => perms && (perms["*"] === true || perms[key] === true);
