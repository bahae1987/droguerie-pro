import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import './index.css';

console.log('DROGUERIEPRO V38 SIMPLE_PRINT_PAYMENTS_TOOLS OK');

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || 'https://example.supabase.co',
  supabaseKey || 'missing-key'
);

const today = () => new Date().toISOString().slice(0, 10);
const fmt = n => (Number(n) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dh = n => fmt(n) + ' DH';

const TXT = {
  fr: {
    login: 'Connexion', username: 'Utilisateur', password: 'Mot de passe', connect: 'Se connecter',
    dashboard: 'Tableau de bord', products: 'Produits / Stock', sales: 'Ventes', purchases: 'Achats',
    payments: 'Paiements', stockMoves: 'Mouvements stock', audit: 'Traçabilité', settings: 'Paramètres', permissions: 'Autorisations', clients: 'Clients', suppliers: 'Fournisseurs', users: 'Utilisateurs', branch: 'Droguerie', branches: 'Gestion drogueries', city: 'Ville', manager: 'Responsable', active: 'Actif', deactivate: 'Désactiver', activate: 'Activer', fullName: 'Nom complet', changePassword: 'Changer mot de passe',
    logout: 'Déconnexion', lang: 'العربية', new: 'Nouveau', save: 'Enregistrer', edit: 'Modifier',
    del: 'Supprimer', actions: 'Actions', stock: 'Stock', price: 'Prix', create: 'Créer',
    direct: 'Direct', advance: 'Avancer', pay: 'Régler', partialDelivery: 'Livraison partielle',
    partialReceipt: 'Réception partielle', all: 'Tous', quotes: 'Devis', orders: 'Commandes',
    deliveries: 'Livraisons', receipts: 'Réceptions', invoices: 'Factures', remaining: 'Reste',
    paid: 'Réglée', unpaid: 'Non réglée', partial: 'Partielle', cashIn: 'Encaissements',
    cashOut: 'Décaissements', vat: 'TVA', theme: 'Thème', company: 'Société', address: 'Adresse', phone: 'Téléphone', ice: 'ICE', cashRegister: 'Caisse', receiptNo: 'N° reçu', chequeNo: 'N° chèque', bank: 'Banque', dueDate: 'Échéance', paymentStatus: 'Statut', transferRef: 'Réf. virement', valueDate: 'Date valeur', terminal: 'TPE', transactionNo: 'N° transaction', billNo: 'N° effet', note: 'Observation', quantity: 'Quantité', date: 'Date', customer: 'Client',
    supplier: 'Fournisseur', product: 'Produit', base: 'Base', remainingQty: 'Qté restante', orderedQty: 'Qté commandée', deliveredQty: 'Qté livrée', receivedQty: 'Qté reçue', qtyToProcess: 'Qté à traiter', alreadyProcessed: 'Déjà traité', includeLine: 'Inclure', removeLine: 'Retirer ligne', restoreLine: 'Restaurer ligne', open: 'Ouvert', closed: 'Clôturé', preview: 'Aperçu', print: 'Imprimer', unitPrice: 'PU', totalHT: 'Total HT', totalVAT: 'TVA', totalTTC: 'Total TTC', cancelPayment: 'Annuler règlement', canceled: 'Annulé', subtotal: 'Sous-total', signature: 'Signature', preparedBy: 'Préparé par', printDate: 'Date impression', legalNote: 'Document généré par DrogueriePro', arabicName: 'Nom arabe', docType: 'Type document', purchasePrice: 'Prix achat', salePrice: 'Prix vente', margin: 'Marge', movement: 'Mouvement', object: 'Objet', detail: 'Détail', actor: 'Utilisateur', createdBy: 'Créé par', baseDocNo: 'N° doc. base', location: 'Emplacement', assignedTo: 'Affecté à', clientOwner: 'Compte', stockTransfer: 'Transfert stock', fromBranch: 'Droguerie source', toBranch: 'Droguerie destination', stockValue: 'Valeur stock', lowStock: 'Stock critique', stockByBranch: 'Stock par droguerie', adjustment: 'Ajustement', stockIn: 'Entrée stock', stockOut: 'Sortie stock', reason: 'Motif', category: 'Catégorie', ref: 'Référence', name: 'Nom', role: 'Profil', payment: 'Paiement', document: 'Document', form: 'Formulaire', select: 'Sélectionner', productRef: 'Réf. produit', unit: 'Unité', minStock: 'Stock min', threshold: 'Seuil', stockAdjustIn: 'Entrée stock', stockAdjustOut: 'Sortie stock', operationType: 'Type opération', unitPurchasePrice: 'Prix achat unitaire', unitSalePrice: 'Prix vente unitaire', customerForm: 'Fiche client', supplierForm: 'Fiche fournisseur', productForm: 'Fiche produit', documentLines: 'Lignes document', completed: 'Terminé', notAvailable: 'Non applicable', mobileApp: 'Application mobile', androidApp: 'Application Android', iosApp: 'Application iOS', downloadAndroid: 'Télécharger APK Android', downloadIos: 'Télécharger iOS', installGuide: 'Guide installation', mobileAdminPortal: 'Portail mobile administrateur', appStoreNote: 'iOS nécessite App Store / TestFlight avec compte Apple Developer', androidNote: 'Android peut être installé via APK interne ou publié sur Play Store', quickActions: 'Actions rapides', businessHealth: 'Santé activité', alerts: 'Alertes', recentActivity: 'Activité récente', topProducts: 'Top produits', todaySales: 'Ventes du jour', unpaidInvoices: 'Factures non réglées', stockAlerts: 'Alertes stock', customersCount: 'Nombre clients', suppliersCount: 'Nombre fournisseurs', adminCenter: 'Centre administrateur', proMode: 'Mode Pro', search: 'Rechercher', exportCsv: 'Exporter CSV', printList: 'Imprimer liste', risk: 'Risque', healthy: 'Sain', warning: 'Attention', critical: 'Critique', noData: 'Aucune donnée', performance: 'Performance', customerInvoice: 'Facture client', supplierInvoice: 'Facture fournisseur', customerQuote: 'Devis client', customerOrder: 'Commande client', customerDelivery: 'Bon de livraison client', supplierOrder: 'Commande fournisseur', supplierReceipt: 'Bon de réception fournisseur', profitCenter: 'Centre rentabilité', profitability: 'Rentabilité', profitAlerts: 'Alertes rentabilité', priceSuggestion: 'Suggestion prix', minimumSalePrice: 'Prix minimum conseillé', targetMargin: 'Marge cible', marginRate: 'Taux marge', reorderProposal: 'Proposition réapprovisionnement', reorderQty: 'Qté à commander', deadStock: 'Stock dormant', fastMoving: 'Rotation rapide', slowMoving: 'Rotation lente', valuation: 'Valorisation', commercialTerms: 'Conditions commerciales', preparedFor: 'Établi pour', documentValidity: 'Validité document', deliveryAddress: 'Adresse livraison', tools: 'Outils', calculator: 'Calculatrice', marginCalculator: 'Calcul marge', salePriceFromMargin: 'Prix selon marge', purchaseCost: 'Coût achat', wantedMargin: 'Marge souhaitée', result: 'Résultat', clear: 'Effacer', simplePrint: 'Impression simple', kpiRevenue: 'Chiffre d’affaires', kpiPurchases: 'Volume achats', kpiCashIn: 'Total encaissé', kpiCashOut: 'Total décaissé', kpiStockQty: 'Quantité stock', kpiOpenDocs: 'Documents ouverts', kpiPaidRate: 'Taux factures réglées', kpiLowMargin: 'Produits faible marge', paymentList: 'Liste paiements'
  },
  ar: {
    login: 'تسجيل الدخول', username: 'اسم المستخدم', password: 'كلمة المرور', connect: 'الدخول إلى النظام',
    dashboard: 'لوحة التحكم', products: 'المنتجات والمخزون', sales: 'المبيعات', purchases: 'المشتريات والتوريد',
    payments: 'المدفوعات', stockMoves: 'حركات المخزون', audit: 'سجل العمليات', settings: 'الإعدادات', permissions: 'الصلاحيات', clients: 'الزبناء', suppliers: 'الموردون', users: 'المستخدمون', branch: 'الفرع', branches: 'إدارة الفروع', city: 'المدينة', manager: 'المسؤول', active: 'نشط', deactivate: 'تعطيل الحساب', activate: 'تفعيل الحساب', fullName: 'الاسم الكامل', changePassword: 'تغيير كلمة المرور',
    logout: 'تسجيل الخروج', lang: 'Français', new: 'إضافة جديد', save: 'حفظ البيانات', edit: 'تعديل البيانات',
    del: 'حذف السجل', actions: 'العمليات', stock: 'المخزون', price: 'الثمن', create: 'إنشاء',
    direct: 'مباشر', advance: 'الانتقال للمرحلة التالية', pay: 'تسجيل دفعة', partialDelivery: 'تسليم جزئي',
    partialReceipt: 'استلام جزئي', all: 'الكل', quotes: 'عروض الأسعار', orders: 'الطلبات',
    deliveries: 'سندات التسليم', receipts: 'سندات الاستلام', invoices: 'الفواتير', remaining: 'المتبقي',
    paid: 'مدفوعة بالكامل', unpaid: 'غير مدفوعة', partial: 'مدفوعة جزئياً', cashIn: 'المقبوضات',
    cashOut: 'المدفوعات', vat: 'الضريبة على القيمة المضافة', theme: 'المظهر', company: 'الشركة', address: 'العنوان', phone: 'الهاتف', ice: 'المعرّف الموحد للمقاولة ICE', cashRegister: 'الصندوق', receiptNo: 'رقم الوصل', chequeNo: 'رقم الشيك', bank: 'البنك', dueDate: 'تاريخ الاستحقاق', paymentStatus: 'حالة الأداء', transferRef: 'مرجع التحويل البنكي', valueDate: 'تاريخ القيمة', terminal: 'جهاز الأداء الإلكتروني', transactionNo: 'رقم العملية', billNo: 'رقم الكمبيالة', note: 'ملاحظة', quantity: 'الكمية', date: 'التاريخ', customer: 'الزبون',
    supplier: 'المورد', product: 'المنتج', base: 'الوثيقة الأصلية', remainingQty: 'الكمية المتبقية', orderedQty: 'الكمية المطلوبة', deliveredQty: 'الكمية المسلمة', receivedQty: 'الكمية المستلمة', qtyToProcess: 'الكمية المراد معالجتها', alreadyProcessed: 'تمت معالجته سابقاً', includeLine: 'إدراج السطر', removeLine: 'استبعاد السطر', restoreLine: 'إرجاع السطر', open: 'مفتوح', closed: 'مغلق', preview: 'معاينة الوثيقة', print: 'طباعة', unitPrice: 'ثمن الوحدة', totalHT: 'المبلغ دون الضريبة', totalVAT: 'قيمة الضريبة', totalTTC: 'المبلغ الإجمالي مع الضريبة', cancelPayment: 'إلغاء الدفعة', canceled: 'ملغى', subtotal: 'المجموع الفرعي', signature: 'التوقيع والختم', preparedBy: 'أُعدت بواسطة', printDate: 'تاريخ الطباعة', legalNote: 'وثيقة صادرة عن نظام DrogueriePro', arabicName: 'الاسم بالعربية', docType: 'نوع الوثيقة', purchasePrice: 'ثمن الشراء', salePrice: 'ثمن البيع', margin: 'الهامش', movement: 'الحركة', object: 'الكيان', detail: 'التفاصيل', actor: 'الموظف', createdBy: 'تم الإنشاء بواسطة', baseDocNo: 'رقم الوثيقة الأصلية', location: 'الموقع / الفرع', assignedTo: 'مكلف به', clientOwner: 'الحساب التجاري', stockTransfer: 'تحويل المخزون', fromBranch: 'الفرع المصدر', toBranch: 'الفرع الوجهة', stockValue: 'القيمة المالية للمخزون', lowStock: 'مخزون منخفض', stockByBranch: 'المخزون حسب الفرع', adjustment: 'تعديل المخزون', stockIn: 'إضافة كمية للمخزون', stockOut: 'خصم كمية من المخزون', reason: 'السبب', category: 'الصنف', ref: 'المرجع', name: 'الاسم', role: 'الدور', payment: 'الأداء', document: 'الوثيقة', form: 'النموذج', select: 'اختيار', productRef: 'مرجع المنتج', unit: 'الوحدة', minStock: 'الحد الأدنى للمخزون', threshold: 'عتبة التنبيه', stockAdjustIn: 'إضافة للمخزون', stockAdjustOut: 'سحب من المخزون', operationType: 'نوع العملية', unitPurchasePrice: 'ثمن الشراء للوحدة', unitSalePrice: 'ثمن البيع للوحدة', customerForm: 'بطاقة الزبون', supplierForm: 'بطاقة المورد', productForm: 'بطاقة المنتج', documentLines: 'سطور الوثيقة', completed: 'منتهية', notAvailable: 'غير مطبق', mobileApp: 'تطبيق الهاتف', androidApp: 'تطبيق أندرويد', iosApp: 'تطبيق iOS', downloadAndroid: 'تحميل تطبيق أندرويد APK', downloadIos: 'تحميل تطبيق iOS', installGuide: 'دليل التثبيت', mobileAdminPortal: 'بوابة إدارة التطبيق المحمول', appStoreNote: 'يتطلب iOS النشر عبر App Store أو TestFlight وحساب Apple Developer', androidNote: 'يمكن تثبيت أندرويد عبر APK داخلي أو نشره على Play Store', quickActions: 'إجراءات سريعة', businessHealth: 'حالة النشاط التجاري', alerts: 'التنبيهات', recentActivity: 'آخر العمليات', topProducts: 'أفضل المنتجات', todaySales: 'إجمالي مبيعات اليوم', unpaidInvoices: 'الفواتير غير المحصلة', stockAlerts: 'تنبيهات نقص المخزون', customersCount: 'عدد الزبناء', suppliersCount: 'عدد الموردين', adminCenter: 'مركز الإدارة', proMode: 'الوضع الإداري', search: 'البحث', exportCsv: 'تصدير CSV', printList: 'طباعة اللائحة', risk: 'مخاطر', healthy: 'وضعية سليمة', warning: 'تحتاج للمتابعة', critical: 'حالة حرجة', noData: 'لا توجد بيانات', performance: 'الأداء', grossMargin: 'الهامش الخام', salesPipeline: 'مسار المبيعات', purchasePipeline: 'مسار المشتريات', cashPosition: 'وضعية السيولة', inventoryCoverage: 'تغطية المخزون', operationalRisks: 'المخاطر التشغيلية', branchRanking: 'ترتيب الفروع', monthlyTrend: 'التطور الشهري', conversionRate: 'نسبة التحويل', avgTicket: 'متوسط الفاتورة', documentsCount: 'عدد الوثائق', proReport: 'تقرير إداري', refresh: 'تحديث', executiveSummary: 'ملخص تنفيذي', salesToCollect: 'مبالغ في انتظار التحصيل', purchasesToPay: 'مبالغ في انتظار الأداء', netCash: 'الصافي المتوقع', bestBranch: 'أفضل فرع', quickCreateSale: 'إنشاء عملية بيع', quickCreatePurchase: 'إنشاء عملية شراء', quickCreateProduct: 'إضافة منتج', quickCreateClient: 'إضافة زبون',
    fiscalId: 'المعرّف الجبائي', rc: 'السجل التجاري', patente: 'رسم المهني', cnss: 'رقم CNSS', ifNumber: 'المعرّف الضريبي IF', companyInfo: 'معلومات الشركة', clientInfo: 'معلومات الزبون', supplierInfo: 'معلومات المورد', paymentTerms: 'شروط الأداء', legalMoroccoNote: 'وثيقة تجارية صادرة وفق المعطيات المصرح بها من طرف الشركة. يرجى مراجعة المبالغ والضريبة على القيمة المضافة قبل الاعتماد النهائي.', stampAndSignature: 'الختم والتوقيع', commercialDocument: 'وثيقة تجارية', invoiceTitle: 'فاتورة', deliveryTitle: 'سند تسليم', receiptTitle: 'سند استلام', quoteTitle: 'عرض سعر', orderTitle: 'طلبية', amountInWords: 'المبلغ بالحروف', taxSummary: 'ملخص الضريبة', netToPay: 'الصافي للأداء', thankYou: 'شكراً لتعاملكم معنا', generatedBy: 'تم إنشاء الوثيقة بواسطة', customerInvoice: 'فاتورة زبون', supplierInvoice: 'فاتورة مورد', customerQuote: 'عرض سعر للزبون', customerOrder: 'طلبية زبون', customerDelivery: 'سند تسليم للزبون', supplierOrder: 'طلبية مورد', supplierReceipt: 'سند استلام من المورد', profitCenter: 'مركز الربحية', profitability: 'الربحية', profitAlerts: 'تنبيهات الربحية', priceSuggestion: 'اقتراح الثمن', minimumSalePrice: 'أدنى ثمن بيع مقترح', targetMargin: 'الهامش المستهدف', marginRate: 'نسبة الهامش', reorderProposal: 'اقتراح إعادة التزويد', reorderQty: 'الكمية المقترحة للطلب', deadStock: 'مخزون راكد', fastMoving: 'دوران سريع', slowMoving: 'دوران بطيء', valuation: 'التقييم المالي', commercialTerms: 'الشروط التجارية', preparedFor: 'موجه إلى', documentValidity: 'صلاحية الوثيقة', deliveryAddress: 'عنوان التسليم', tools: 'الأدوات', calculator: 'آلة حاسبة', marginCalculator: 'حاسبة الهامش', salePriceFromMargin: 'ثمن البيع حسب الهامش', purchaseCost: 'تكلفة الشراء', wantedMargin: 'الهامش المطلوب', result: 'النتيجة', clear: 'مسح', simplePrint: 'طباعة مبسطة', kpiRevenue: 'رقم المعاملات', kpiPurchases: 'حجم المشتريات', kpiCashIn: 'مجموع المقبوضات', kpiCashOut: 'مجموع المدفوعات', kpiStockQty: 'كمية المخزون', kpiOpenDocs: 'وثائق مفتوحة', kpiPaidRate: 'نسبة الفواتير المؤداة', kpiLowMargin: 'منتجات بهامش ضعيف', paymentList: 'لائحة المدفوعات'
  }
};

const PERMS = [
  'dashboard.read', 'products.read', 'products.write', 'products.delete',
  'clients.read', 'clients.write', 'clients.delete', 'clients.assign',
  'suppliers.read', 'suppliers.write', 'suppliers.delete',
  'sales.read', 'sales.write', 'sales.delete',
  'purchases.read', 'purchases.write', 'purchases.delete',
  'users.read', 'users.write', 'stock.read', 'stock.adjust', 'stock.transfer', 'audit.read', 'payments.read', 'payments.cancel', 'mobile.manage', 'sales.pay', 'purchases.pay'
];


function hasPerm(session, code) {
  return Array.isArray(session?.perms) && session.perms.includes(code);
}

function getStoredSession() {
  try {
    return JSON.parse(localStorage.getItem('droguerie_session') || 'null');
  } catch {
    return null;
  }
}

function setStoredSession(s) {
  localStorage.setItem('droguerie_session', JSON.stringify(s));
}

function clearStoredSession() {
  localStorage.removeItem('droguerie_session');
}

async function getUserPermissions(userId) {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, role_id')
    .eq('id', userId)
    .single();

  if (userError) throw new Error(userError.message);

  if (!user?.role_id) {
    return [];
  }

  const { data, error } = await supabase
    .from('role_permissions')
    .select('permissions(code)')
    .eq('role_id', user.role_id);

  if (error) throw new Error(error.message);

  return (data || [])
    .map(x => x.permissions?.code)
    .filter(Boolean);
}


function can(code) {
  return hasPerm(getStoredSession(), code);
}

function requirePerm(code, label = 'Action') {
  if (!can(code)) {
    throw new Error(label + ' non autorisée');
  }
}

function currentBranchId() {
  return branchId(getStoredSession());
}

function branchScopePayload(payload = {}) {
  const session = getStoredSession();
  if (isAdmin(session)) {
    return { ...payload, branch_id: payload.branch_id || payload.branchId || branchId(session) || null };
  }
  return { ...payload, branch_id: branchId(session) };
}

async function getProductBranchId(productId) {
  const { data, error } = await supabase.from('products').select('branch_id').eq('id', productId).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.branch_id || null;
}

async function assertProductInUserBranch(productId) {
  const session = getStoredSession();
  if (isAdmin(session)) return;
  const pBranch = await getProductBranchId(productId);
  if (Number(pBranch || 0) !== Number(branchId(session) || 0)) {
    throw new Error('Produit non autorisé : il appartient à une autre droguerie');
  }
}



const PARTY_PERMS = {
  clients: { read: 'clients.read', write: 'clients.write', delete: 'clients.delete' },
  suppliers: { read: 'suppliers.read', write: 'suppliers.write', delete: 'suppliers.delete' }
};

function roleName(session = getStoredSession()) {
  return session?.user?.role || '';
}

function canManageAllBranchData(session = getStoredSession()) {
  return isAdmin(session) || isManager(session);
}

function canSeePartyRecord(record, type, session = getStoredSession()) {
  if (isAdmin(session)) return true;
  if (isManager(session)) return Number(record.branch_id || 0) === Number(branchId(session) || 0);

  if (type === 'clients') {
    return Number(record.assigned_to || 0) === Number(session?.user?.id || 0)
      || Number(record.created_by || 0) === Number(session?.user?.id || 0);
  }

  return Number(record.branch_id || 0) === Number(branchId(session) || 0);
}

function enrichParties(rows, usersMap = {}) {
  return (rows || []).map(x => ({
    ...x,
    createdByLabel: usersMap[x.created_by] || (x.created_by ? ('User #' + x.created_by) : '-'),
    assignedToLabel: usersMap[x.assigned_to] || (x.assigned_to ? ('User #' + x.assigned_to) : '-')
  }));
}

async function loadBranchStockSummary() {
  const session = getStoredSession();
  let q = supabase
    .from('products')
    .select('id, quantity, min_stock, purchase_price, branch_id, branches(name)');

  if (!isAdmin(session) && branchId(session)) {
    q = q.eq('branch_id', branchId(session));
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  const byBranch = {};
  (data || []).forEach(p => {
    const id = p.branch_id || 0;
    const name = p.branches?.name || 'Sans droguerie';
    if (!byBranch[id]) byBranch[id] = { branchId: id, branchName: name, products: 0, qty: 0, value: 0, lowStock: 0 };
    byBranch[id].products += 1;
    byBranch[id].qty += Number(p.quantity || 0);
    byBranch[id].value += Number(p.quantity || 0) * Number(p.purchase_price || 0);
    if (Number(p.quantity || 0) <= Number(p.min_stock || 0)) byBranch[id].lowStock += 1;
  });

  return Object.values(byBranch);
}

async function transferStock({ productId, toBranchId, quantity, reason }) {
  requirePerm('stock.adjust', 'Transfert stock');

  const qty = Number(quantity || 0);
  if (!productId || !toBranchId || qty <= 0) throw new Error('Transfert stock invalide');

  const session = getStoredSession();
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (error) throw new Error(error.message);

  if (!isAdmin(session) && Number(product.branch_id || 0) !== Number(branchId(session) || 0)) {
    throw new Error('Transfert refusé : produit hors droguerie utilisateur');
  }

  if (Number(product.branch_id || 0) === Number(toBranchId)) {
    throw new Error('La droguerie destination doit être différente');
  }

  if (Number(product.quantity || 0) < qty) {
    throw new Error('Stock insuffisant pour le transfert');
  }

  const docNumber = 'TRF-' + new Date().getFullYear() + '-' + Date.now();

  await updateStock([{ produitId: product.id, qte: qty }], -1, reason || 'Transfert stock sortie', { docType: 'Transfert', docNumber });

  const { data: destProduct, error: destErr } = await supabase
    .from('products')
    .select('*')
    .eq('ref', product.ref)
    .eq('branch_id', toBranchId)
    .maybeSingle();

  if (destErr) throw new Error(destErr.message);

  if (destProduct?.id) {
    const newQty = Number(destProduct.quantity || 0) + qty;
    const { error: upErr } = await supabase.from('products').update({ quantity: newQty }).eq('id', destProduct.id);
    if (upErr) throw new Error(upErr.message);

    await supabase.from('stock_movements').insert({
      product_id: destProduct.id,
      quantity: qty,
      reason: reason || 'Transfert stock entrée',
      branch_id: toBranchId,
      doc_type: 'Transfert',
      doc_number: docNumber,
      user_id: session?.user?.id || null,
      user_label: currentUserLabel(),
      created_at: new Date().toISOString()
    });
  } else {
    const copy = {
      ref: product.ref,
      name: product.name,
      name_ar: product.name_ar || '',
      category: product.category || '',
      unit: product.unit || 'Pièce',
      purchase_price: product.purchase_price || 0,
      sale_price: product.sale_price || 0,
      quantity: qty,
      min_stock: product.min_stock || 0,
      supplier_id: product.supplier_id || null,
      branch_id: toBranchId
    };

    const { data: inserted, error: insErr } = await supabase.from('products').insert(copy).select('id').single();
    if (insErr) throw new Error(insErr.message);

    await supabase.from('stock_movements').insert({
      product_id: inserted.id,
      quantity: qty,
      reason: reason || 'Transfert stock entrée',
      branch_id: toBranchId,
      doc_type: 'Transfert',
      doc_number: docNumber,
      user_id: session?.user?.id || null,
      user_label: currentUserLabel(),
      created_at: new Date().toISOString()
    });
  }

  await auditLog('Stock', 'TRANSFER', docNumber, 'Transfert stock vers droguerie #' + toBranchId + ' quantité ' + qty);
}


function downloadCsv(filename, rows) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) {
    alert('Aucune donnée à exporter');
    return;
  }
  const headers = Object.keys(list[0]);
  const csv = [
    headers.join(';'),
    ...list.map(row => headers.map(h => `"${String(row[h] ?? '').replaceAll('"', '""')}"`).join(';'))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function loadProDashboardData() {
  const session = getStoredSession();
  const [
    { data: products },
    { data: sales },
    { data: purchases },
    { data: clients },
    { data: suppliers },
    movements
  ] = await Promise.all([
    applyProductScope(supabase.from('products').select('*, branches(name)'), session),
    applyDocScope(supabase.from('sales').select('*'), 'sales', session),
    applyDocScope(supabase.from('purchases').select('*'), 'purchases', session),
    supabase.from('clients').select('*'),
    supabase.from('suppliers').select('*'),
    loadStockMovements().catch(() => [])
  ]);

  const prod = (products || []).map(mapProduct);
  const docsSales = (sales || []).map(mapDoc);
  const docsPurchases = (purchases || []).map(mapDoc);
  const todayKey = today();

  const todaySales = docsSales.filter(d => d.date === todayKey).reduce((s, d) => s + Number(d.totalTTC || 0), 0);
  const unpaidInvoices = [...docsSales, ...docsPurchases].filter(d => d.stage === 'facture' && d.statutPaiement !== 'paid').length;
  const stockAlerts = prod.filter(p => Number(p.quantite || 0) <= Number(p.stockMin || 0)).length;
  const stockValue = prod.reduce((s, p) => s + Number(p.quantite || 0) * Number(p.prixAchat || 0), 0);

  return {
    products: prod,
    sales: docsSales,
    purchases: docsPurchases,
    clients: clients || [],
    suppliers: suppliers || [],
    movements: movements || [],
    kpis: {
      todaySales,
      unpaidInvoices,
      stockAlerts,
      stockValue,
      purchasesTotal: docsPurchases.reduce((s, d) => s + Number(d.totalTTC || 0), 0),
      salesTotal: docsSales.reduce((s, d) => s + Number(d.totalTTC || 0), 0),
      cashInTotal: paymentSum(docsSales),
      cashOutTotal: paymentSum(docsPurchases),
      stockQty: prod.reduce((s, p) => s + Number(p.quantite || 0), 0),
      openDocs: [...docsSales, ...docsPurchases].filter(d => d.stage !== 'facture' && docStatus(d) !== 'closed').length,
      paidRate: paidRate([...docsSales, ...docsPurchases]),
      lowMargin: prod.filter(p => productProfitStatus(p) !== 'healthy').length,
      clientsCount: (clients || []).length,
      suppliersCount: (suppliers || []).length
    }
  };
}


function jsonValue(v, fallback) {
  if (!v) return fallback;
  if (typeof v === 'string') {
    try { return JSON.parse(v); } catch { return fallback; }
  }
  return v;
}

function paymentInfo(doc) {
  const payments = jsonValue(doc.payments_json || doc.paiements, []);
  const activePayments = payments.filter(p => !p.canceled);
  const paid = activePayments.reduce((s, p) => s + Number(p.montant || 0), 0);
  const total = Number(doc.total_ttc || doc.totalTTC || 0);
  const rest = Math.max(0, total - paid);
  const status = paid <= 0.001 ? 'unpaid' : rest <= 0.01 ? 'paid' : 'partial';
  return { paid, rest, status };
}

function mapProduct(p) {
  return {
    id: p.id,
    ref: p.ref || '',
    nom: p.name || '',
    nomAr: p.name_ar || '',
    categorie: p.category || '',
    unite: p.unit || '',
    prixAchat: Number(p.purchase_price || 0),
    prixVente: Number(p.sale_price || 0),
    quantite: Number(p.quantity || 0),
    stockMin: Number(p.min_stock || 0),
    fournisseurId: p.supplier_id,
    branchId: p.branch_id || null,
    branchName: p.branches?.name || ''
  };
}

function mapDoc(d) {
  const pay = paymentInfo(d);
  return {
    ...d,
    numeros: jsonValue(d.numbers_json, {}),
    lignes: jsonValue(d.lines_json, []),
    paiements: jsonValue(d.payments_json, []),
    totalTTC: Number(d.total_ttc || 0),
    totalHT: Number(d.total_ht || 0),
    tva: Number(d.vat || 0),
    reste: pay.rest,
    statutPaiement: pay.status,
    baseDocId: d.base_doc_id || null,
    qtyDone: Number(d.qty_done || 0),
    qtyStatus: docStatus(d),
    qtyRemaining: docRemainingQty(d)
  };
}

function computeTotals(lines, vatRate, salesMode) {
  const base = lines.reduce((s, l) => s + Number(l.prixUnit || 0) * Number(l.qte || 0), 0);
  if (salesMode) {
    const totalTTC = base;
    const totalHT = totalTTC / (1 + vatRate / 100);
    return { totalHT, vat: totalTTC - totalHT, totalTTC };
  }
  const totalHT = base;
  return { totalHT, vat: totalHT * vatRate / 100, totalTTC: totalHT * (1 + vatRate / 100) };
}

async function nextNumber(prefix) {
  const { data } = await supabase.from('counters').select('value').eq('name', prefix).maybeSingle();
  const value = Number(data?.value || 1);
  const { error } = await supabase.from('counters').upsert({ name: prefix, value: value + 1 }, { onConflict: 'name' });
  if (error) throw new Error(error.message);
  return prefix + '-' + new Date().getFullYear() + '-' + String(value).padStart(4, '0');
}


async function updateStock(lines, sign, reason, meta = {}) {
  const session = getStoredSession();
  const stockLines = (lines || []).map(l => ({
    ...l,
    produitId: Number(l.produitId || l.product_id || l.id),
    qte: Number(l.qte ?? l.quantity ?? 0)
  })).filter(l => l.produitId && Number(l.qte || 0) !== 0);

  for (const line of stockLines) {
    const productId = Number(line.produitId || line.product_id || line.id);
    const rawQty = Number(line.qte || line.quantity || 0);
    const movementQty = rawQty * sign;
    const qty = Math.abs(movementQty);
    if (!productId || !qty) continue;

    const { data: product, error: readError } = await supabase
      .from('products')
      .select('quantity, branch_id')
      .eq('id', productId)
      .single();

    if (readError) throw new Error(readError.message);

    if (!isAdmin(session) && Number(product.branch_id || 0) !== Number(branchId(session) || 0)) {
      throw new Error('Mouvement stock refusé : produit hors droguerie utilisateur');
    }

    const newQty = Number(product.quantity || 0) + movementQty;
    if (newQty < 0) {
      throw new Error('Stock insuffisant pour le produit');
    }

    const { error: updateError } = await supabase.from('products').update({ quantity: newQty }).eq('id', productId);
    if (updateError) throw new Error(updateError.message);

    const movement = {
      product_id: productId,
      quantity: movementQty,
      reason,
      branch_id: product.branch_id || branchId(session) || null,
      created_at: new Date().toISOString()
    };

    if (meta.docType) movement.doc_type = meta.docType;
    if (meta.docNumber) movement.doc_number = meta.docNumber;
    if (session?.user?.id) movement.user_id = session.user.id;
    if (session?.user) movement.user_label = currentUserLabel();

    await supabase.from('stock_movements').insert(movement);
  }
  await auditLog('Stock', 'STOCK', meta.docNumber || reason, reason);
}

async function login(username, password) {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, full_name, password_hash, active, branch_id, branches(name), roles(name)')
    .eq('username', username)
    .eq('active', true)
    .single();

  if (error || !data) throw new Error('Identifiant incorrect');
  if (password !== data.password_hash) throw new Error('Mot de passe incorrect');

  const userPerms = await getUserPermissions(data.id);

  return {
    user: {
      id: data.id,
      username: data.username,
      full_name: data.full_name,
      role: data.roles?.name || 'Sans profil',
      branch_id: data.branch_id || null,
      branch_name: data.branches?.name || ''
    },
    perms: userPerms
  };
}

function App() {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'fr');
  const [session, setSession] = useState(getStoredSession());
  const L = key => TXT[lang]?.[key] || key;

  function toggleLang() {
    const next = lang === 'fr' ? 'ar' : 'fr';
    localStorage.setItem('lang', next);
    setLang(next);
  }

  if (!supabaseUrl || !supabaseKey) {
    return <ConfigMissing />;
  }

  if (!session) {
    return <LoginPage L={L} lang={lang} onLogin={s => { setStoredSession(s); setSession(s); }} />;
  }

  return <><InstallPrompt /><Layout L={L} lang={lang} toggleLang={toggleLang} session={session} setSession={setSession} /></>;
}


async function refreshCurrentSession(setSession) {
  const current = getStoredSession();
  if (!current?.user?.id) return;
  const perms = await getUserPermissions(current.user.id);
  const updated = { ...current, perms };
  setStoredSession(updated);
  setSession(updated);
}


function isAdmin(session) {
  return session?.user?.role === 'Administrateur';
}

function isManager(session) {
  return session?.user?.role === 'Gérant';
}

function isSeller(session) {
  return session?.user?.role === 'Vendeur';
}

function isStoreKeeper(session) {
  return session?.user?.role === 'Magasinier';
}

function branchId(session) {
  return session?.user?.branch_id || null;
}

function applyDocScope(query, type, session) {
  if (isAdmin(session)) return query;

  if (isManager(session)) {
    return branchId(session) ? query.eq('branch_id', branchId(session)) : query.eq('branch_id', -1);
  }

  if (type === 'sales' && isSeller(session)) {
    return query.eq('created_by', session.user.id);
  }

  if (type === 'purchases' && isStoreKeeper(session)) {
    return query.eq('created_by', session.user.id);
  }

  return query.eq('created_by', session.user.id);
}

function applyProductScope(query, session) {
  if (isAdmin(session)) return query;
  if (branchId(session)) return query.eq('branch_id', branchId(session));
  return query.eq('branch_id', -1);
}

async function loadBranches() {
  const { data, error } = await supabase.from('branches').select('*').order('name');
  if (error) throw new Error(error.message);
  return data || [];
}



async function saveBranch(branch) {
  const payload = {
    name: branch.name || '',
    city: branch.city || '',
    address: branch.address || '',
    phone: branch.phone || '',
    manager_name: branch.manager_name || '',
    active: branch.active !== false
  };

  const q = branch.id
    ? supabase.from('branches').update(payload).eq('id', branch.id)
    : supabase.from('branches').insert(payload);

  const { error } = await q;
  if (error) throw new Error(error.message);
}

async function deleteBranch(id) {
  const { error } = await supabase.from('branches').update({ active: false }).eq('id', id);
  if (error) throw new Error(error.message);
}

async function loadUsersForBranch() {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, full_name, branch_id, roles(name)')
    .order('full_name');

  if (error) throw new Error(error.message);
  return data || [];
}

async function assignUserBranch(userId, branchId) {
  const { error } = await supabase
    .from('users')
    .update({ branch_id: branchId || null })
    .eq('id', userId);

  if (error) throw new Error(error.message);
}




async function loadUserLabels() {
  const { data, error } = await supabase.from('users').select('id, username, full_name');
  if (error) return {};
  const map = {};
  (data || []).forEach(u => {
    map[u.id] = u.full_name || u.username || ('User #' + u.id);
  });
  return map;
}

function enrichDocs(docs, userLabels = {}) {
  const mapped = (docs || []).map(mapDoc);
  const byId = {};
  mapped.forEach(d => { byId[d.id] = d; });

  return mapped.map(d => {
    const base = d.baseDocId ? byId[d.baseDocId] : null;
    return {
      ...d,
      createdByLabel: userLabels[d.created_by] || d.created_by_label || d.user_label || (d.created_by ? ('User #' + d.created_by) : '-'),
      baseDocNumber: base ? docNo(base) : (d.base_doc_number || '')
    };
  });
}

function currentUserLabel() {
  const s = getStoredSession();
  return s?.user?.full_name || s?.user?.username || 'system';
}

async function auditLog(moduleName, action, objectLabel, detail) {
  try {
    const s = getStoredSession();
    await supabase.from('audit_logs').insert({
      module: moduleName,
      action,
      object_label: String(objectLabel || ''),
      detail: String(detail || ''),
      user_id: s?.user?.id || null,
      user_label: currentUserLabel(),
      branch_id: s?.user?.branch_id || null,
      created_at: new Date().toISOString()
    });
  } catch (e) {
    console.warn('Audit log error:', e.message);
  }
}

async function loadAuditLogs() {
  const session = getStoredSession();
  let q = supabase
    .from('audit_logs')
    .select('id, module, action, object_label, detail, user_id, user_label, branch_id, created_at, branches(name)')
    .order('created_at', { ascending: false })
    .limit(500);

  if (!isAdmin(session) && branchId(session)) q = q.eq('branch_id', branchId(session));

  const { data, error } = await q;
  if (error) {
    console.warn('Audit load error:', error.message);
    return [];
  }

  return data || [];
}

async function loadStockMovements() {
  const session = getStoredSession();
  let q = supabase
    .from('stock_movements')
    .select('id, product_id, quantity, reason, created_at, user_label, doc_type, doc_number, branch_id, products(ref, name, branch_id), branches(name)')
    .order('created_at', { ascending: false });

  if (!isAdmin(session) && branchId(session)) {
    q = q.eq('branch_id', branchId(session));
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  return (data || []).map(m => ({
    id: m.id,
    ref: m.products?.ref || '',
    productName: m.products?.name || '',
    quantity: Number(m.quantity || 0),
    reason: m.reason || '',
    date: m.created_at,
    userLabel: m.user_label || '',
    docType: m.doc_type || '',
    docNumber: m.doc_number || '',
    branchName: m.branches?.name || ''
  }));
}


function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setShow(false);
    setDeferredPrompt(null);
  }

  if (!show) return null;

  return (
    <div className="install-banner no-print">
      <div>
        <b>Installer DrogueriePro</b>
        <p>Ajoute l’application à l’écran d’accueil de ton téléphone.</p>
      </div>
      <button className="btn bg-amber-500" onClick={install}>Installer</button>
      <button className="btn bg-white border" onClick={() => setShow(false)}>Plus tard</button>
    </div>
  );
}


function ConfigMissing() {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-100 p-6">
      <div className="card p-6 max-w-xl">
        <h1 className="text-xl font-bold text-red-600 mb-3">Configuration Supabase manquante</h1>
        <p>Ajoute VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans Vercel, puis redéploie.</p>
      </div>
    </div>
  );
}


async function getVatRate() {
  try {
    const { data } = await supabase.from('app_settings').select('value').eq('key', 'vat_rate').maybeSingle();
    return Number(data?.value || 20);
  } catch { return 20; }
}

async function loadSettings() {
  const defaults = { vat_rate: '20', theme: 'light', company_name: 'DrogueriePro', company_ice: '', company_phone: '', company_address: '', company_rc: '', company_if: '', company_patente: '', company_cnss: '' };
  const { data, error } = await supabase.from('app_settings').select('*');
  if (error) return defaults;
  const out = { ...defaults };
  (data || []).forEach(x => { out[x.key] = x.value; });
  return out;
}

async function saveSettings(settings) {
  const rows = Object.entries(settings).map(([key, value]) => ({ key, value: String(value ?? '') }));
  const { error } = await supabase.from('app_settings').upsert(rows, { onConflict: 'key' });
  if (error) throw new Error(error.message);
}

async function loadPermissionsMatrix() {
  const [{ data: roles, error: rErr }, { data: permissions, error: pErr }, { data: rolePerms, error: rpErr }] = await Promise.all([
    supabase.from('roles').select('*').order('id'),
    supabase.from('permissions').select('*').order('module').order('code'),
    supabase.from('role_permissions').select('*')
  ]);
  if (rErr) throw new Error(rErr.message);
  if (pErr) throw new Error(pErr.message);
  if (rpErr) throw new Error(rpErr.message);
  return { roles: roles || [], permissions: permissions || [], rolePerms: rolePerms || [] };
}

async function setRolePermission(roleId, permissionId, enabled) {
  if (enabled) {
    const { error } = await supabase.from('role_permissions').upsert({ role_id: roleId, permission_id: permissionId }, { onConflict: 'role_id,permission_id' });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from('role_permissions').delete().eq('role_id', roleId).eq('permission_id', permissionId);
    if (error) throw new Error(error.message);
  }
}




function amountToWordsFr(n) {
  return dh(n);
}

async function loadCompanySettings() {
  const s = await loadSettings();
  return {
    name: s.company_name || 'DrogueriePro',
    ice: s.company_ice || '',
    phone: s.company_phone || '',
    address: s.company_address || '',
    rc: s.company_rc || '',
    ifNumber: s.company_if || '',
    patente: s.company_patente || '',
    cnss: s.company_cnss || ''
  };
}



function activePaymentsFromDocs(docs) {
  return (docs || []).flatMap(d => (d.paiements || jsonValue(d.payments_json, []) || [])
    .filter(p => !p.canceled)
    .map(p => ({ ...p, doc: d })));
}

function paymentSum(docs) {
  return activePaymentsFromDocs(docs).reduce((s, p) => s + Number(p.montant || 0), 0);
}

function paidRate(docs) {
  const inv = (docs || []).filter(d => d.stage === 'facture');
  if (!inv.length) return 0;
  return inv.filter(d => d.statutPaiement === 'paid').length / inv.length * 100;
}

function preciseDocTitle(doc, type, L) {
  const stage = doc?.stage || '';
  const isSalesDoc = type === 'sales' || doc?.client_id || doc?.client_name;
  if (isSalesDoc) {
    return {
      devis: L('customerQuote'),
      commande: L('customerOrder'),
      livraison: L('customerDelivery'),
      facture: L('customerInvoice')
    }[stage] || L('sales');
  }
  return {
    commande: L('supplierOrder'),
    reception: L('supplierReceipt'),
    facture: L('supplierInvoice')
  }[stage] || L('purchases');
}

function lineProfit(line) {
  const sale = Number(line.prixUnit || 0);
  const purchase = Number(line.prixAchat || line.purchasePrice || 0);
  const qty = Number(line.qte || 0);
  const margin = (sale - purchase) * qty;
  const rate = sale ? ((sale - purchase) / sale) * 100 : 0;
  return { margin, rate };
}

function documentProfit(doc) {
  const lines = doc?.lignes || jsonValue(doc?.lines_json, []);
  return (lines || []).reduce((acc, l) => {
    const p = lineProfit(l);
    acc.margin += p.margin;
    acc.sales += Number(l.prixUnit || 0) * Number(l.qte || 0);
    return acc;
  }, { margin: 0, sales: 0 });
}

function suggestSalePrice(purchasePrice, targetMargin = 25) {
  const cost = Number(purchasePrice || 0);
  const m = Math.min(80, Math.max(1, Number(targetMargin || 25)));
  return cost / (1 - m / 100);
}

function reorderSuggestion(product) {
  const min = Number(product.stockMin || product.min_stock || 0);
  const qty = Number(product.quantite || product.quantity || 0);
  if (qty > min) return 0;
  return Math.max(1, (min * 2) - qty);
}

function productProfitStatus(product) {
  const purchase = Number(product.prixAchat || 0);
  const sale = Number(product.prixVente || 0);
  const rate = sale ? ((sale - purchase) / sale) * 100 : 0;
  if (rate < 10) return 'critical';
  if (rate < 20) return 'warning';
  return 'healthy';
}

function docNo(doc, key) {
  const nums = jsonValue(doc.numbers_json || doc.numeros, {});
  if (key && nums[key]) return nums[key];

  const stageKey = {
    devis: 'devis',
    commande: 'commande',
    livraison: 'livraison',
    reception: 'reception',
    facture: 'facture'
  }[doc.stage];

  if (stageKey && nums[stageKey]) return nums[stageKey];

  const preferred = ['facture', 'livraison', 'reception', 'commande', 'devis'];
  for (const k of preferred) {
    if (nums[k]) return nums[k];
  }

  return Object.values(nums)[0] || ('#' + doc.id);
}

function docQty(lines) {
  return (lines || []).reduce((s, l) => s + Number(l.qte || 0), 0);
}

function docRemainingQty(doc) {
  if (doc && doc.processed_lines_json) {
    return docRemainingQtyByLines(doc);
  }
  const lines = jsonValue(doc.lines_json || doc.lignes, []);
  const total = docQty(lines);
  const done = Number(doc.qty_done || 0);
  return Math.max(0, total - done);
}

function docStatus(doc) {
  const rem = docRemainingQty(doc);
  if (doc.stage === 'facture') return 'closed';
  if (rem <= 0 && ['livraison', 'reception'].includes(doc.stage)) return 'closed';
  if (Number(doc.qty_done || 0) > 0) return 'partial';
  return 'open';
}

function makePartialLines(doc, qte) {
  const original = jsonValue(doc.lines_json || doc.lignes, []);
  const remaining = docRemainingQty(doc);
  const requested = Math.min(Number(qte || 0), remaining || Number(qte || 0));
  if (!requested || requested <= 0) throw new Error('Quantité partielle invalide');

  const total = docQty(original);
  if (!total) throw new Error('Document sans quantité');

  return original.map(l => {
    const lineQty = Number(l.qte || 0);
    const ratio = lineQty / total;
    return { ...l, qte: Number((requested * ratio).toFixed(4)) };
  }).filter(l => Number(l.qte) > 0);
}

function nextStageAllowed(doc, type) {
  if (type === 'sales') {
    if (doc.stage === 'devis') return 'commande';
    if (doc.stage === 'commande') return 'livraison';
    if (doc.stage === 'livraison') return 'facture';
    return null;
  }

  if (doc.stage === 'commande') return 'reception';
  if (doc.stage === 'reception') return 'facture';
  return null;
}

function canPayDocument(doc) {
  return doc.stage === 'facture';
}

function paymentButtonVisible(doc) {
  return doc.stage === 'facture' && Number(doc.reste || 0) > 0;
}


function docPrefix(type, stage) {
  if (type === 'sales') {
    return { devis: 'DEV', commande: 'CMDV', livraison: 'BLV', facture: 'FACV' }[stage] || 'DOCV';
  }
  return { commande: 'CMDA', reception: 'BRA', facture: 'FACA' }[stage] || 'DOCA';
}

function docKey(type, stage) {
  if (type === 'sales') {
    return { devis: 'devis', commande: 'commande', livraison: 'livraison', facture: 'facture' }[stage] || stage;
  }
  return { commande: 'commande', reception: 'reception', facture: 'facture' }[stage] || stage;
}

function normalizeLines(lines) {
  return (lines || []).map(l => ({
    ...l,
    produitId: Number(l.produitId || l.product_id || l.id),
    qte: Number(l.qte || l.quantity || 0),
    prixUnit: Number(l.prixUnit || l.unit_price || 0)
  })).filter(l => l.produitId && l.qte > 0);
}


function lineKey(line) {
  return String(line.produitId || line.product_id || line.id || line.ref || line.nom || '');
}

function processedLines(doc) {
  return jsonValue(doc.processed_lines_json, {});
}

function lineProcessedQty(doc, line) {
  const processed = processedLines(doc);
  return Number(processed[lineKey(line)] || 0);
}

function lineRemainingQty(doc, line) {
  return Math.max(0, Number(line.qte || 0) - lineProcessedQty(doc, line));
}

function docRemainingLines(doc) {
  const original = normalizeLines(jsonValue(doc.lines_json || doc.lignes, []));
  return original.map(l => ({
    ...l,
    processedQty: lineProcessedQty(doc, l),
    remainingQty: lineRemainingQty(doc, l)
  }));
}

function docRemainingQtyByLines(doc) {
  return docRemainingLines(doc).reduce((s, l) => s + Number(l.remainingQty || 0), 0);
}

function selectedPartialLines(doc, linesInput) {
  const original = docRemainingLines(doc);
  const input = Array.isArray(linesInput) ? linesInput : [];
  const byKey = {};

  input.forEach(l => {
    const key = lineKey(l);
    if (!key) return;
    byKey[key] = {
      excluded: !!l.excluded,
      qty: Number(l.qteToProcess ?? l.qte ?? 0)
    };
  });

  const result = [];
  for (const line of original) {
    const key = lineKey(line);
    const inputLine = byKey[key];

    // Si la ligne n'existe pas dans le modal, on ne la traite pas.
    if (!inputLine) continue;

    // Ligne retirée volontairement : aucun mouvement.
    if (inputLine.excluded) continue;

    const qty = Number(inputLine.qty || 0);
    if (qty <= 0) continue;

    if (qty > Number(line.remainingQty || 0) + 0.0001) {
      throw new Error('Quantité supérieure au reste pour le produit : ' + (line.nom || line.ref || line.produitId));
    }

    result.push({
      ...line,
      qte: qty,
      processedQty: undefined,
      remainingQty: undefined,
      excluded: undefined,
      qteToProcess: undefined
    });
  }

  if (!result.length) {
    throw new Error('Veuillez saisir au moins une quantité à traiter sur une ligne non retirée');
  }

  return result;
}

function mergeProcessedLines(doc, linesProcessed) {
  const processed = { ...processedLines(doc) };
  normalizeLines(linesProcessed).forEach(l => {
    const k = lineKey(l);
    processed[k] = Number(processed[k] || 0) + Number(l.qte || 0);
  });
  return processed;
}

function processedTotal(processed) {
  return Object.values(processed || {}).reduce((s, v) => s + Number(v || 0), 0);
}


function scaleLinesToQty(lines, qtyToProcess) {
  const total = docQty(lines);
  const qty = Math.min(Number(qtyToProcess || 0), total);
  if (!qty || qty <= 0) throw new Error('Quantité invalide');
  return normalizeLines(lines).map(l => ({
    ...l,
    qte: Number((Number(l.qte || 0) * qty / total).toFixed(4))
  })).filter(l => l.qte > 0);
}

function paymentLabel(doc, L) {
  if (doc.statutPaiement === 'paid') return L('paid');
  if (doc.statutPaiement === 'partial') return L('partial');
  return L('unpaid');
}

function docTypeLabel(doc, type, L) {
  return preciseDocTitle(doc, type, L);
}

function docActionLabel(action) {
  const map = {
    CREATE: 'Création',
    UPDATE: 'Modification',
    DELETE: 'Suppression',
    ADVANCE: 'Avancement document',
    PAYMENT: 'Règlement',
    CANCEL_PAYMENT: 'Annulation règlement',
    STOCK: 'Mouvement stock',
    PARTIAL_DELIVERY: 'Livraison partielle',
    PARTIAL_RECEIPT: 'Réception partielle'
  };
  return map[action] || action || '-';
}





async function partyName(type, id, fallback = '') {
  if (!id) return fallback;
  const table = type === 'sales' ? 'clients' : 'suppliers';
  const { data } = await supabase.from(table).select('name').eq('id', id).maybeSingle();
  return data?.name || fallback;
}

async function createDoc(type, body) {
  requirePerm(type === 'sales' ? 'sales.write' : 'purchases.write', type === 'sales' ? 'Création vente' : 'Création achat');
  const isSales = type === 'sales';
  const start = body.start || (isSales ? 'devis' : 'commande');
  const lines = normalizeLines(body.lignes || []);
  if (!lines.length) throw new Error('Le document doit contenir au moins une ligne');

  const vat = Number(body.tauxTva || await getVatRate());
  const t = computeTotals(lines, vat, isSales);
  const prefix = docPrefix(type, start);
  const key = docKey(type, start);
  const docNumber = await nextNumber(prefix);
  const numbers = { [key]: docNumber };
  const session = getStoredSession();
  const qty = docQty(lines);

  const movesStock = isSales
    ? ['livraison', 'facture'].includes(start)
    : ['reception', 'facture'].includes(start);

  if (movesStock) {
    await updateStock(
      lines,
      isSales ? -1 : 1,
      (isSales ? 'Sortie stock ' : 'Entrée stock ') + docNumber,
      { docType: start, docNumber }
    );
  }

  const payload = isSales ? {
    date: body.date || today(),
    client_id: body.clientId || null,
    client_name: body.clientNom || await partyName(type, body.clientId),
    stage: start,
    numbers_json: numbers,
    lines_json: lines,
    payments_json: [],
    vat_rate: vat,
    total_ht: t.totalHT,
    vat: t.vat,
    total_ttc: t.totalTTC,
    delivered: ['livraison', 'facture'].includes(start),
    qty_done: movesStock ? qty : 0,
    processed_lines_json: movesStock ? mergeProcessedLines({ processed_lines_json: {} }, lines) : {},
    doc_status: start === 'facture' ? 'closed' : (movesStock ? 'closed' : 'open'),
    created_by: session?.user?.id || null,
    base_doc_id: body.baseDocId || null,
    branch_id: isAdmin(session) ? (body.branchId || branchId(session)) : branchId(session)
  } : {
    date: body.date || today(),
    supplier_id: body.fournisseurId || null,
    supplier_name: body.fournisseurNom || await partyName(type, body.fournisseurId),
    stage: start,
    numbers_json: numbers,
    lines_json: lines,
    payments_json: [],
    vat_rate: vat,
    total_ht: t.totalHT,
    vat: t.vat,
    total_ttc: t.totalTTC,
    received: ['reception', 'facture'].includes(start),
    qty_done: movesStock ? qty : 0,
    processed_lines_json: movesStock ? mergeProcessedLines({ processed_lines_json: {} }, lines) : {},
    doc_status: start === 'facture' ? 'closed' : (movesStock ? 'closed' : 'open'),
    created_by: session?.user?.id || null,
    base_doc_id: body.baseDocId || null,
    branch_id: isAdmin(session) ? (body.branchId || branchId(session)) : branchId(session)
  };

  const { error } = await supabase.from(type).insert(payload);
  if (error) throw new Error(error.message);
  await auditLog(isSales ? 'Ventes' : 'Achats', 'CREATE', docNumber, 'Création ' + start);
}


async function updateDoc(type, id, body) {
  requirePerm(type === 'sales' ? 'sales.write' : 'purchases.write', type === 'sales' ? 'Modification vente' : 'Modification achat');
  const isSales = type === 'sales';
  const { data: existing, error: readError } = await supabase.from(type).select('*').eq('id', id).single();
  if (readError) throw new Error(readError.message);

  if (existing.stage === 'facture' && jsonValue(existing.payments_json, []).length) {
    throw new Error('Impossible de modifier une facture déjà réglée');
  }

  const lines = normalizeLines(body.lignes || []);
  if (!lines.length) throw new Error('Le document doit contenir au moins une ligne');

  const vat = Number(body.tauxTva || await getVatRate());
  const t = computeTotals(lines, vat, isSales);
  const payload = {
    date: body.date || today(),
    lines_json: lines,
    vat_rate: vat,
    total_ht: t.totalHT,
    vat: t.vat,
    total_ttc: t.totalTTC
  };

  if (isSales) {
    payload.client_id = body.clientId || null;
    payload.client_name = body.clientNom || await partyName(type, payload.client_id);
  } else {
    payload.supplier_id = body.fournisseurId || null;
    payload.supplier_name = body.fournisseurNom || await partyName(type, payload.supplier_id);
  }

  const { error } = await supabase.from(type).update(payload).eq('id', id);
  if (error) throw new Error(error.message);
  await auditLog(isSales ? 'Ventes' : 'Achats', 'UPDATE', docNo(existing), 'Modification document');
}


async function deleteDoc(type, id) {
  requirePerm(type === 'sales' ? 'sales.delete' : 'purchases.delete', type === 'sales' ? 'Suppression vente' : 'Suppression achat');
  const { data: doc, error: e1 } = await supabase.from(type).select('*').eq('id', id).single();
  if (e1) throw new Error(e1.message);

  const payments = jsonValue(doc.payments_json, []);
  const activePayments = payments.filter(p => !p.canceled);
  if (activePayments.length) throw new Error('Impossible de supprimer un document avec règlement non annulé');

  const lines = jsonValue(doc.lines_json, []);
  const number = docNo(doc);

  if (type === 'sales' && doc.delivered) {
    await updateStock(lines, 1, 'Annulation sortie stock ' + number, { docType: doc.stage, docNumber: number });
  }
  if (type === 'purchases' && doc.received) {
    await updateStock(lines, -1, 'Annulation entrée stock ' + number, { docType: doc.stage, docNumber: number });
  }

  const { error } = await supabase.from(type).delete().eq('id', id);
  if (error) throw new Error(error.message);
  await auditLog(type === 'sales' ? 'Ventes' : 'Achats', 'DELETE', number, 'Suppression document');
}


async function advanceDoc(type, id) {
  const isSales = type === 'sales';
  const { data: doc, error } = await supabase.from(type).select('*').eq('id', id).single();
  if (error) throw new Error(error.message);

  const next = nextStageAllowed(doc, type);
  if (!next) return;

  const remainingLines = docRemainingLines(doc).filter(l => Number(l.remainingQty || 0) > 0);
  if ((next === 'livraison' || next === 'reception') && !remainingLines.length) {
    throw new Error('Aucune quantité restante à traiter');
  }

  const key = docKey(type, next);
  const prefix = docPrefix(type, next);
  const nums = { ...jsonValue(doc.numbers_json, {}) };
  nums[key] = nums[key] || await nextNumber(prefix);

  const totalQty = docQty(normalizeLines(jsonValue(doc.lines_json, [])));
  let newDone = Number(doc.qty_done || 0);
  let status = 'open';
  let processed = processedLines(doc);

  if (isSales && next === 'livraison') {
    const linesToMove = remainingLines.map(l => ({ ...l, qte: Number(l.remainingQty || 0) }));
    await updateStock(linesToMove, -1, 'Livraison vente ' + nums[key], { docType: next, docNumber: nums[key] });
    processed = mergeProcessedLines(doc, linesToMove);
    newDone = processedTotal(processed);
    status = newDone >= totalQty ? 'closed' : 'partial';
  } else if (!isSales && next === 'reception') {
    const linesToMove = remainingLines.map(l => ({ ...l, qte: Number(l.remainingQty || 0) }));
    await updateStock(linesToMove, 1, 'Réception achat ' + nums[key], { docType: next, docNumber: nums[key] });
    processed = mergeProcessedLines(doc, linesToMove);
    newDone = processedTotal(processed);
    status = newDone >= totalQty ? 'closed' : 'partial';
  } else if (next === 'facture') {
    newDone = totalQty;
    status = 'closed';
  }

  const payload = isSales ? {
    stage: next,
    numbers_json: nums,
    delivered: next === 'livraison' ? true : doc.delivered,
    qty_done: newDone,
    processed_lines_json: processed,
    doc_status: status
  } : {
    stage: next,
    numbers_json: nums,
    received: next === 'reception' ? true : doc.received,
    qty_done: newDone,
    processed_lines_json: processed,
    doc_status: status
  };

  const { error: e2 } = await supabase.from(type).update(payload).eq('id', id);
  if (e2) throw new Error(e2.message);
  await auditLog(isSales ? 'Ventes' : 'Achats', 'ADVANCE', nums[key], 'Passage à ' + next);
}

async function payDoc(type, id, body) {
  requirePerm(type === 'sales' ? 'sales.pay' : 'purchases.pay', type === 'sales' ? 'Encaissement' : 'Décaissement');
  const { data: doc, error } = await supabase.from(type).select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  if (doc.stage !== 'facture') throw new Error('Le règlement est autorisé uniquement sur les factures');
  const payments = jsonValue(doc.payments_json, []);
  const info = paymentInfo(doc);
  const montant = Number(body.montant || info.rest || 0);
  if (montant <= 0) throw new Error('Montant de règlement invalide');
  payments.push({
    id: String(Date.now()), canceled: false, canceledAt: '', canceledBy: '', cancelReason: '', date: body.date || today(), mode: body.mode || 'Espèces', montant,
    cashRegister: body.cashRegister || '', receiptNo: body.receiptNo || '', chequeNo: body.chequeNo || '', bank: body.bank || '', dueDate: body.dueDate || '', paymentStatus: body.paymentStatus || '', transferRef: body.transferRef || '', valueDate: body.valueDate || '', terminal: body.terminal || '', transactionNo: body.transactionNo || '', billNo: body.billNo || '', note: body.note || ''
  });
  const { error: e2 } = await supabase.from(type).update({ payments_json: payments }).eq('id', id);
  if (e2) throw new Error(e2.message);
  await auditLog(type === 'sales' ? 'Paiements ventes' : 'Paiements achats', 'PAYMENT', docNo(doc), 'Règlement ' + montant + ' DH');
}


async function cancelPayment(type, docId, paymentId, reason = '') {
  const { data: doc, error } = await supabase.from(type).select('*').eq('id', docId).single();
  if (error) throw new Error(error.message);

  const payments = jsonValue(doc.payments_json, []);
  const idx = payments.findIndex(p => String(p.id) === String(paymentId));
  if (idx < 0) throw new Error('Règlement introuvable');
  if (payments[idx].canceled) throw new Error('Règlement déjà annulé');

  const session = getStoredSession();
  payments[idx] = {
    ...payments[idx],
    canceled: true,
    canceledAt: new Date().toISOString(),
    canceledBy: currentUserLabel(),
    cancelReason: reason || 'Annulation règlement'
  };

  const { error: e2 } = await supabase.from(type).update({ payments_json: payments }).eq('id', docId);
  if (e2) throw new Error(e2.message);

  await auditLog(type === 'sales' ? 'Paiements ventes' : 'Paiements achats', 'CANCEL_PAYMENT', docNo(doc), 'Annulation règlement ' + Number(payments[idx].montant || 0) + ' DH');
}


async function partialDoc(type, id, body) {
  const isSales = type === 'sales';
  const { data: doc, error } = await supabase.from(type).select('*').eq('id', id).single();
  if (error) throw new Error(error.message);

  if (doc.stage === 'facture') throw new Error('Action partielle non autorisée sur une facture');
  if (isSales && !['commande', 'livraison'].includes(doc.stage)) throw new Error('La livraison partielle se fait depuis une commande');
  if (!isSales && !['commande', 'reception'].includes(doc.stage)) throw new Error('La réception partielle se fait depuis une commande achat');

  const lines = selectedPartialLines(doc, body.lignes || []);
  const vatRate = Number(doc.vat_rate || await getVatRate());
  const t = computeTotals(lines, vatRate, isSales);
  const stage = isSales ? 'livraison' : 'reception';
  const key = docKey(type, stage);
  const number = await nextNumber(docPrefix(type, stage));
  const numbers = { [key]: number };

  await updateStock(lines, isSales ? -1 : 1, (isSales ? 'Livraison partielle ' : 'Réception partielle ') + number, { docType: stage, docNumber: number });

  const session = getStoredSession();
  const originalTotal = docQty(normalizeLines(jsonValue(doc.lines_json, [])));
  const processed = mergeProcessedLines(doc, lines);
  const newDone = processedTotal(processed);
  const parentStatus = newDone >= originalTotal ? 'closed' : 'partial';

  const payload = isSales ? {
    date: body.date || today(),
    client_id: doc.client_id,
    client_name: doc.client_name,
    stage,
    numbers_json: numbers,
    lines_json: lines,
    payments_json: [],
    vat_rate: vatRate,
    total_ht: t.totalHT,
    vat: t.vat,
    total_ttc: t.totalTTC,
    delivered: true,
    qty_done: docQty(lines),
    processed_lines_json: mergeProcessedLines({ processed_lines_json: {} }, lines),
    doc_status: 'closed',
    created_by: session?.user?.id || null,
    base_doc_id: doc.id,
    branch_id: doc.branch_id || branchId(session)
  } : {
    date: body.date || today(),
    supplier_id: doc.supplier_id,
    supplier_name: doc.supplier_name,
    stage,
    numbers_json: numbers,
    lines_json: lines,
    payments_json: [],
    vat_rate: vatRate,
    total_ht: t.totalHT,
    vat: t.vat,
    total_ttc: t.totalTTC,
    received: true,
    qty_done: docQty(lines),
    processed_lines_json: mergeProcessedLines({ processed_lines_json: {} }, lines),
    doc_status: 'closed',
    created_by: session?.user?.id || null,
    base_doc_id: doc.id,
    branch_id: doc.branch_id || branchId(session)
  };

  const { error: e2 } = await supabase.from(type).insert(payload);
  if (e2) throw new Error(e2.message);

  const { error: e3 } = await supabase.from(type).update({
    qty_done: newDone,
    processed_lines_json: processed,
    doc_status: parentStatus,
    delivered: isSales ? newDone >= originalTotal : doc.delivered,
    received: !isSales ? newDone >= originalTotal : doc.received
  }).eq('id', id);
  if (e3) throw new Error(e3.message);

  await auditLog(isSales ? 'Ventes' : 'Achats', isSales ? 'PARTIAL_DELIVERY' : 'PARTIAL_RECEIPT', number, 'Traitement partiel par produit : ' + docQty(lines));
}

async function loadPayments() {
  const [{ data: sales, error: e1 }, { data: purchases, error: e2 }] = await Promise.all([
    applyDocScope(supabase.from('sales').select('*'), 'sales', getStoredSession()).order('id', { ascending: false }),
    applyDocScope(supabase.from('purchases').select('*'), 'purchases', getStoredSession()).order('id', { ascending: false })
  ]);
  if (e1) throw new Error(e1.message);
  if (e2) throw new Error(e2.message);
  const enc = (sales || []).flatMap(d => jsonValue(d.payments_json, []).map(p => ({ type: 'encaissement', sourceTable: 'sales', docType: 'vente', docId: d.id, docNumber: docNo(d), tiers: d.client_name, ...p })));
  const dec = (purchases || []).flatMap(d => jsonValue(d.payments_json, []).map(p => ({ type: 'decaissement', sourceTable: 'purchases', docType: 'achat', docId: d.id, docNumber: docNo(d), tiers: d.supplier_name, ...p })));
  return [...enc, ...dec].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

async function loadParties(type) {
  const session = getStoredSession();
  let q = supabase.from(type).select('*').order('name');

  if (!isAdmin(session) && branchId(session)) {
    q = q.eq('branch_id', branchId(session));
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  const labels = await loadUserLabels();
  return enrichParties((data || []).filter(x => canSeePartyRecord(x, type, session)), labels);
}
async function saveParty(type, body) {
  const writePerm = type === 'clients' ? 'clients.write' : 'suppliers.write';
  requirePerm(writePerm, type === 'clients' ? 'Gestion clients' : 'Gestion fournisseurs');

  const session = getStoredSession();
  const common = {
    name: body.name || '',
    ice: body.ice || '',
    phone: body.phone || '',
    city: body.city || '',
    address: body.address || '',
    branch_id: isAdmin(session) ? (body.branch_id || body.branchId || branchId(session)) : branchId(session),
    assigned_to: type === 'clients' ? (body.assigned_to || body.assignedTo || session?.user?.id || null) : null
  };

  if (!body.id) {
    common.created_by = session?.user?.id || null;
    common.created_by_label = currentUserLabel();
  }

  const payload = type === 'clients'
    ? { ...common, type: body.type || 'entreprise' }
    : { ...common, contact: body.contact || '' };

  const q = body.id ? supabase.from(type).update(payload).eq('id', body.id) : supabase.from(type).insert(payload);
  const { error } = await q;
  if (error) throw new Error(error.message);

  await auditLog(type === 'clients' ? 'Clients' : 'Fournisseurs', body.id ? 'UPDATE' : 'CREATE', payload.name, body.id ? 'Modification tiers' : 'Création tiers');
}
async function deleteParty(type, id) {
  const delPerm = type === 'clients' ? 'clients.delete' : 'suppliers.delete';
  requirePerm(delPerm, type === 'clients' ? 'Suppression client' : 'Suppression fournisseur');

  const { data: row } = await supabase.from(type).select('name').eq('id', id).maybeSingle();
  const { error } = await supabase.from(type).delete().eq('id', id);
  if (error) throw new Error(error.message);

  await auditLog(type === 'clients' ? 'Clients' : 'Fournisseurs', 'DELETE', row?.name || id, 'Suppression tiers');
}
async function loadUsers() {
  const { data, error } = await supabase.from('users').select('id, username, full_name, active, branch_id, branches(name), roles(name)').order('id');
  if (error) throw new Error(error.message);
  return (data || []).map(u => ({ id: u.id, username: u.username, full_name: u.full_name, active: u.active, role: u.roles?.name, branch_id: u.branch_id, branch_name: u.branches?.name || '' }));
}
async function loadRoles() {
  const { data, error } = await supabase.from('roles').select('*').order('id');
  if (error) throw new Error(error.message);
  return data || [];
}
async function saveUser(body) {
  const payload = {
    username: body.username || '',
    full_name: body.full_name || '',
    role_id: body.role_id || 3,
    branch_id: body.branch_id || null,
    active: body.active !== false
  };

  if (body.password) {
    payload.password_hash = body.password;
  }

  if (body.id) {
    const { error } = await supabase.from('users').update(payload).eq('id', body.id);
    if (error) throw new Error(error.message);
  } else {
    payload.password_hash = body.password || 'changeme';
    const { error } = await supabase.from('users').insert(payload);
    if (error) throw new Error(error.message);
  }
}

async function setUserActive(userId, active) {
  const { error } = await supabase.from('users').update({ active }).eq('id', userId);
  if (error) throw new Error(error.message);
}

function LoginPage({ L, lang, onLogin }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    setErr('');
    try {
      const s = await login(username, password);
      onLogin(s);
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className={'min-h-screen bg-slate-900 grid place-items-center ' + (lang === 'ar' ? 'rtl' : '')}>
      <form onSubmit={submit} className="bg-white p-7 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <span className="bg-amber-500 rounded-xl w-12 h-12 grid place-items-center font-black">DP</span>
          <div>
            <h1 className="font-bold text-xl">DrogueriePro</h1>
            <p className="text-xs text-slate-400">{L('login')}</p>
          </div>
        </div>

        {err ? <p className="bg-red-50 text-red-600 p-2 rounded mb-3">{err}</p> : null}

        <label className="text-xs text-slate-500">{L('username')}</label>
        <input className="input mb-3" value={username} onChange={e => setUsername(e.target.value)} />

        <label className="text-xs text-slate-500">{L('password')}</label>
        <input className="input mb-4" type="password" value={password} onChange={e => setPassword(e.target.value)} />

        <button className="btn bg-amber-500 w-full">{L('connect')}</button>
      </form>
    </div>
  );
}

function Layout({ L, lang, toggleLang, session, setSession }) {
  const [page, setPage] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menu = [
    ['dashboard', L('dashboard'), 'dashboard.read'],
    ['profit', L('profitCenter'), 'dashboard.read'],
    ['tools', L('tools'), 'dashboard.read'],
    ['products', L('products'), 'products.read'],
    ['sales', L('sales'), 'sales.read'],
    ['purchases', L('purchases'), 'purchases.read'],
    ['payments', L('payments'), 'payments.read'],
    ['stockMoves', L('stockMoves'), 'stock.read'],
    ['settings', L('settings'), 'settings.manage'],
    ['permissions', L('permissions'), 'permissions.manage'],
    ['branches', L('branches'), 'branches.manage'],
    ['mobileApp', L('mobileApp'), 'mobile.manage'],
    ['clients', L('clients'), 'clients.read'],
    ['suppliers', L('suppliers'), 'suppliers.read'],
    ['users', L('users'), 'users.read']
  ].filter(item => hasPerm(session, item[2]));

  return (
    <div className={lang === 'ar' ? 'rtl' : ''}>
      <div className="mobile-topbar">
        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}>☰</button>
        <div className="font-bold">Droguerie<span className="text-amber-500">Pro</span></div>
        <button className="mobile-menu-btn" onClick={toggleLang}>{L('lang')}</button>
      </div>
      {mobileMenuOpen ? <div className="mobile-backdrop" onClick={() => setMobileMenuOpen(false)} /> : null}
      <div className="min-h-screen flex app-shell">
        <aside className={'w-64 bg-slate-900 text-slate-300 flex flex-col app-sidebar ' + (mobileMenuOpen ? 'open' : '')}>
          <div className="p-5 border-b border-slate-800">
            <div className="font-bold text-white text-xl">Droguerie<span className="text-amber-500">Pro</span></div>
            <div className="text-xs text-slate-500">{session.user?.full_name} · {session.user?.role}</div>
          </div>

          <nav className="p-3 flex-1 space-y-1">
            {menu.map(item => (
              <button
                key={item[0]}
                onClick={() => { setPage(item[0]); setMobileMenuOpen(false); }}
                className={'w-full text-left px-3 py-2.5 rounded-lg text-sm ' + (page === item[0] ? 'bg-amber-500 text-slate-900 font-bold' : 'hover:bg-slate-800')}
              >
                {item[1]}
              </button>
            ))}
          </nav>

          <div className="p-3 border-t border-slate-800 space-y-2">
            <button onClick={toggleLang} className="btn bg-slate-800 w-full">{L('lang')}</button>
            <button onClick={() => refreshCurrentSession(setSession)} className="btn bg-slate-800 w-full">Rafraîchir droits</button>
            <button onClick={() => { clearStoredSession(); setSession(null); }} className="btn bg-slate-800 w-full">{L('logout')}</button>
          </div>
        </aside>

        <main className="flex-1 p-6 max-w-[1500px] mx-auto w-full app-main pro-main">
          {page === 'dashboard' ? <Dashboard L={L} /> : null}
          {page === 'profit' ? <ProfitCenter L={L} /> : null}
          {page === 'tools' ? <ToolsCenter L={L} /> : null}
          {page === 'products' ? <Products L={L} /> : null}
          {page === 'sales' ? <Docs L={L} type="sales" /> : null}
          {page === 'purchases' ? <Docs L={L} type="purchases" /> : null}
          {page === 'payments' ? <Payments L={L} /> : null}
          {page === 'stockMoves' ? <StockMovements L={L} /> : null}
          {page === 'settings' ? <Settings L={L} /> : null}
          {page === 'permissions' ? <Permissions L={L} /> : null}
          {page === 'branches' ? <Branches L={L} /> : null}
          {page === 'mobileApp' ? <MobileAppAdmin L={L} /> : null}
          {page === 'clients' ? <Parties L={L} type="clients" /> : null}
          {page === 'suppliers' ? <Parties L={L} type="suppliers" /> : null}
          {page === 'users' ? <Users L={L} /> : null}
        </main>
      </div>
    </div>
  );
}

function Header({ title, children }) {
  return (
    <div className="flex justify-between items-end mb-5">
      <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

function Table({ children }) {
  return <div className="card overflow-hidden"><table className="table w-full">{children}</table></div>;
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 grid place-items-center p-4 overflow-auto">
      <div className={'bg-white rounded-2xl shadow-2xl w-full p-5 ' + (wide ? 'max-w-4xl' : 'max-w-lg')}>
        <div className="flex justify-between mb-4">
          <h2 className="font-bold text-lg">{title}</h2>
          <button onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Badge({ children, tone }) {
  const tones = {
    green: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-sky-100 text-sky-700',
    slate: 'bg-slate-100 text-slate-700'
  };
  return <span className={'px-2 py-1 rounded text-xs font-semibold ' + (tones[tone] || tones.slate)}>{children}</span>;
}

function ErrorBox({ msg }) {
  return <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl"><b>Erreur :</b> {msg}</div>;
}



function ToolsCenter({ L }) {
  const [calc, setCalc] = useState('');
  const [cost, setCost] = useState(100);
  const [margin, setMargin] = useState(25);

  function safeCalc() {
    try {
      if (!/^[0-9+\-*/().,\s]+$/.test(calc)) return 'Erreur';
      // eslint-disable-next-line no-new-func
      const val = Function('"use strict";return (' + calc.replace(',', '.') + ')')();
      return Number.isFinite(val) ? fmt(val) : 'Erreur';
    } catch {
      return 'Erreur';
    }
  }

  const suggested = suggestSalePrice(Number(cost || 0), Number(margin || 0));

  return (
    <>
      <Header title={L('tools')} />
      <div className="grid md:grid-cols-2 gap-5">
        <div className="card p-5">
          <h2 className="font-black text-lg mb-3">{L('calculator')}</h2>
          <input className="input mb-3 text-xl font-mono" value={calc} onChange={e => setCalc(e.target.value)} placeholder="1200 + 250 * 2" />
          <div className="tool-result mb-3">{L('result')} : <b>{calc ? safeCalc() : '-'}</b></div>
          <div className="flex gap-2 flex-wrap">
            {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','+','(',')'].map(x => <button key={x} className="btn bg-white border" onClick={() => setCalc(calc + x)}>{x}</button>)}
            <button className="btn bg-red-600 text-white" onClick={() => setCalc('')}>{L('clear')}</button>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-black text-lg mb-3">{L('marginCalculator')}</h2>
          <label className="text-xs text-slate-500">{L('purchaseCost')}
            <input className="input mt-1 mb-3" type="number" value={cost} onChange={e => setCost(e.target.value)} />
          </label>
          <label className="text-xs text-slate-500">{L('wantedMargin')} %
            <input className="input mt-1 mb-3" type="number" value={margin} onChange={e => setMargin(e.target.value)} />
          </label>
          <div className="tool-price">
            <span>{L('salePriceFromMargin')}</span>
            <b>{dh(suggested)}</b>
          </div>
        </div>
      </div>
    </>
  );
}


function ProfitCenter({ L }) {
  const [rows, setRows] = useState([]);
  const [docs, setDocs] = useState([]);
  const [err, setErr] = useState('');

  async function load() {
    try {
      setErr('');
      const session = getStoredSession();
      const [{ data: prod, error: pErr }, { data: sales, error: sErr }] = await Promise.all([
        applyProductScope(supabase.from('products').select('*, branches(name)'), session).order('name'),
        applyDocScope(supabase.from('sales').select('*'), 'sales', session).order('date', { ascending: false })
      ]);
      if (pErr) throw pErr;
      if (sErr) throw sErr;
      setRows((prod || []).map(mapProduct));
      setDocs((sales || []).map(mapDoc));
    } catch (e) { setErr(e.message); }
  }

  useEffect(() => { load(); }, []);

  if (err) return <ErrorBox msg={err} />;

  const lowMargin = rows.filter(p => productProfitStatus(p) !== 'healthy');
  const reorder = rows.map(p => ({ ...p, reorderQty: reorderSuggestion(p) })).filter(p => p.reorderQty > 0);
  const stockValue = rows.reduce((s, p) => s + Number(p.quantite || 0) * Number(p.prixAchat || 0), 0);
  const marginValue = rows.reduce((s, p) => s + (Number(p.prixVente || 0) - Number(p.prixAchat || 0)) * Number(p.quantite || 0), 0);

  return (
    <>
      <Header title={L('profitCenter')}>
        <button onClick={load} className="btn bg-white border">↻</button>
        <button onClick={() => downloadCsv('rentabilite-produits.csv', rows.map(p => ({
          ref: p.ref,
          produit: p.nom,
          prix_achat: p.prixAchat,
          prix_vente: p.prixVente,
          marge_unitaire: Number(p.prixVente || 0) - Number(p.prixAchat || 0),
          taux_marge: p.prixVente ? ((p.prixVente - p.prixAchat) / p.prixVente) * 100 : 0,
          stock: p.quantite,
          qte_a_commander: reorderSuggestion(p)
        })))} className="btn bg-slate-900 text-white">{L('exportCsv')}</button>
      </Header>

      <div className="pro-kpi-grid mb-5">
        <div className="pro-kpi-card"><span>{L('stockValue')}</span><b>{dh(stockValue)}</b><small>{L('valuation')}</small></div>
        <div className="pro-kpi-card"><span>{L('grossMargin')}</span><b>{dh(marginValue)}</b><small>{L('profitability')}</small></div>
        <div className="pro-kpi-card"><span>{L('profitAlerts')}</span><b>{lowMargin.length}</b><small>{L('marginRate')}</small></div>
        <div className="pro-kpi-card"><span>{L('reorderProposal')}</span><b>{reorder.length}</b><small>{L('lowStock')}</small></div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="card pro-panel p-5 overflow-auto">
          <h2>{L('profitAlerts')}</h2>
          <table className="table w-full">
            <thead><tr><th>{L('ref')}</th><th>{L('product')}</th><th>{L('purchasePrice')}</th><th>{L('salePrice')}</th><th>{L('marginRate')}</th><th>{L('minimumSalePrice')}</th></tr></thead>
            <tbody>
              {lowMargin.map(p => {
                const rate = p.prixVente ? ((p.prixVente - p.prixAchat) / p.prixVente) * 100 : 0;
                return <tr key={p.id}>
                  <td>{p.ref}</td><td>{p.nom}</td><td>{dh(p.prixAchat)}</td><td>{dh(p.prixVente)}</td>
                  <td><Badge tone={rate < 10 ? 'red' : 'amber'}>{fmt(rate)}%</Badge></td>
                  <td className="font-bold">{dh(suggestSalePrice(p.prixAchat, 25))}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>

        <div className="card pro-panel p-5 overflow-auto">
          <h2>{L('reorderProposal')}</h2>
          <table className="table w-full">
            <thead><tr><th>{L('ref')}</th><th>{L('product')}</th><th>{L('stock')}</th><th>{L('minStock')}</th><th>{L('reorderQty')}</th><th>{L('valuation')}</th></tr></thead>
            <tbody>
              {reorder.map(p => <tr key={p.id}>
                <td>{p.ref}</td><td>{p.nom}</td><td>{fmt(p.quantite)}</td><td>{fmt(p.stockMin)}</td>
                <td><Badge tone="blue">{fmt(p.reorderQty)}</Badge></td><td>{dh(p.reorderQty * p.prixAchat)}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}


function Dashboard({ L }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  async function load() {
    try {
      setErr('');
      setData(await loadProDashboardData());
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  if (err) return <ErrorBox msg={err} />;
  if (!data) return <p>Chargement...</p>;

  const k = data.kpis;
  const recent = data.movements.slice(0, 6);
  const lowProducts = data.products.filter(p => Number(p.quantite || 0) <= Number(p.stockMin || 0)).slice(0, 6);
  const topProducts = [...data.products]
    .sort((a, b) => Number(b.quantite || 0) * Number(b.prixVente || 0) - Number(a.quantite || 0) * Number(a.prixVente || 0))
    .slice(0, 5);

  return (
    <>
      <Header title={L('dashboard')}>
        <button onClick={load} className="btn bg-white border">↻</button>
        <button onClick={() => downloadCsv('drogueriepro-produits.csv', data.products.map(p => ({ ref: p.ref, nom: p.nom, stock: p.quantite, prix_achat: p.prixAchat, prix_vente: p.prixVente, droguerie: p.branchName })))} className="btn bg-slate-900 text-white">
          {L('exportCsv')}
        </button>
      </Header>

      <div className="pro-hero mb-6">
        <div>
          <div className="pro-eyebrow">DrogueriePro · {L('proMode')}</div>
          <h1>{L('businessHealth')}</h1>
          <p>{L('performance')} stock, ventes, achats, paiements et alertes opérationnelles.</p>
        </div>
        <div className="pro-hero-score">
          <span>{k.stockAlerts > 0 || k.unpaidInvoices > 0 ? L('warning') : L('healthy')}</span>
          <b>{k.stockAlerts + k.unpaidInvoices}</b>
        </div>
      </div>

      <div className="pro-kpi-grid pro-kpi-grid-v38 mb-6">
        <div className="pro-kpi-card"><span>{L('todaySales')}</span><b>{dh(k.todaySales)}</b><small>{L('sales')}</small></div>
        <div className="pro-kpi-card"><span>{L('kpiRevenue')}</span><b>{dh(k.salesTotal || 0)}</b><small>{L('sales')}</small></div>
        <div className="pro-kpi-card"><span>{L('kpiPurchases')}</span><b>{dh(k.purchasesTotal || 0)}</b><small>{L('purchases')}</small></div>
        <div className="pro-kpi-card"><span>{L('kpiCashIn')}</span><b>{dh(k.cashInTotal || 0)}</b><small>{L('cashIn')}</small></div>
        <div className="pro-kpi-card"><span>{L('kpiCashOut')}</span><b>{dh(k.cashOutTotal || 0)}</b><small>{L('cashOut')}</small></div>
        <div className="pro-kpi-card"><span>{L('stockValue')}</span><b>{dh(k.stockValue)}</b><small>{L('valuation')}</small></div>
        <div className="pro-kpi-card"><span>{L('kpiStockQty')}</span><b>{fmt(k.stockQty || 0)}</b><small>{L('stock')}</small></div>
        <div className="pro-kpi-card"><span>{L('kpiOpenDocs')}</span><b>{k.openDocs || 0}</b><small>{L('document')}</small></div>
        <div className="pro-kpi-card"><span>{L('kpiPaidRate')}</span><b>{fmt(k.paidRate || 0)}%</b><small>{L('payments')}</small></div>
        <div className="pro-kpi-card"><span>{L('kpiLowMargin')}</span><b>{k.lowMargin || 0}</b><small>{L('profitability')}</small></div>
        <div className="pro-kpi-card"><span>{L('unpaidInvoices')}</span><b>{k.unpaidInvoices}</b><small>{L('risk')}</small></div>
        <div className="pro-kpi-card"><span>{L('stockAlerts')}</span><b>{k.stockAlerts}</b><small>{L('critical')}</small></div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="card pro-panel p-5">
          <h2>{L('alerts')}</h2>
          {lowProducts.length ? lowProducts.map(p => (
            <div key={p.id} className="pro-alert-row">
              <div><b>{p.nom}</b><p>{p.ref} · {p.branchName || '-'}</p></div>
              <Badge tone="red">{fmt(p.quantite)} / {fmt(p.stockMin)}</Badge>
            </div>
          )) : <p className="text-sm text-slate-500">{L('noData')}</p>}
        </div>

        <div className="card pro-panel p-5">
          <h2>{L('recentActivity')}</h2>
          {recent.length ? recent.map(m => (
            <div key={m.id} className="pro-activity-row">
              <span className={Number(m.quantity) >= 0 ? 'pro-dot-in' : 'pro-dot-out'} />
              <div><b>{m.productName || '-'}</b><p>{m.reason || '-'} · {fmt(m.quantity)}</p></div>
            </div>
          )) : <p className="text-sm text-slate-500">{L('noData')}</p>}
        </div>

        <div className="card pro-panel p-5">
          <h2>{L('topProducts')}</h2>
          {topProducts.length ? topProducts.map(p => (
            <div key={p.id} className="pro-top-row">
              <div><b>{p.nom}</b><p>{p.ref} · {fmt(p.quantite)} {p.unite}</p></div>
              <strong>{dh(Number(p.quantite || 0) * Number(p.prixVente || 0))}</strong>
            </div>
          )) : <p className="text-sm text-slate-500">{L('noData')}</p>}
        </div>
      </div>
    </>
  );
}

function Products({ L }) {
  const canWriteProduct = can('products.write');
  const canDeleteProduct = can('products.delete');
  const canAdjustStock = can('stock.adjust');
  const [rows, setRows] = useState([]);
  const [branches, setBranches] = useState([]);
  const [summary, setSummary] = useState([]);
  const [form, setForm] = useState(null);
  const [stock, setStock] = useState(null);
  const [transfer, setTransfer] = useState(null);
  const [branchFilter, setBranchFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [err, setErr] = useState('');

  async function load() {
    try {
      const session = getStoredSession();
      const [{ data, error }, branchData, stockSummary] = await Promise.all([
        applyProductScope(supabase.from('products').select('*, branches(name)'), session).order('name'),
        loadBranches(),
        loadBranchStockSummary()
      ]);
      if (error) throw error;
      setRows((data || []).map(mapProduct));
      setBranches(branchData || []);
      setSummary(stockSummary || []);
    } catch (e) { setErr(e.message); }
  }

  useEffect(() => { load(); }, []);

  const visibleRows = (branchFilter === 'all'
    ? rows
    : rows.filter(p => String(p.branchId || '') === String(branchFilter)))
    .filter(p => !search || [p.ref, p.nom, p.nomAr, p.categorie, p.branchName].join(' ').toLowerCase().includes(search.toLowerCase()));

  const totalQty = visibleRows.reduce((s, p) => s + Number(p.quantite || 0), 0);
  const stockValue = visibleRows.reduce((s, p) => s + Number(p.quantite || 0) * Number(p.prixAchat || 0), 0);
  const lowStock = visibleRows.filter(p => Number(p.quantite || 0) <= Number(p.stockMin || 0)).length;

  async function save() {
    try {
      requirePerm('products.write', 'Gestion produits');

      const payload = {
        ref: form.ref || '',
        name: form.nom || '',
        category: form.categorie || 'Divers',
        name_ar: form.nomAr || '',
        unit: form.unite || 'Pièce',
        purchase_price: Number(form.prixAchat || 0),
        sale_price: Number(form.prixVente || 0),
        quantity: Number(form.quantite || 0),
        min_stock: Number(form.stockMin || 0),
        supplier_id: form.fournisseurId || null,
        branch_id: isAdmin(getStoredSession()) ? (form.branchId || form.branch_id || currentBranchId()) : currentBranchId()
      };

      const q = form.id ? supabase.from('products').update(payload).eq('id', form.id) : supabase.from('products').insert(payload);
      const { error } = await q;
      if (error) throw error;
      await auditLog('Produits', form.id ? 'UPDATE' : 'CREATE', payload.ref || payload.name, form.id ? 'Modification produit' : 'Création produit');
      setForm(null);
      load();
    } catch (e) { alert(e.message); }
  }

  async function remove(id) {
    if (!confirm('Supprimer ?')) return;
    try {
      requirePerm('products.delete', 'Suppression produit');
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      await auditLog('Produits', 'DELETE', id, 'Suppression produit');
      load();
    } catch (e) { alert(e.message); }
  }

  async function adjustStock() {
    try {
      requirePerm('stock.adjust', 'Ajustement stock');
      await updateStock([{ produitId: stock.id, qte: Math.abs(Number(stock.qte || 0)) }], Number(stock.sign || 1), stock.reason || L('adjustment'), { docType: L('adjustment'), docNumber: 'ADJ-' + Date.now() });
      setStock(null);
      load();
    } catch (e) { alert(e.message); }
  }

  async function doTransfer() {
    try {
      await transferStock(transfer);
      setTransfer(null);
      load();
    } catch (e) { alert(e.message); }
  }

  if (err) return <ErrorBox msg={err} />;

  return (
    <>
      <Header title={L('products')}>
        <input className="input max-w-xs" placeholder={L('search')} value={search} onChange={e => setSearch(e.target.value)} />
        <button onClick={() => downloadCsv('produits.csv', visibleRows.map(p => ({ ref: p.ref, nom: p.nom, categorie: p.categorie, stock: p.quantite, prix_achat: p.prixAchat, prix_vente: p.prixVente, droguerie: p.branchName })))} className="btn bg-white border">{L('exportCsv')}</button>
        {isAdmin(getStoredSession()) ? (
          <select className="input max-w-xs" value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
            <option value="all">{L('all')} - {L('branches')}</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        ) : null}
        {canWriteProduct ? <button onClick={() => setForm({ ref: '', nom: '', categorie: 'Divers', unite: 'Pièce', prixAchat: 0, prixVente: 0, quantite: 0, stockMin: 0, branchId: currentBranchId() || branches[0]?.id || '' })} className="btn bg-amber-500">{L('new')}</button> : null}
      </Header>

      <div className="grid md:grid-cols-4 gap-4 mb-4">
        <div className="card p-4"><p className="text-xs text-slate-400">{L('products')}</p><p className="text-2xl font-black">{visibleRows.length}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-400">{L('quantity')}</p><p className="text-2xl font-black">{fmt(totalQty)}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-400">{L('stockValue')}</p><p className="text-2xl font-black">{dh(stockValue)}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-400">{L('lowStock')}</p><p className="text-2xl font-black text-red-600">{lowStock}</p></div>
      </div>

      {isAdmin(getStoredSession()) ? (
        <div className="grid md:grid-cols-3 gap-3 mb-4">
          {summary.map(s => (
            <div key={s.branchId} className="card p-4">
              <div className="font-bold">{s.branchName}</div>
              <div className="text-xs text-slate-500">{s.products} produits · {fmt(s.qty)} unités</div>
              <div className="mt-2 font-mono font-black">{dh(s.value)}</div>
              <div className="text-xs text-red-500">{s.lowStock} alertes stock</div>
            </div>
          ))}
        </div>
      ) : null}

      <Table>
        <thead><tr>
          <th>{L('ref')}</th>
          <th>{L('product')}</th>
          <th>{L('category')}</th>
          <th>{L('location')}</th>
          <th>{L('stock')}</th>
          <th>{L('purchasePrice')}</th>
          <th>{L('salePrice')}</th>
          <th>{L('margin')}</th>
          <th>{L('actions')}</th>
        </tr></thead>
        <tbody>
          {visibleRows.map(p => (
            <tr key={p.id}>
              <td className="font-mono text-xs">{p.ref}</td>
              <td>
                <div className="font-semibold">{p.nom}</div>
                {p.nomAr ? <div className="text-xs text-slate-400">{p.nomAr}</div> : null}
              </td>
              <td><Badge tone="slate">{p.categorie || '-'}</Badge></td>
              <td><Badge tone="blue">{p.branchName || '-'}</Badge></td>
              <td>
                <div className={p.quantite <= p.stockMin ? 'text-red-600 font-bold' : 'font-bold'}>{fmt(p.quantite)} {p.unite}</div>
                <div className="text-xs text-slate-400">{L('minStock')} : {fmt(p.stockMin)}</div>
              </td>
              <td className="font-mono">{dh(p.prixAchat)}</td>
              <td className="font-mono font-bold">{dh(p.prixVente)}</td>
              <td>
                <Badge tone={(p.prixVente - p.prixAchat) >= 0 ? 'green' : 'red'}>{dh(p.prixVente - p.prixAchat)}</Badge>
              </td>
              <td className="flex gap-1 flex-wrap">
                {canWriteProduct ? <button onClick={() => setForm(p)} className="btn bg-white border">{L('edit')}</button> : null}
                {canAdjustStock ? <button onClick={() => setStock({ ...p, qte: 1, sign: 1, reason: L('stockAdjustIn') })} className="btn bg-white border">{L('stock')}</button> : null}
                {canAdjustStock ? <button onClick={() => setTransfer({ productId: p.id, productName: p.nom, fromBranchId: p.branchId, toBranchId: branches.find(b => Number(b.id) !== Number(p.branchId))?.id || '', quantity: 1, reason: L('stockTransfer') })} className="btn bg-white border">{L('stockTransfer')}</button> : null}
                {canDeleteProduct ? <button onClick={() => remove(p.id)} className="btn bg-red-600 text-white">{L('del')}</button> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {form ? <ProductModal L={L} form={form} setForm={setForm} save={save} close={() => setForm(null)} branches={branches} /> : null}
      {stock ? <StockModal L={L} stock={stock} setStock={setStock} save={adjustStock} close={() => setStock(null)} /> : null}
      {transfer ? <StockTransferModal L={L} transfer={transfer} setTransfer={setTransfer} branches={branches} save={doTransfer} close={() => setTransfer(null)} /> : null}
    </>
  );
}

function ProductModal({ L, form, setForm, save, close, branches = [] }) {
  const fields = [
    ['ref', L('ref')], ['nom', L('name')], ['nomAr', L('arabicName')], ['categorie', L('category')], ['unite', L('unit')],
    ['prixAchat', L('purchasePrice')], ['prixVente', L('salePrice')], ['quantite', L('quantity')], ['stockMin', L('threshold')]
  ];
  return (
    <Modal title={L('products')} onClose={close}>
      <div className="grid grid-cols-2 gap-3">
        {fields.map(([k, label]) => (
          <label key={k} className="text-xs text-slate-500">
            {label}
            <input className="input mt-1" value={form[k] ?? ''} onChange={e => setForm({ ...form, [k]: ['prixAchat', 'prixVente', 'quantite', 'stockMin'].includes(k) ? Number(e.target.value) : e.target.value })} />
          </label>
        ))}
        {isAdmin(getStoredSession()) ? (
          <label className="text-xs text-slate-500">
            {L('branch')}
            <select className="input mt-1" value={form.branchId || form.branch_id || ''} onChange={e => setForm({ ...form, branchId: e.target.value ? Number(e.target.value) : null })}>
              <option value="">--</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
        ) : null}
      </div>
      <button onClick={save} className="btn bg-amber-500 mt-4">{L('save')}</button>
    </Modal>
  );
}

function StockModal({ L, stock, setStock, save, close }) {
  return (
    <Modal title={L('adjustment')} onClose={close}>
      <p className="font-semibold mb-1">{stock.nom}</p>
      <p className="text-xs text-slate-500 mb-3">{L('location')} : {stock.branchName || '-'}</p>

      <label className="text-xs text-slate-500">{L('operationType')}
        <select className="input mt-1 mb-2" value={stock.sign || 1} onChange={e => setStock({ ...stock, sign: Number(e.target.value), reason: Number(e.target.value) === 1 ? L('stockAdjustIn') : L('stockAdjustOut') })}>
          <option value={1}>{L('stockAdjustIn')}</option>
          <option value={-1}>{L('stockAdjustOut')}</option>
        </select>
      </label>

      <label className="text-xs text-slate-500">{L('quantity')}
        <input className="input mt-1 mb-2" type="number" min="0" value={stock.qte} onChange={e => setStock({ ...stock, qte: e.target.value })} />
      </label>

      <label className="text-xs text-slate-500">{L('reason')}
        <input className="input mt-1" value={stock.reason} onChange={e => setStock({ ...stock, reason: e.target.value })} />
      </label>

      <button onClick={save} className="btn bg-amber-500 mt-4">{L('save')}</button>
    </Modal>
  );
}

function StockTransferModal({ L, transfer, setTransfer, branches, save, close }) {
  return (
    <Modal title={L('stockTransfer')} onClose={close}>
      <p className="font-semibold mb-3">{transfer.productName}</p>
      <label className="text-xs text-slate-500">{L('toBranch')}
        <select className="input mt-1 mb-2" value={transfer.toBranchId || ''} onChange={e => setTransfer({ ...transfer, toBranchId: e.target.value ? Number(e.target.value) : '' })}>
          <option value="">--</option>
          {branches.filter(b => Number(b.id) !== Number(transfer.fromBranchId)).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </label>
      <label className="text-xs text-slate-500">{L('quantity')}
        <input className="input mt-1 mb-2" type="number" min="0" value={transfer.quantity} onChange={e => setTransfer({ ...transfer, quantity: e.target.value })} />
      </label>
      <label className="text-xs text-slate-500">{L('reason')}
        <input className="input mt-1" value={transfer.reason} onChange={e => setTransfer({ ...transfer, reason: e.target.value })} />
      </label>
      <button onClick={save} className="btn bg-amber-500 mt-4">{L('save')}</button>
    </Modal>
  );
}

function Docs({ L, type }) {
  const isSales = type === 'sales';
  const canWriteDoc = can(isSales ? 'sales.write' : 'purchases.write');
  const canDeleteDoc = can(isSales ? 'sales.delete' : 'purchases.delete');
  const canPayDoc = can(isSales ? 'sales.pay' : 'purchases.pay');
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [parties, setParties] = useState([]);
  const [form, setForm] = useState(null);
  const [pay, setPay] = useState(null);
  const [partial, setPartial] = useState(null);
  const [preview, setPreview] = useState(null);
  const [tab, setTab] = useState('all');
  const [err, setErr] = useState('');

  async function load() {
    try {
      const session = getStoredSession();
      const partiesQueryBase = supabase.from(isSales ? 'clients' : 'suppliers').select('*').order('name');
      const partiesQuery = (!isAdmin(session) && branchId(session)) ? partiesQueryBase.eq('branch_id', branchId(session)) : partiesQueryBase;

      const [{ data: docs, error: dErr }, { data: prod, error: pErr }, { data: party, error: tErr }, userLabels] = await Promise.all([
        applyDocScope(supabase.from(type).select('*'), type, session).order('id', { ascending: false }),
        applyProductScope(supabase.from('products').select('*, branches(name)'), session).order('name'),
        partiesQuery,
        loadUserLabels()
      ]);
      if (dErr) throw dErr;
      if (pErr) throw pErr;
      if (tErr) throw tErr;
      setRows(enrichDocs(docs || [], userLabels));
      setProducts((prod || []).map(mapProduct));
      setParties(party || []);
    } catch (e) { setErr(e.message); }
  }

  useEffect(() => { load(); }, [type]);

  const tabs = isSales
    ? [['all', L('all')], ['devis', L('quotes')], ['commande', L('orders')], ['livraison', L('deliveries')], ['facture', L('invoices')]]
    : [['all', L('all')], ['commande', L('orders')], ['reception', L('receipts')], ['facture', L('invoices')]];

  const filtered = (tab === 'all' ? rows : rows.filter(x => x.stage === tab)).filter(x => {
    if (tab === 'commande' && docStatus(x) === 'closed') return false;
    if (tab === 'reception' && docStatus(x) === 'closed') return false;
    if (tab === 'livraison' && docStatus(x) === 'closed' && x.stage === 'commande') return false;
    return true;
  });

  function create(start) {
    setForm({ start, date: today(), partyId: parties[0]?.id || '', lignes: [{ produitId: products[0]?.id || '', qte: 1 }] });
  }

  async function save() {
    try {
      const lines = form.lignes.map(l => {
        const product = products.find(p => String(p.id) === String(l.produitId));
        if (!product) throw new Error('Produit non sélectionné');
        return {
          produitId: product.id,
          ref: product.ref,
          nom: product.nom,
          prixUnit: Number(l.prixUnit ?? (isSales ? product.prixVente : product.prixAchat)),
          qte: Number(l.qte)
        };
      });
      const party = parties.find(p => String(p.id) === String(form.partyId));
      if (!party) throw new Error(isSales ? 'Client non sélectionné' : 'Fournisseur non sélectionné');

      const body = {
        start: form.start,
        date: form.date,
        lignes: lines,
        tauxTva: 20,
        clientId: party.id,
        clientNom: party.name,
        fournisseurId: party.id,
        fournisseurNom: party.name
      };

      if (form.id) await updateDoc(type, form.id, body);
      else await createDoc(type, body);

      setForm(null);
      load();
    } catch (e) { alert(e.message); }
  }

  async function advance(id) {
    try { await advanceDoc(type, id); load(); }
    catch (e) { alert(e.message); }
  }

  async function remove(id) {
    if (!confirm('Supprimer ?')) return;
    try { await deleteDoc(type, id); load(); }
    catch (e) { alert(e.message); }
  }

  async function settle() {
    try {
      await payDoc(type, pay.id, { date: pay.date, mode: pay.mode, montant: Number(pay.montant), cashRegister: pay.cashRegister, receiptNo: pay.receiptNo, chequeNo: pay.chequeNo, bank: pay.bank, dueDate: pay.dueDate, paymentStatus: pay.paymentStatus, transferRef: pay.transferRef, valueDate: pay.valueDate, terminal: pay.terminal, transactionNo: pay.transactionNo, billNo: pay.billNo, note: pay.note });
      setPay(null);
      load();
    } catch (e) { alert(e.message); }
  }

  async function doPartial() {
    try {
      await partialDoc(type, partial.doc.id, {
        date: partial.date || today(),
        lignes: partial.lignes || []
      });
      setPartial(null);
      load();
    } catch (e) { alert(e.message); }
  }

  if (err) return <ErrorBox msg={err} />;

  return (
    <>
      <Header title={isSales ? L('sales') : L('purchases')}>
        <button onClick={() => create(isSales ? 'devis' : 'commande')} className="btn bg-white border">{L('create')}</button>
        <button onClick={() => create(isSales ? 'facture' : 'reception')} className="btn bg-amber-500">{L('direct')}</button>
      </Header>

      <div className="flex gap-1 mb-4 flex-wrap">
        {tabs.map(t => <button key={t[0]} onClick={() => setTab(t[0])} className={'px-3 py-1.5 rounded-lg text-sm ' + (tab === t[0] ? 'bg-slate-800 text-white' : 'bg-white border text-slate-500')}>{t[1]}</button>)}
      </div>

      <Table>
        <thead>
          <tr>
            <th>{L('docType')}</th>
            <th>N°</th>
            <th>{L('baseDocNo')}</th>
            <th>{L('createdBy')}</th>
            <th>{L('date')}</th>
            <th>{isSales ? L('customer') : L('supplier')}</th>
            <th>{L('status')}</th>
            <th>{L('quantity')}</th>
            <th>{L('totalTTC')}</th>
            {tab === 'facture' ? <th>{L('payment')}</th> : null}
            <th>{L('actions')}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(d => {
            const status = d.statutPaiement === 'paid' ? L('paid') : d.statutPaiement === 'partial' ? L('partial') : L('unpaid');
            const tone = d.statutPaiement === 'paid' ? 'green' : d.statutPaiement === 'partial' ? 'amber' : 'red';
            return (
              <tr key={d.id}>
                <td><Badge tone="blue">{docTypeLabel(d, type, L)}</Badge></td>
                <td className="font-mono text-xs font-bold">{docNo(d)}</td>
                <td>{d.baseDocId ? <Badge tone="slate">{d.baseDocNumber || ('#' + d.baseDocId)}</Badge> : '-'}</td>
                <td>
                  <div className="font-semibold">{d.createdByLabel || '-'}</div>
                  <div className="text-xs text-slate-400">{L('createdBy')}</div>
                </td>
                <td>{d.date}</td>
                <td>
                  <div className="font-semibold">{d.client_name || d.supplier_name || d.clientNom || d.fournisseurNom}</div>
                  <div className="text-xs text-slate-400">{isSales ? L('customer') : L('supplier')}</div>
                </td>
                <td><Badge tone={docStatus(d) === 'closed' ? 'green' : docStatus(d) === 'partial' ? 'amber' : 'blue'}>{docStatus(d) === 'closed' ? L('closed') : docStatus(d) === 'partial' ? L('partial') : L('open')}</Badge></td>
                <td className="text-xs">
                  <div>{L('quantity')}: <b>{docQty(d.lignes)}</b></div>
                  <div>{L('remainingQty')}: <b>{docRemainingQty(d)}</b></div>
                </td>
                <td className="font-mono font-bold">{dh(d.totalTTC)}</td>
                {tab === 'facture' ? <td><Badge tone={tone}>{status}{d.reste > 0 ? ' · ' + L('remaining') + ' ' + dh(d.reste) : ''}</Badge></td> : null}
                <td className="flex gap-1 flex-wrap">
                  {canWriteDoc ? <button onClick={() => advance(d.id)} className="btn bg-slate-800 text-white">{L('advance')}</button> : null}
                  <button onClick={() => setPreview(d)} className="btn bg-white border">{L('preview')}</button>
                  {canPayDoc && paymentButtonVisible(d) ? <button onClick={() => setPay({ ...d, date: today(), mode: 'Espèces', montant: d.reste || d.totalTTC, cashRegister: '', receiptNo: '', chequeNo: '', bank: '', dueDate: '', paymentStatus: 'En portefeuille', transferRef: '', valueDate: '', terminal: '', transactionNo: '', billNo: '', note: '' })} className="btn bg-emerald-600 text-white">{L('pay')}</button> : null}
                  {d.stage !== 'facture' && docRemainingQty(d) > 0 ? <button onClick={() => setPartial({ doc: d, date: today(), lignes: docRemainingLines(d).map(l => ({ ...l, qteToProcess: Number(l.remainingQty || 0), excluded: false })) })} className="btn bg-white border">{isSales ? L('partialDelivery') : L('partialReceipt')}</button> : null}
                  {canWriteDoc ? <button onClick={() => setForm({ id: d.id, start: d.stage, date: d.date, partyId: isSales ? d.client_id : d.supplier_id, lignes: (d.lignes || []).map(l => ({ produitId: l.produitId, qte: l.qte, prixUnit: l.prixUnit })) })} className="btn bg-white border">{L('edit')}</button> : null}
                  {canDeleteDoc ? <button onClick={() => remove(d.id)} className="btn bg-red-600 text-white">{L('del')}</button> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      {form ? <DocModal L={L} isSales={isSales} form={form} setForm={setForm} products={products} parties={parties} save={save} close={() => setForm(null)} /> : null}
      {pay ? <PaymentModal L={L} isSales={isSales} pay={pay} setPay={setPay} save={settle} close={() => setPay(null)} /> : null}
      {partial ? <PartialModal L={L} isSales={isSales} partial={partial} setPartial={setPartial} save={doPartial} close={() => setPartial(null)} /> : null}
      {preview ? <DocumentPreview L={L} isSales={isSales} doc={preview} close={() => setPreview(null)} /> : null}
    </>
  );
}

function DocModal({ L, isSales, form, setForm, products, parties, save, close }) {
  function defaultPrice(productId) {
    const p = products.find(x => String(x.id) === String(productId));
    return p ? (isSales ? p.prixVente : p.prixAchat) : 0;
  }

  function addLine() {
    const first = products[0];
    setForm({
      ...form,
      lignes: [
        ...form.lignes,
        { produitId: first?.id || '', qte: 1, prixUnit: first ? (isSales ? first.prixVente : first.prixAchat) : 0 }
      ]
    });
  }

  function updateLine(i, k, v) {
    setForm({
      ...form,
      lignes: form.lignes.map((l, idx) => {
        if (idx !== i) return l;
        if (k === 'produitId') {
          return { ...l, produitId: v, prixUnit: defaultPrice(v) };
        }
        return { ...l, [k]: v };
      })
    });
  }

  function lineTotal(l) {
    return Number(l.qte || 0) * Number(l.prixUnit ?? defaultPrice(l.produitId));
  }

  const total = (form.lignes || []).reduce((s, l) => s + lineTotal(l), 0);

  return (
    <Modal title={isSales ? L('sales') : L('purchases')} onClose={close} wide>
      <div className="grid md:grid-cols-2 gap-3 mb-4">
        <label className="text-xs text-slate-500">{L('date')}
          <input type="date" className="input mt-1" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        </label>
        <label className="text-xs text-slate-500">{isSales ? L('customer') : L('supplier')}
          <select className="input mt-1" value={form.partyId} onChange={e => setForm({ ...form, partyId: e.target.value })}>
            {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
      </div>

      <div className="card overflow-hidden">
        <table className="table w-full">
          <thead>
            <tr>
              <th>{L('product')}</th>
              <th>{L('quantity')}</th>
              <th>{L('unitPrice')}</th>
              <th>{L('totalTTC')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {form.lignes.map((l, i) => {
              const price = l.prixUnit ?? defaultPrice(l.produitId);
              return (
                <tr key={i}>
                  <td>
                    <select className="input" value={l.produitId} onChange={e => updateLine(i, 'produitId', e.target.value)}>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nom}{p.nomAr ? ' / ' + p.nomAr : ''} · {L('stock')} {p.quantite}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input className="input" type="number" min="0" step="0.0001" value={l.qte} onChange={e => updateLine(i, 'qte', e.target.value)} />
                  </td>
                  <td>
                    <input className="input" type="number" min="0" step="0.01" value={price} onChange={e => updateLine(i, 'prixUnit', e.target.value)} />
                  </td>
                  <td className="font-bold">{dh(lineTotal({ ...l, prixUnit: price }))}</td>
                  <td>
                    <button className="btn bg-red-50 text-red-600" onClick={() => setForm({ ...form, lignes: form.lignes.filter((_, idx) => idx !== i) })}>✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <button onClick={addLine} className="btn bg-white border">+ Ligne</button>
        <div className="text-right">
          <p className="text-xs text-slate-400">{L('totalTTC')}</p>
          <p className="text-xl font-black">{dh(total)}</p>
        </div>
      </div>

      <button onClick={save} className="btn bg-amber-500 mt-4">{L('save')}</button>
    </Modal>
  );
}

function DocumentPreview({ L, type, doc, close }) {
  const isSales = type === 'sales' || doc?.client_id || doc?.client_name;
  const [company, setCompany] = useState(null);
  useEffect(() => { loadCompanySettings().then(setCompany).catch(() => setCompany({ name: 'DrogueriePro' })); }, []);

  const c = company || { name: 'DrogueriePro' };
  const third = isSales ? (doc.client_name || doc.clientName || '-') : (doc.supplier_name || doc.supplierName || '-');
  const docTitle = preciseDocTitle(doc, type, L);
  const vatRate = Number(doc.vat_rate || 20);

  return (
    <Modal title={L('preview')} onClose={close} wide>
      <div className="print-area simple-document">
        <div className="simple-doc-header">
          <div>
            <div className="simple-brand">{c.name}</div>
            <div className="simple-muted">{c.address || '-'}</div>
            <div className="simple-muted">{L('phone')} : {c.phone || '-'}</div>
            <div className="simple-legal">ICE: {c.ice || '-'} · RC: {c.rc || '-'} · IF: {c.ifNumber || '-'} · Patente: {c.patente || '-'}</div>
          </div>

          <div className="simple-title-box">
            <div className="simple-title">{docTitle}</div>
            <div className="simple-number">{docNo(doc)}</div>
            <div className="simple-muted">{L('date')} : {doc.date || today()}</div>
          </div>
        </div>

        <div className="simple-doc-meta">
          <div>
            <span>{isSales ? L('customer') : L('supplier')}</span>
            <b>{third}</b>
          </div>
          <div>
            <span>{L('payment')}</span>
            <b>{paymentLabel(doc, L)}</b>
          </div>
          <div>
            <span>{L('createdBy')}</span>
            <b>{doc.createdByLabel || currentUserLabel() || '-'}</b>
          </div>
          <div>
            <span>{L('baseDocNo')}</span>
            <b>{doc.baseDocId ? (doc.baseDocNumber || ('#' + doc.baseDocId)) : '-'}</b>
          </div>
        </div>

        <table className="simple-lines">
          <thead>
            <tr>
              <th>#</th>
              <th>{L('ref')}</th>
              <th>{L('product')}</th>
              <th>{L('quantity')}</th>
              <th>{L('unitPrice')}</th>
              <th>{L('totalTTC')}</th>
            </tr>
          </thead>
          <tbody>
            {(doc.lignes || []).map((l, i) => {
              const total = Number(l.prixUnit || 0) * Number(l.qte || 0);
              return (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td className="font-mono">{l.ref || l.produitId || '-'}</td>
                  <td>{l.nom || '-'}</td>
                  <td>{fmt(l.qte)}</td>
                  <td>{dh(l.prixUnit)}</td>
                  <td className="simple-bold">{dh(total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="simple-bottom">
          <div className="simple-note">
            <b>{L('note')}</b>
            <p>{L('legalMoroccoNote') || L('legalNote')}</p>
            <p>{L('thankYou') || ''}</p>
          </div>

          <div className="simple-totals">
            <div><span>{L('totalHT')}</span><b>{dh(doc.totalHT || 0)}</b></div>
            <div><span>{L('totalVAT')} ({fmt(vatRate)}%)</span><b>{dh(doc.tva || 0)}</b></div>
            <div className="simple-grand"><span>{L('netToPay')}</span><b>{dh(doc.totalTTC || 0)}</b></div>
          </div>
        </div>

        <div className="simple-footer">
          <div>{L('printDate')} : {new Date().toLocaleString()}</div>
          <div className="simple-signature">{L('signature')}</div>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4 no-print">
        <button onClick={() => window.print()} className="btn bg-slate-900 text-white">{L('print')}</button>
        <button onClick={close} className="btn bg-white border">{L('closed')}</button>
      </div>
    </Modal>
  );
}

function Payments({ L }) {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');
  const [filter, setFilter] = useState('all');

  async function load() {
    try {
      setErr('');
      const data = await loadPayments();
      setRows(data || []);
    } catch (e) {
      console.warn('Payments load error:', e.message);
      setRows([]);
      setErr('');
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = rows.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'active') return !p.canceled;
    if (filter === 'canceled') return !!p.canceled;
    return p.type === filter;
  });

  async function cancel(p) {
    if (!can('payments.cancel')) return alert('Autorisation insuffisante : payments.cancel');
    const reason = prompt('Motif annulation ?', 'Annulation règlement');
    if (reason === null) return;
    try {
      await cancelPayment(p.sourceTable, p.docId, p.id, reason);
      await load();
    } catch (e) { alert(e.message); }
  }

  const activeTotal = filtered.filter(p => !p.canceled).reduce((s, p) => s + Number(p.montant || 0), 0);
  const canceledTotal = filtered.filter(p => p.canceled).reduce((s, p) => s + Number(p.montant || 0), 0);

  return (
    <>
      <Header title={L('payments')}>
        <select className="input max-w-xs" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">{L('all')}</option>
          <option value="active">Actifs</option>
          <option value="canceled">{L('canceled')}</option>
          <option value="encaissement">{L('cashIn')}</option>
          <option value="decaissement">{L('cashOut')}</option>
        </select>
        <button onClick={load} className="btn bg-white border">↻</button>
      </Header>

      <div className="pro-kpi-grid mb-4">
        <div className="pro-kpi-card"><span>{L('kpiCashIn')}</span><b>{dh(rows.filter(p => p.type === 'encaissement' && !p.canceled).reduce((s,p)=>s+Number(p.montant||0),0))}</b><small>{L('cashIn')}</small></div>
        <div className="pro-kpi-card"><span>{L('kpiCashOut')}</span><b>{dh(rows.filter(p => p.type === 'decaissement' && !p.canceled).reduce((s,p)=>s+Number(p.montant||0),0))}</b><small>{L('cashOut')}</small></div>
        <div className="pro-kpi-card"><span>{L('paymentList')}</span><b>{filtered.length}</b><small>{L('document')}</small></div>
        <div className="pro-kpi-card"><span>{L('canceled')}</span><b>{dh(canceledTotal)}</b><small>{L('cancelPayment')}</small></div>
      </div>

      {err ? <ErrorBox msg={err} /> : null}

      <Table>
        <thead>
          <tr>
            <th>{L('date')}</th>
            <th>Type</th>
            <th>{L('docType')}</th>
            <th>{L('document')}</th>
            <th>{L('customer')} / {L('supplier')}</th>
            <th>Mode</th>
            <th>{L('detail')}</th>
            <th>{L('totalTTC')}</th>
            <th>{L('paymentStatus')}</th>
            <th>{L('actions')}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p, i) => (
            <tr key={(p.docId || '') + '-' + (p.id || i)} className={p.canceled ? 'payment-canceled' : ''}>
              <td>{p.date || '-'}</td>
              <td><Badge tone={p.type === 'encaissement' ? 'green' : 'amber'}>{p.type === 'encaissement' ? L('cashIn') : L('cashOut')}</Badge></td>
              <td>{p.docType || '-'}</td>
              <td className="font-mono text-xs">{p.docNumber || '-'}</td>
              <td>{p.tiers || '-'}</td>
              <td>{p.mode || '-'}</td>
              <td className="text-xs text-slate-500">{[p.chequeNo, p.bank, p.transferRef, p.transactionNo, p.note].filter(Boolean).join(' · ') || '-'}</td>
              <td className="font-bold">{dh(p.montant || 0)}</td>
              <td>{p.canceled ? <Badge tone="red">{L('canceled')}</Badge> : <Badge tone="green">Actif</Badge>}</td>
              <td>{!p.canceled ? <button onClick={() => cancel(p)} className="btn bg-red-600 text-white">{L('cancelPayment')}</button> : '-'}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}


function PaymentModal({ L, isSales, pay, setPay, save, close }) {
  const mode = pay.mode || 'Espèces';
  function Field({ label, name, type = 'text' }) {
    return <label className="text-xs text-slate-500">{label}<input type={type} className="input mt-1 mb-2" value={pay[name] || ''} onChange={e => setPay({ ...pay, [name]: e.target.value })} /></label>;
  }
  function SelectField({ label, name, options }) {
    return <label className="text-xs text-slate-500">{label}<select className="input mt-1 mb-2" value={pay[name] || ''} onChange={e => setPay({ ...pay, [name]: e.target.value })}>{options.map(x => <option key={x} value={x}>{x}</option>)}</select></label>;
  }
  return (
    <Modal title={isSales ? L('cashIn') : L('cashOut')} onClose={close}>
      <p className="text-sm mb-2">{L('remaining')} : <b>{dh(pay.reste || 0)}</b></p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label={L('date')} name="date" type="date" />
        <label className="text-xs text-slate-500">Mode<select className="input mt-1 mb-2" value={mode} onChange={e => setPay({ ...pay, mode: e.target.value })}>{['Espèces', 'Chèque', 'Virement', 'Carte', 'Effet', 'Crédit'].map(x => <option key={x}>{x}</option>)}</select></label>
        <Field label="Montant" name="montant" type="number" />
        {mode === 'Espèces' && <><Field label={L('cashRegister')} name="cashRegister" /><Field label={L('receiptNo')} name="receiptNo" /></>}
        {mode === 'Chèque' && <><Field label={L('chequeNo')} name="chequeNo" /><Field label={L('bank')} name="bank" /><Field label={L('dueDate')} name="dueDate" type="date" /><SelectField label={L('paymentStatus')} name="paymentStatus" options={['En portefeuille','Déposé','Encaissé','Rejeté']} /></>}
        {mode === 'Virement' && <><Field label={L('bank')} name="bank" /><Field label={L('transferRef')} name="transferRef" /><Field label={L('valueDate')} name="valueDate" type="date" /></>}
        {mode === 'Carte' && <><Field label={L('terminal')} name="terminal" /><Field label={L('transactionNo')} name="transactionNo" /></>}
        {mode === 'Effet' && <><Field label={L('billNo')} name="billNo" /><Field label={L('bank')} name="bank" /><Field label={L('dueDate')} name="dueDate" type="date" /><SelectField label={L('paymentStatus')} name="paymentStatus" options={['En portefeuille','Déposé','Encaissé','Rejeté']} /></>}
        {mode === 'Crédit' && <><Field label={L('dueDate')} name="dueDate" type="date" /><Field label={L('note')} name="note" /></>}
      </div>
      <label className="text-xs text-slate-500">{L('note')}<textarea className="input mt-1" value={pay.note || ''} onChange={e => setPay({ ...pay, note: e.target.value })} /></label>
      <button onClick={save} className="btn bg-emerald-600 text-white mt-4">{L('save')}</button>
    </Modal>
  );
}

function PartialModal({ L, isSales, partial, setPartial, save, close }) {
  const lines = partial.lignes || [];

  function updateLine(index, value) {
    const next = [...lines];
    const max = Number(next[index].remainingQty || 0);
    let qty = Number(value || 0);
    if (qty < 0) qty = 0;
    if (qty > max) qty = max;
    next[index] = { ...next[index], qteToProcess: qty, excluded: false };
    setPartial({ ...partial, lignes: next });
  }

  function toggleExclude(index) {
    const next = [...lines];
    const current = next[index];
    const excluded = !current.excluded;
    next[index] = {
      ...current,
      excluded,
      qteToProcess: excluded ? 0 : Number(current.remainingQty || 0)
    };
    setPartial({ ...partial, lignes: next });
  }

  function removeZeroLines() {
    const next = lines.map(l => Number(l.qteToProcess || 0) <= 0 ? { ...l, excluded: true, qteToProcess: 0 } : l);
    setPartial({ ...partial, lignes: next });
  }

  function restoreAll() {
    const next = lines.map(l => ({ ...l, excluded: false, qteToProcess: Number(l.remainingQty || 0) }));
    setPartial({ ...partial, lignes: next });
  }

  const includedLines = lines.filter(l => !l.excluded);
  const totalToProcess = includedLines.reduce((s, l) => s + Number(l.qteToProcess || 0), 0);

  return (
    <Modal title={isSales ? L('partialDelivery') : L('partialReceipt')} onClose={close} wide>
      <label className="text-xs text-slate-500">{L('date')}
        <input className="input mt-1 mb-3" type="date" value={partial.date || today()} onChange={e => setPartial({ ...partial, date: e.target.value })} />
      </label>

      <div className="flex gap-2 flex-wrap mb-3">
        <button onClick={restoreAll} className="btn bg-white border">{L('restoreLine')}</button>
        <button onClick={removeZeroLines} className="btn bg-white border">{L('removeLine')} qté 0</button>
      </div>

      <div className="card overflow-auto mb-4">
        <table className="table w-full">
          <thead>
            <tr>
              <th>{L('includeLine')}</th>
              <th>{L('ref')}</th>
              <th>{L('product')}</th>
              <th>{L('orderedQty')}</th>
              <th>{L('alreadyProcessed')}</th>
              <th>{L('remainingQty')}</th>
              <th>{L('qtyToProcess')}</th>
              <th>{L('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={lineKey(l) || i} className={l.excluded ? 'partial-line-excluded' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={!l.excluded}
                    onChange={() => toggleExclude(i)}
                  />
                </td>
                <td className="font-mono text-xs">{l.ref || '-'}</td>
                <td>
                  <div className="font-semibold">{l.nom || '-'}</div>
                  {l.excluded ? <div className="text-xs text-red-500">{L('removeLine')}</div> : null}
                </td>
                <td>{fmt(l.qte)}</td>
                <td>{fmt(l.processedQty || 0)}</td>
                <td className="font-bold">{fmt(l.remainingQty || 0)}</td>
                <td>
                  <input
                    className="input max-w-xs"
                    type="number"
                    min="0"
                    max={Number(l.remainingQty || 0)}
                    step="0.01"
                    disabled={!!l.excluded}
                    value={l.qteToProcess ?? 0}
                    onChange={e => updateLine(i, e.target.value)}
                  />
                </td>
                <td>
                  <button onClick={() => toggleExclude(i)} className={l.excluded ? 'btn bg-emerald-600 text-white' : 'btn bg-red-600 text-white'}>
                    {l.excluded ? L('restoreLine') : L('removeLine')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-slate-500">
          {L('qtyToProcess')} : <b>{fmt(totalToProcess)}</b> · {L('includeLine')} : <b>{includedLines.length}</b> / {lines.length}
        </div>
        <button disabled={totalToProcess <= 0} onClick={save} className="btn bg-amber-500 disabled:opacity-50">{L('save')}</button>
      </div>
    </Modal>
  );
}

function Parties({ L, type }) {
  const canWriteParty = can(type === 'clients' ? 'clients.write' : 'suppliers.write');
  const canDeleteParty = can(type === 'clients' ? 'clients.delete' : 'suppliers.delete');
  const canAssignParty = can(type === 'clients' ? 'clients.assign' : 'suppliers.write');
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState(null);
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [err, setErr] = useState('');

  async function load() {
    try {
      const [data, usersData, branchesData] = await Promise.all([loadParties(type), loadUsers(), loadBranches()]);
      setRows(data);
      setUsers(usersData);
      setBranches(branchesData);
    } catch (e) { setErr(e.message); }
  }

  useEffect(() => { load(); }, [type]);

  async function save() {
    try {
      await saveParty(type, form);
      setForm(null);
      load();
    } catch (e) { alert(e.message); }
  }

  async function remove(id) {
    if (!canDeleteParty) return alert('Suppression non autorisée');
    if (!confirm('Supprimer ?')) return;
    try {
      await deleteParty(type, id);
      load();
    } catch (e) { alert(e.message); }
  }

  function newParty() {
    if (!canWriteParty) return;
    setForm({
      name: '',
      type: 'entreprise',
      ice: '',
      phone: '',
      city: '',
      address: '',
      contact: '',
      assigned_to: getStoredSession()?.user?.id || '',
      branch_id: currentBranchId() || branches[0]?.id || ''
    });
  }

  if (err) return <ErrorBox msg={err} />;

  const filteredRows = (ownerFilter === 'all'
    ? rows
    : rows.filter(x => String(x.assigned_to || '') === String(ownerFilter)))
    .filter(x => !search || [x.name, x.ice, x.phone, x.city, x.assignedToLabel].join(' ').toLowerCase().includes(search.toLowerCase()));

  const uniqueOwners = users.filter(u => rows.some(x => String(x.assigned_to || '') === String(u.id)));

  return (
    <>
      <Header title={type === 'clients' ? L('clients') : L('suppliers')}>
        <input className="input max-w-xs" placeholder={L('search')} value={search} onChange={e => setSearch(e.target.value)} />
        <button onClick={() => downloadCsv((type === 'clients' ? 'clients.csv' : 'fournisseurs.csv'), filteredRows.map(x => ({ nom: x.name, ice: x.ice, telephone: x.phone, ville: x.city, cree_par: x.createdByLabel, affecte_a: x.assignedToLabel })))} className="btn bg-white border">{L('exportCsv')}</button>
        {type === 'clients' ? (
          <select className="input max-w-xs" value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)}>
            <option value="all">{L('all')} - {L('clientOwner')}</option>
            {uniqueOwners.map(u => <option key={u.id} value={u.id}>{u.full_name || u.username}</option>)}
          </select>
        ) : null}
        {canWriteParty ? <button onClick={newParty} className="btn bg-amber-500">{L('new')}</button> : null}
      </Header>

      <div className="grid md:grid-cols-4 gap-3 mb-4">
        <div className="card p-4"><p className="text-xs text-slate-400">{L('all')}</p><p className="text-2xl font-black">{filteredRows.length}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-400">{L('clientOwner')}</p><p className="text-2xl font-black">{uniqueOwners.length}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-400">{L('branch')}</p><p className="text-2xl font-black">{new Set(filteredRows.map(x => x.branch_id).filter(Boolean)).size}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-400">{L('createdBy')}</p><p className="text-2xl font-black">{new Set(filteredRows.map(x => x.created_by).filter(Boolean)).size}</p></div>
      </div>

      <Table>
        <thead>
          <tr>
            <th>{L('name')}</th>
            <th>ICE / Contact</th>
            <th>{L('phone')}</th>
            <th>{L('city')}</th>
            <th>{L('createdBy')}</th>
            {type === 'clients' ? <th>{L('assignedTo')}</th> : null}
            <th>{L('branch')}</th>
            <th>{L('actions')}</th>
          </tr>
        </thead>
        <tbody>
          {filteredRows.map(x => (
            <tr key={x.id}>
              <td className="font-semibold">{x.name}</td>
              <td className="text-xs text-slate-500">{x.ice || x.contact || '-'}</td>
              <td>{x.phone || '-'}</td>
              <td>{x.city || '-'}</td>
              <td>{x.createdByLabel || '-'}</td>
              {type === 'clients' ? <td><Badge tone="blue">{x.assignedToLabel || '-'}</Badge></td> : null}
              <td>{branches.find(b => Number(b.id) === Number(x.branch_id))?.name || '-'}</td>
              <td className="flex gap-1 flex-wrap">
                {canWriteParty ? <button onClick={() => setForm(x)} className="btn bg-white border">{L('edit')}</button> : null}
                {canDeleteParty ? <button onClick={() => remove(x.id)} className="btn bg-red-600 text-white">{L('del')}</button> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {form ? (
        <Modal title={type === 'clients' ? L('clients') : L('suppliers')} onClose={() => setForm(null)}>
          {['name', 'ice', 'phone', 'city', 'address'].map(k => (
            <input key={k} className="input mb-2" placeholder={k} value={form[k] || ''} onChange={e => setForm({ ...form, [k]: e.target.value })} />
          ))}

          {type === 'clients' ? (
            <label className="text-xs text-slate-500">{L('assignedTo')}
              <select className="input mt-1 mb-2" value={form.assigned_to || ''} disabled={!canAssignParty} onChange={e => setForm({ ...form, assigned_to: e.target.value ? Number(e.target.value) : null })}>
                <option value="">--</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.username}</option>)}
              </select>
            </label>
          ) : null}

          {isAdmin(getStoredSession()) ? (
            <label className="text-xs text-slate-500">{L('branch')}
              <select className="input mt-1 mb-2" value={form.branch_id || ''} onChange={e => setForm({ ...form, branch_id: e.target.value ? Number(e.target.value) : null })}>
                <option value="">--</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
          ) : null}

          <button onClick={save} className="btn bg-amber-500">{L('save')}</button>
        </Modal>
      ) : null}
    </>
  );
}

function Users({ L }) {
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState('');

  async function load() {
    try {
      const [users, rolesData, branchesData] = await Promise.all([loadUsers(), loadRoles(), loadBranches()]);
      setRows(users);
      setRoles(rolesData);
      setBranches(branchesData);
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  function newUser() {
    setForm({
      username: '',
      password: 'changeme',
      full_name: '',
      role_id: roles[0]?.id || 3,
      branch_id: branches[0]?.id || '',
      active: true
    });
  }

  function editUser(u) {
    const role = roles.find(r => r.name === u.role);
    setForm({
      id: u.id,
      username: u.username || '',
      password: '',
      full_name: u.full_name || '',
      role_id: role?.id || u.role_id || 3,
      branch_id: u.branch_id || '',
      active: u.active !== false
    });
  }

  async function save() {
    try {
      await saveUser(form);
      setForm(null);
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  async function toggleActive(u) {
    if (!confirm((u.active ? L('deactivate') : L('activate')) + ' ?')) return;
    try {
      await setUserActive(u.id, !u.active);
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  if (err) return <ErrorBox msg={err} />;

  return (
    <>
      <Header title={L('users')}>
        <button onClick={newUser} className="btn bg-amber-500">{L('new')}</button>
      </Header>

      <Table>
        <thead>
          <tr>
            <th>{L('username')}</th>
            <th>{L('fullName')}</th>
            <th>{L('role')}</th>
            <th>{L('branch')}</th>
            <th>{L('active')}</th>
            <th>{L('actions')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(u => (
            <tr key={u.id}>
              <td className="font-mono text-xs">{u.username}</td>
              <td>{u.full_name || '-'}</td>
              <td><Badge tone="blue">{u.role || '-'}</Badge></td>
              <td>{u.branch_name || '-'}</td>
              <td>
                <Badge tone={u.active ? 'green' : 'red'}>
                  {u.active ? L('active') : 'Inactif'}
                </Badge>
              </td>
              <td className="flex gap-1 flex-wrap">
                <button onClick={() => editUser(u)} className="btn bg-white border">{L('edit')}</button>
                <button onClick={() => toggleActive(u)} className={u.active ? 'btn bg-red-600 text-white' : 'btn bg-emerald-600 text-white'}>
                  {u.active ? L('deactivate') : L('activate')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {form ? (
        <Modal title={form.id ? L('edit') : L('new')} onClose={() => setForm(null)}>
          <label className="text-xs text-slate-500">{L('username')}
            <input className="input mt-1 mb-2" value={form.username || ''} onChange={e => setForm({ ...form, username: e.target.value })} disabled={!!form.id} />
          </label>

          <label className="text-xs text-slate-500">{L('fullName')}
            <input className="input mt-1 mb-2" value={form.full_name || ''} onChange={e => setForm({ ...form, full_name: e.target.value })} />
          </label>

          <label className="text-xs text-slate-500">{form.id ? L('changePassword') : L('password')}
            <input className="input mt-1 mb-2" type="password" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={form.id ? 'Laisser vide pour ne pas changer' : ''} />
          </label>

          <label className="text-xs text-slate-500">{L('role')}
            <select className="input mt-1 mb-2" value={form.role_id || ''} onChange={e => setForm({ ...form, role_id: Number(e.target.value) })}>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>

          <label className="text-xs text-slate-500">{L('branch')}
            <select className="input mt-1 mb-2" value={form.branch_id || ''} onChange={e => setForm({ ...form, branch_id: e.target.value ? Number(e.target.value) : null })}>
              <option value="">Toutes / Aucune</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm mb-4">
            <input type="checkbox" checked={form.active !== false} onChange={e => setForm({ ...form, active: e.target.checked })} />
            {L('active')}
          </label>

          <button onClick={save} className="btn bg-amber-500">{L('save')}</button>
        </Modal>
      ) : null}
    </>
  );
}



function StockMovements({ L }) {
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState('all');
  const [err, setErr] = useState('');

  async function load() {
    try {
      setErr('');
      setRows(await loadStockMovements());
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  if (err) return <ErrorBox msg={err} />;

  const filtered = tab === 'in'
    ? rows.filter(x => x.quantity > 0)
    : tab === 'out'
      ? rows.filter(x => x.quantity < 0)
      : rows;

  const totalIn = rows.filter(x => x.quantity > 0).reduce((s, x) => s + x.quantity, 0);
  const totalOut = rows.filter(x => x.quantity < 0).reduce((s, x) => s + Math.abs(x.quantity), 0);

  return (
    <>
      <Header title={L('stockMoves')}>
        <button onClick={load} className="btn bg-white border">↻</button>
      </Header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="card p-4"><p className="text-xs text-slate-400">{L('stockIn')}</p><p className="text-2xl font-black text-emerald-600">{fmt(totalIn)}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-400">{L('stockOut')}</p><p className="text-2xl font-black text-red-600">{fmt(totalOut)}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-400">{L('movement')}</p><p className="text-2xl font-black">{rows.length}</p></div>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('all')} className={'btn ' + (tab === 'all' ? 'bg-slate-800 text-white' : 'bg-white border')}>{L('all')}</button>
        <button onClick={() => setTab('in')} className={'btn ' + (tab === 'in' ? 'bg-emerald-600 text-white' : 'bg-white border')}>{L('stockIn')}</button>
        <button onClick={() => setTab('out')} className={'btn ' + (tab === 'out' ? 'bg-red-600 text-white' : 'bg-white border')}>{L('stockOut')}</button>
      </div>

      <Table>
        <thead>
          <tr>
            <th>{L('date')}</th>
            <th>{L('ref')}</th>
            <th>{L('product')}</th>
            <th>{L('location')}</th>
            <th>{L('quantity')}</th>
            <th>{L('docType')}</th>
            <th>N° Doc</th>
            <th>{L('actor')}</th>
            <th>{L('reason')}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(m => (
            <tr key={m.id}>
              <td>{m.date ? new Date(m.date).toLocaleString('fr-FR') : '-'}</td>
              <td className="font-mono text-xs">{m.ref || '-'}</td>
              <td className="font-semibold">{m.productName || '-'}</td>
              <td><Badge tone="blue">{m.branchName || '-'}</Badge></td>
              <td><Badge tone={m.quantity >= 0 ? 'green' : 'red'}>{m.quantity >= 0 ? '+' : ''}{fmt(m.quantity)}</Badge></td>
              <td>{m.docType || '-'}</td>
              <td className="font-mono text-xs">{m.docNumber || '-'}</td>
              <td>{m.userLabel || '-'}</td>
              <td>{m.reason || '-'}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}

function AuditLog({ L }) {
  const [rows, setRows] = useState([]);
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [textFilter, setTextFilter] = useState('');
  const [err, setErr] = useState('');

  async function load() {
    try {
      setErr('');
      setRows(await loadAuditLogs());
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  if (err) return <ErrorBox msg={err} />;

  const modules = ['all', ...Array.from(new Set(rows.map(x => x.module).filter(Boolean)))];
  const actions = ['all', ...Array.from(new Set(rows.map(x => x.action).filter(Boolean)))];

  const filtered = rows.filter(x => {
    const txt = `${x.user_label || ''} ${x.module || ''} ${x.action || ''} ${x.object_label || ''} ${x.detail || ''}`.toLowerCase();
    return (moduleFilter === 'all' || x.module === moduleFilter) &&
      (actionFilter === 'all' || x.action === actionFilter) &&
      (!textFilter || txt.includes(textFilter.toLowerCase()));
  });

  function tone(action) {
    if (['CREATE', 'ADVANCE', 'PAYMENT', 'STOCK', 'PARTIAL_DELIVERY', 'PARTIAL_RECEIPT'].includes(action)) return 'green';
    if (['DELETE', 'CANCEL_PAYMENT'].includes(action)) return 'red';
    if (['UPDATE'].includes(action)) return 'amber';
    return 'blue';
  }

  const stats = {
    total: rows.length,
    today: rows.filter(x => (x.created_at || '').slice(0, 10) === today()).length,
    users: new Set(rows.map(x => x.user_label).filter(Boolean)).size,
    delete: rows.filter(x => ['DELETE', 'CANCEL_PAYMENT'].includes(x.action)).length
  };

  return (
    <>
      <Header title={L('audit')}>
        <button onClick={load} className="btn bg-white border">↻</button>
      </Header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="card p-4"><p className="text-xs text-slate-400">Total actions</p><p className="text-2xl font-black">{stats.total}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-400">Aujourd’hui</p><p className="text-2xl font-black">{stats.today}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-400">{L('actor')}</p><p className="text-2xl font-black">{stats.users}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-400">Actions sensibles</p><p className="text-2xl font-black text-red-600">{stats.delete}</p></div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <select className="input max-w-xs" value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}>
          {modules.map(m => <option key={m} value={m}>{m === 'all' ? L('all') : m}</option>)}
        </select>
        <select className="input max-w-xs" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
          {actions.map(a => <option key={a} value={a}>{a === 'all' ? L('all') : docActionLabel(a)}</option>)}
        </select>
        <input className="input max-w-xs" placeholder="Recherche..." value={textFilter} onChange={e => setTextFilter(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        <table className="table w-full audit-table">
          <thead>
            <tr>
              <th>{L('date')}</th>
              <th>{L('actor')}</th>
              <th>{L('module')}</th>
              <th>{L('actions')}</th>
              <th>{L('object')}</th>
              <th>{L('detail')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(x => (
              <tr key={x.id}>
                <td>
                  <div className="font-semibold">{x.created_at ? new Date(x.created_at).toLocaleDateString('fr-FR') : '-'}</div>
                  <div className="text-xs text-slate-400">{x.created_at ? new Date(x.created_at).toLocaleTimeString('fr-FR') : ''}</div>
                </td>
                <td>{x.user_label || '-'}</td>
                <td><Badge tone="slate">{x.module || '-'}</Badge></td>
                <td><Badge tone={tone(x.action)}>{docActionLabel(x.action)}</Badge></td>
                <td className="font-semibold">{x.object_label || '-'}</td>
                <td className="text-slate-600">{x.detail || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}


function MobileAppAdmin({ L }) {
  const baseUrl = window.location.origin;
  const links = [
    {
      title: L('androidApp'),
      desc: L('androidNote'),
      href: '/mobile/drogueriepro-android.apk',
      action: L('downloadAndroid'),
      badge: 'APK'
    },
    {
      title: L('iosApp'),
      desc: L('appStoreNote'),
      href: '/mobile/drogueriepro-ios-install.html',
      action: L('downloadIos'),
      badge: 'iOS'
    },
    {
      title: L('installGuide'),
      desc: 'Guide rapide pour installer l’application mobile sur Android et iPhone.',
      href: '/mobile/README_MOBILE.html',
      action: L('installGuide'),
      badge: 'Guide'
    }
  ];

  return (
    <>
      <Header title={L('mobileAdminPortal')}>
        <a className="btn bg-white border" href={baseUrl + '/manifest.webmanifest'} target="_blank" rel="noreferrer">Manifest</a>
      </Header>

      <div className="grid md:grid-cols-3 gap-4 mb-5">
        {links.map(x => (
          <div key={x.title} className="card p-5 mobile-app-card">
            <div className="flex justify-between items-start gap-3">
              <div>
                <div className="text-xs text-slate-400">{x.badge}</div>
                <h2 className="text-lg font-black">{x.title}</h2>
              </div>
              <Badge tone={x.badge === 'APK' ? 'green' : x.badge === 'iOS' ? 'blue' : 'amber'}>{x.badge}</Badge>
            </div>
            <p className="text-sm text-slate-500 mt-3 min-h-[64px]">{x.desc}</p>
            <a className="btn bg-amber-500 w-full mt-4" href={x.href} download>{x.action}</a>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <h2 className="font-bold mb-2">Publication native</h2>
        <p className="text-sm text-slate-600">
          Le portail fournit les liens de téléchargement. Pour générer les fichiers réels :
          Android = APK/AAB via Android Studio. iOS = Archive Xcode puis TestFlight/App Store.
        </p>
        <div className="grid md:grid-cols-2 gap-3 mt-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <b>Android</b>
            <p className="text-xs text-slate-500 mt-1">Générer un APK signé et le placer dans <span className="font-mono">frontend/public/mobile/drogueriepro-android.apk</span>.</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <b>iOS</b>
            <p className="text-xs text-slate-500 mt-1">Publier via TestFlight/App Store puis mettre le lien dans <span className="font-mono">drogueriepro-ios-install.html</span>.</p>
          </div>
        </div>
      </div>
    </>
  );
}


function Settings({ L }) {
  const [settings, setSettings] = useState(null);
  const [err, setErr] = useState('');

  async function load() {
    try {
      const data = await loadSettings();
      setSettings(data);
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    try {
      await saveSettings(settings);
      alert('Paramètres enregistrés');
    } catch (e) {
      alert(e.message);
    }
  }

  if (err) return <ErrorBox msg={err} />;
  if (!settings) return <p>Chargement...</p>;

  return (
    <>
      <Header title={L('settings') || 'Paramètres'}>
        <button onClick={save} className="btn bg-amber-500">{L('save') || 'Enregistrer'}</button>
      </Header>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-bold mb-3">{L('company') || 'Société'}</h2>

          <label className="text-xs text-slate-500">{L('company') || 'Société'}
            <input className="input mt-1 mb-2" value={settings.company_name || ''} onChange={e => setSettings({ ...settings, company_name: e.target.value })} />
          </label>

          <label className="text-xs text-slate-500">{L('ice') || 'ICE'}
            <input className="input mt-1 mb-2" value={settings.company_ice || ''} onChange={e => setSettings({ ...settings, company_ice: e.target.value })} />
          </label>

          <label className="text-xs text-slate-500">{L('phone') || 'Téléphone'}
            <input className="input mt-1 mb-2" value={settings.company_phone || ''} onChange={e => setSettings({ ...settings, company_phone: e.target.value })} />
          </label>

          <label className="text-xs text-slate-500">{L('address') || 'Adresse'}
            <textarea className="input mt-1" value={settings.company_address || ''} onChange={e => setSettings({ ...settings, company_address: e.target.value })} />
          </label>
        </div>

        <div className="card p-5">
          <h2 className="font-bold mb-3">Paramètres généraux</h2>

          <label className="text-xs text-slate-500">{L('vat') || 'TVA'} %
            <input className="input mt-1 mb-2" type="number" value={settings.vat_rate || '20'} onChange={e => setSettings({ ...settings, vat_rate: e.target.value })} />
          </label>

          <label className="text-xs text-slate-500">{L('theme') || 'Thème'}
            <select className="input mt-1" value={settings.theme || 'light'} onChange={e => setSettings({ ...settings, theme: e.target.value })}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="corporate">Corporate</option>
            </select>
          </label>
        </div>
      </div>
    </>
  );
}

function Permissions({ L }) {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [rolePerms, setRolePerms] = useState([]);
  const [err, setErr] = useState('');

  async function load() {
    try {
      const data = await loadPermissionsMatrix();
      setRoles(data.roles);
      setPermissions(data.permissions);
      setRolePerms(data.rolePerms);
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  function isChecked(roleId, permissionId) {
    return rolePerms.some(x => Number(x.role_id) === Number(roleId) && Number(x.permission_id) === Number(permissionId));
  }

  async function toggle(roleId, permissionId, value) {
    try {
      await setRolePermission(roleId, permissionId, value);
      await load();
      alert('Droit mis à jour. L’utilisateur concerné doit cliquer sur Rafraîchir droits ou se reconnecter.');
    } catch (e) {
      alert(e.message);
    }
  }

  async function applySellerTemplate() {
    const seller = roles.find(r => String(r.name).toLowerCase().includes('vendeur'));
    if (!seller) return alert('Profil vendeur introuvable');

    const allowed = new Set(['dashboard.read', 'products.read', 'stock.read', 'clients.read', 'sales.read', 'sales.write', 'sales.pay', 'payments.read']);
    try {
      for (const p of permissions) {
        await setRolePermission(seller.id, p.id, allowed.has(p.code));
      }
      await load();
      alert('Profil vendeur corrigé : consultation clients uniquement.');
    } catch (e) {
      alert(e.message);
    }
  }

  if (err) return <ErrorBox msg={err} />;

  const order = ['Tableau de bord', 'Produits', 'Stock', 'Clients', 'Fournisseurs', 'Ventes', 'Achats', 'Paiements', 'Utilisateurs', 'Paramètres', 'Autorisations', 'Drogueries', 'Traçabilité', 'Divers'];
  const grouped = permissions.reduce((acc, p) => {
    const mod = p.module || 'Divers';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});

  const modules = Object.keys(grouped).sort((a, b) => order.indexOf(a) - order.indexOf(b));

  return (
    <>
      <Header title={L('permissions') || 'Autorisations'}>
        <button onClick={applySellerTemplate} className="btn bg-amber-500">Corriger profil vendeur</button>
        <button onClick={load} className="btn bg-white border">↻</button>
      </Header>

      <div className="card p-4 mb-4 text-sm text-slate-600">
        Les droits sont séparés par action : <b>consultation</b>, <b>création/modification</b>, <b>suppression</b>, <b>règlement</b>. 
        Exemple : pour un vendeur qui consulte les clients seulement, cocher <b>clients.read</b> et décocher <b>clients.write</b> / <b>clients.delete</b>.
      </div>

      <div className="card overflow-auto permissions-pro">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Module / Permission</th>
              {roles.map(r => <th key={r.id}>{r.name}</th>)}
            </tr>
          </thead>

          <tbody>
            {modules.map(mod => (
              <React.Fragment key={mod}>
                <tr>
                  <td colSpan={roles.length + 1} className="bg-slate-100 font-bold">{mod}</td>
                </tr>

                {grouped[mod].map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="font-semibold">{p.label || p.code}</div>
                      <div className="text-xs text-slate-400 font-mono">{p.code}</div>
                    </td>

                    {roles.map(r => (
                      <td key={r.id}>
                        <input type="checkbox" checked={isChecked(r.id, p.id)} onChange={e => toggle(r.id, p.id, e.target.checked)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Branches({ L }) {
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState('');

  async function load() {
    try {
      const [branches, usersData] = await Promise.all([loadBranches(), loadUsersForBranch()]);
      setRows(branches);
      setUsers(usersData);
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    try {
      await saveBranch(form);
      setForm(null);
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  async function deactivate(id) {
    if (!confirm('Désactiver cette droguerie ?')) return;

    try {
      await deleteBranch(id);
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  async function assign(userId, selectedBranchId) {
    try {
      await assignUserBranch(userId, selectedBranchId ? Number(selectedBranchId) : null);
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  if (err) return <ErrorBox msg={err} />;

  return (
    <>
      <Header title={L('branches') || 'Gestion drogueries'}>
        <button onClick={() => setForm({ name: '', city: '', address: '', phone: '', manager_name: '', active: true })} className="btn bg-amber-500">
          {L('new') || 'Nouveau'}
        </button>
      </Header>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {rows.map(b => (
          <div key={b.id} className="card p-4">
            <div className="flex justify-between gap-2">
              <div>
                <h2 className="font-bold text-lg">{b.name}</h2>
                <p className="text-sm text-slate-500">{b.city || '-'}</p>
              </div>
              <Badge tone={b.active ? 'green' : 'red'}>{b.active ? (L('active') || 'Actif') : 'Inactif'}</Badge>
            </div>

            <div className="text-sm text-slate-600 mt-3">
              <p>{L('phone') || 'Téléphone'} : {b.phone || '-'}</p>
              <p>{L('manager') || 'Responsable'} : {b.manager_name || '-'}</p>
              <p>{L('address') || 'Adresse'} : {b.address || '-'}</p>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => setForm(b)} className="btn bg-white border">{L('edit') || 'Modifier'}</button>
              <button onClick={() => deactivate(b.id)} className="btn bg-red-600 text-white">{L('deactivate') || 'Désactiver'}</button>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <h2 className="font-bold mb-3">Affectation utilisateurs / drogueries</h2>

        <Table>
          <thead>
            <tr>
              <th>{L('username') || 'Utilisateur'}</th>
              <th>{L('name') || 'Nom'}</th>
              <th>Profil</th>
              <th>{L('branch') || 'Droguerie'}</th>
            </tr>
          </thead>

          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.full_name || '-'}</td>
                <td>{u.roles?.name || '-'}</td>
                <td>
                  <select className="input" value={u.branch_id || ''} onChange={e => assign(u.id, e.target.value)}>
                    <option value="">Toutes / Aucune</option>
                    {rows.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {form ? (
        <Modal title={L('branches') || 'Droguerie'} onClose={() => setForm(null)}>
          <label className="text-xs text-slate-500">{L('name') || 'Nom'}
            <input className="input mt-1 mb-2" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
          </label>

          <label className="text-xs text-slate-500">{L('city') || 'Ville'}
            <input className="input mt-1 mb-2" value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} />
          </label>

          <label className="text-xs text-slate-500">{L('phone') || 'Téléphone'}
            <input className="input mt-1 mb-2" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </label>

          <label className="text-xs text-slate-500">{L('manager') || 'Responsable'}
            <input className="input mt-1 mb-2" value={form.manager_name || ''} onChange={e => setForm({ ...form, manager_name: e.target.value })} />
          </label>

          <label className="text-xs text-slate-500">{L('address') || 'Adresse'}
            <textarea className="input mt-1 mb-2" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} />
          </label>

          <label className="flex items-center gap-2 text-sm mb-3">
            <input type="checkbox" checked={form.active !== false} onChange={e => setForm({ ...form, active: e.target.checked })} />
            {L('active') || 'Actif'}
          </label>

          <button onClick={save} className="btn bg-amber-500">{L('save') || 'Enregistrer'}</button>
        </Modal>
      ) : null}
    </>
  );
}


createRoot(document.getElementById('root')).render(<App />);


if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.warn('SW registration failed:', err));
  });
}
