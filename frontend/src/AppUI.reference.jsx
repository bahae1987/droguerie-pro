import { useState, useEffect, createContext, useContext } from "react";
import {
  LayoutDashboard, Package, Receipt, Users, Truck, Settings as SettingsIcon,
  Plus, Search, Trash2, Pencil, AlertTriangle, TrendingUp, Printer, X,
  ShoppingCart, Boxes, Wallet, Save, Building2, Phone, MapPin,
  CheckCircle2, FileText, ArrowRight, CreditCard, ClipboardList, PackageCheck,
  HandCoins, ChevronRight, Globe
} from "lucide-react";

/* ================================================================== */
/*  Internationalisation (Français / العربية)                          */
/* ================================================================== */
const I18N = {
  fr: {
    nav_dashboard: "Tableau de bord", nav_products: "Stock & Produits", nav_sales: "Ventes",
    nav_purchases: "Achats", nav_clients: "Clients", nav_suppliers: "Fournisseurs", nav_settings: "Paramètres",
    app_tagline: "Gestion de stock & vente", loading: "Chargement de la base de données…",
    c_save: "Enregistrer", c_cancel: "Annuler", c_close: "Fermer", c_print: "Imprimer", c_date: "Date",
    c_total_ttc: "Total TTC", c_total_ht: "Total HT", c_designation: "Désignation", c_qty: "Qté",
    c_pu: "P.U.", c_amount: "Montant", references: "références",
    err_name: "Le nom est obligatoire.", err_designation: "La désignation est obligatoire.",
    err_one_product: "Ajoutez au moins un produit.",
    dash_ca_month: "CA facturé (mois)", dash_sales_today: "Ventes aujourd'hui", dash_stock_value: "Valeur du stock",
    dash_stock_alert: "Stock en alerte", dash_receivables: "Créances clients", dash_to_collect: "à encaisser",
    dash_debts: "Dettes fournisseurs", dash_to_pay: "à régler", dash_quotes_orders: "Devis / commandes",
    dash_in_progress: "en cours", dash_purchase_orders: "Commandes d'achat",
    dash_sales_7days: "Ventes facturées · 7 derniers jours", dash_stock_alerts: "Alertes de stock",
    dash_no_alert: "Aucun produit en alerte ✔", dash_manage_stock: "Gérer le stock →",
    dash_top_products: "Top produits vendus", dash_no_sale: "Pas encore de vente facturée.", dash_sold: "vendus",
    dash_last_invoices: "Dernières factures", dash_no_invoice: "Aucune facture.",
    prod_in_base: "références en base", prod_new: "Nouveau produit",
    prod_search: "Rechercher par nom ou référence…", prod_all_cats: "Toutes catégories",
    col_ref: "Réf.", col_category: "Catégorie", col_purchase: "P. achat", col_sale: "P. vente", col_stock: "Stock",
    prod_none: "Aucun produit trouvé.", prod_quick_entry: "Entrée de stock rapide",
    prod_quick_tip: "Pour un suivi complet (commande, réception, facture fournisseur), utilisez plutôt le circuit Achats.",
    pm_reference: "Référence", pm_unit: "Unité", pm_designation_req: "Désignation *", pm_category: "Catégorie",
    pm_supplier: "Fournisseur", pm_purchase_ht: "Prix d'achat HT (DH)", pm_sale_ttc: "Prix de vente TTC (DH)",
    pm_qty_stock: "Quantité en stock", pm_threshold: "Seuil d'alerte", pm_margin: "Marge indicative :",
    pm_unit_ph: "Pièce, Pot, Bidon…", pm_none: "— Aucun —", pm_new: "Nouveau produit", pm_edit: "Modifier le produit",
    se_qty_add: "Quantité à ajouter", se_stock_current: "Stock actuel :", se_add: "Ajouter au stock",
    se_insufficient: "Stock insuffisant. Disponible :",
    sales_circuit: "Circuit : Devis → Commande → Livraison → Facture → Encaissement",
    sales_new_quote: "Nouveau devis", sales_direct: "Vente directe",
    f_all: "Toutes", f_quotes: "Devis", f_orders: "Commandes", f_deliveries: "Livraisons", f_invoices: "Factures",
    f_receptions: "Réceptions",
    t_piece: "Pièce", t_client: "Client", t_supplier: "Fournisseur", t_stage: "Étape", t_payment: "Règlement",
    empty_sales: "Aucune pièce. Créez un devis ou une vente directe.",
    builder_quote: "Nouveau devis", builder_direct: "Vente directe (facture)", builder_edit_quote: "Modifier le devis",
    warn_direct: "⚠ La vente directe décrémente immédiatement le stock.",
    btn_create_quote: "Créer le devis", btn_validate_sale: "Valider la vente",
    next_to: "Passer à :", encaissement: "Encaissement client",
    purch_circuit: "Circuit : Commande → Réception → Facture fournisseur → Règlement",
    purch_order: "Bon de commande", purch_direct: "Réception directe",
    empty_purch: "Aucune pièce. Créez un bon de commande ou une réception.",
    pbld_order: "Nouveau bon de commande", pbld_direct: "Réception directe (achat)", pbld_edit: "Modifier le bon de commande",
    pbld_price_note: "Prix d'achat HT (modifiable par ligne). La TVA est ajoutée pour le total TTC.",
    warn_reception: "⚠ La réception ajoute immédiatement les quantités au stock et met à jour les prix d'achat.",
    btn_create_order: "Créer la commande", btn_validate_reception: "Valider la réception",
    reglement_fourn: "Règlement fournisseur", insufficient_for: "Stock insuffisant pour", available: "dispo",
    st_devis: "Devis", st_commande: "Commande", st_livraison: "Livraison", st_facture: "Facture", st_reception: "Réception",
    doc_devis: "DEVIS", doc_bc: "BON DE COMMANDE", doc_bl: "BON DE LIVRAISON", doc_facture: "FACTURE",
    doc_br: "BON DE RÉCEPTION", doc_ff: "FACTURE FOURNISSEUR",
    pay_unpaid: "non réglée", pay_partial: "partielle", pay_paid: "réglée", pay_rest: "reste",
    step_encaissement: "Encaissement", step_reglement: "Règlement",
    le_product: "Produit", le_choose: "— Choisir un produit —", le_stock: "stock", le_no_lines: "Aucune ligne.",
    dp_invoice_words: "Arrêtée la présente facture à la somme de :", dp_payments: "Règlements :",
    dp_settled: "Soldée", dp_remaining: "Reste",
    pmod_already: "Déjà réglé", pmod_remaining: "Reste à payer", pmod_amount: "Montant (DH)",
    pmod_mode: "Mode de règlement", pmod_save: "Enregistrer le règlement",
    cl_count: "client(s)", sup_count: "fournisseur(s)", cl_new: "Nouveau client", sup_new: "Nouveau fournisseur",
    person_type: "Type", type_part: "Particulier", type_ent: "Entreprise", person_contact: "Personne de contact",
    person_phone: "Téléphone", person_city: "Ville", person_address: "Adresse", person_name_req: "Nom / Raison sociale *",
    person_edit: "Modifier",
    conf_del_product: "Supprimer ce produit ?", conf_del_client: "Supprimer ce client ?",
    conf_del_supplier: "Supprimer ce fournisseur ?",
    conf_del_sale: "Supprimer cette pièce ? Le stock livré sera restitué.",
    conf_del_purchase: "Supprimer cette pièce ? Le stock reçu sera retiré.",
    set_subtitle: "Informations de l'entreprise (apparaissent sur toutes les pièces)",
    set_company: "Nom de l'entreprise", set_rc: "RC (Registre du commerce)", set_address: "Adresse",
    set_city: "Ville", set_phone: "Téléphone", set_tva: "Taux de TVA (%)", set_saved: "Enregistré",
    set_numbering: "La numérotation des pièces (devis, factures, etc.) est gérée automatiquement par séries annuelles.",
    tip_edit: "Modifier", tip_view: "Voir / Imprimer", tip_delete: "Supprimer", tip_pay: "Enregistrer un règlement",
    tip_quick_entry: "Entrée de stock rapide",
  },
  ar: {
    nav_dashboard: "لوحة القيادة", nav_products: "المخزون والمنتجات", nav_sales: "المبيعات",
    nav_purchases: "المشتريات", nav_clients: "العملاء", nav_suppliers: "الموردون", nav_settings: "الإعدادات",
    app_tagline: "تدبير المخزون والمبيعات", loading: "جاري تحميل قاعدة البيانات…",
    c_save: "حفظ", c_cancel: "إلغاء", c_close: "إغلاق", c_print: "طباعة", c_date: "التاريخ",
    c_total_ttc: "المجموع شامل الضريبة", c_total_ht: "المجموع بدون ضريبة", c_designation: "البيان", c_qty: "الكمية",
    c_pu: "السعر", c_amount: "المبلغ", references: "مرجع",
    err_name: "الاسم إجباري.", err_designation: "البيان إجباري.", err_one_product: "أضف منتجا واحدا على الأقل.",
    dash_ca_month: "رقم المعاملات (الشهر)", dash_sales_today: "مبيعات اليوم", dash_stock_value: "قيمة المخزون",
    dash_stock_alert: "مخزون في حالة تنبيه", dash_receivables: "ديون العملاء", dash_to_collect: "للتحصيل",
    dash_debts: "ديون الموردين", dash_to_pay: "للأداء", dash_quotes_orders: "عروض / طلبيات",
    dash_in_progress: "قيد الإنجاز", dash_purchase_orders: "طلبيات الشراء",
    dash_sales_7days: "المبيعات المفوترة · آخر 7 أيام", dash_stock_alerts: "تنبيهات المخزون",
    dash_no_alert: "لا يوجد منتج في حالة تنبيه ✔", dash_manage_stock: "← تدبير المخزون",
    dash_top_products: "أكثر المنتجات مبيعا", dash_no_sale: "لا توجد مبيعات مفوترة بعد.", dash_sold: "مباع",
    dash_last_invoices: "آخر الفواتير", dash_no_invoice: "لا توجد فاتورة.",
    prod_in_base: "مرجع في القاعدة", prod_new: "منتج جديد",
    prod_search: "البحث بالاسم أو المرجع…", prod_all_cats: "كل الفئات",
    col_ref: "المرجع", col_category: "الفئة", col_purchase: "ثمن الشراء", col_sale: "ثمن البيع", col_stock: "المخزون",
    prod_none: "لم يتم العثور على منتج.", prod_quick_entry: "إدخال سريع للمخزون",
    prod_quick_tip: "للتتبع الكامل (طلبية، استلام، فاتورة المورد) استعمل دورة المشتريات.",
    pm_reference: "المرجع", pm_unit: "الوحدة", pm_designation_req: "البيان *", pm_category: "الفئة",
    pm_supplier: "المورد", pm_purchase_ht: "ثمن الشراء بدون ضريبة (د.م)", pm_sale_ttc: "ثمن البيع شامل الضريبة (د.م)",
    pm_qty_stock: "الكمية في المخزون", pm_threshold: "حد التنبيه", pm_margin: "الهامش التقريبي:",
    pm_unit_ph: "قطعة، علبة، بيدون…", pm_none: "— لا شيء —", pm_new: "منتج جديد", pm_edit: "تعديل المنتج",
    se_qty_add: "الكمية المراد إضافتها", se_stock_current: "المخزون الحالي:", se_add: "إضافة إلى المخزون",
    se_insufficient: "المخزون غير كاف. المتوفر:",
    sales_circuit: "الدورة: عرض ثمن ← طلبية ← تسليم ← فاتورة ← تحصيل",
    sales_new_quote: "عرض ثمن جديد", sales_direct: "بيع مباشر",
    f_all: "الكل", f_quotes: "عروض الثمن", f_orders: "الطلبيات", f_deliveries: "التسليمات", f_invoices: "الفواتير",
    f_receptions: "الاستلامات",
    t_piece: "الوثيقة", t_client: "العميل", t_supplier: "المورد", t_stage: "المرحلة", t_payment: "الأداء",
    empty_sales: "لا توجد وثيقة. أنشئ عرض ثمن أو بيعا مباشرا.",
    builder_quote: "عرض ثمن جديد", builder_direct: "بيع مباشر (فاتورة)", builder_edit_quote: "تعديل عرض الثمن",
    warn_direct: "⚠ البيع المباشر يخصم من المخزون فورا.",
    btn_create_quote: "إنشاء عرض الثمن", btn_validate_sale: "تأكيد البيع",
    next_to: "الانتقال إلى:", encaissement: "تحصيل من العميل",
    purch_circuit: "الدورة: طلبية ← استلام ← فاتورة المورد ← أداء",
    purch_order: "سند طلبية", purch_direct: "استلام مباشر",
    empty_purch: "لا توجد وثيقة. أنشئ سند طلبية أو استلاما.",
    pbld_order: "سند طلبية جديد", pbld_direct: "استلام مباشر (شراء)", pbld_edit: "تعديل سند الطلبية",
    pbld_price_note: "ثمن الشراء بدون ضريبة (قابل للتعديل في كل سطر). تضاف الضريبة لاحتساب المجموع شامل الضريبة.",
    warn_reception: "⚠ الاستلام يضيف الكميات فورا إلى المخزون ويحدّث أثمنة الشراء.",
    btn_create_order: "إنشاء الطلبية", btn_validate_reception: "تأكيد الاستلام",
    reglement_fourn: "أداء للمورد", insufficient_for: "المخزون غير كاف لـ", available: "المتوفر",
    st_devis: "عرض ثمن", st_commande: "طلبية", st_livraison: "تسليم", st_facture: "فاتورة", st_reception: "استلام",
    doc_devis: "عرض ثمن", doc_bc: "سند طلبية", doc_bl: "سند تسليم", doc_facture: "فاتورة",
    doc_br: "سند استلام", doc_ff: "فاتورة المورد",
    pay_unpaid: "غير مؤداة", pay_partial: "جزئية", pay_paid: "مؤداة", pay_rest: "يتبقى",
    step_encaissement: "تحصيل", step_reglement: "أداء",
    le_product: "المنتج", le_choose: "— اختر منتجا —", le_stock: "المخزون", le_no_lines: "لا توجد أسطر.",
    dp_invoice_words: "حُرّرت هذه الفاتورة بمبلغ:", dp_payments: "الأداءات:",
    dp_settled: "مسدّدة", dp_remaining: "يتبقى",
    pmod_already: "المؤدى", pmod_remaining: "المتبقى للأداء", pmod_amount: "المبلغ (د.م)",
    pmod_mode: "طريقة الأداء", pmod_save: "حفظ الأداء",
    cl_count: "عميل", sup_count: "مورد", cl_new: "عميل جديد", sup_new: "مورد جديد",
    person_type: "النوع", type_part: "فرد", type_ent: "شركة", person_contact: "شخص الاتصال",
    person_phone: "الهاتف", person_city: "المدينة", person_address: "العنوان", person_name_req: "الاسم / التسمية التجارية *",
    person_edit: "تعديل",
    conf_del_product: "حذف هذا المنتج؟", conf_del_client: "حذف هذا العميل؟",
    conf_del_supplier: "حذف هذا المورد؟",
    conf_del_sale: "حذف هذه الوثيقة؟ ستتم إعادة المخزون المسلَّم.",
    conf_del_purchase: "حذف هذه الوثيقة؟ سيُسحب المخزون المستلَم.",
    set_subtitle: "معلومات المقاولة (تظهر على جميع الوثائق)",
    set_company: "اسم المقاولة", set_rc: "السجل التجاري", set_address: "العنوان",
    set_city: "المدينة", set_phone: "الهاتف", set_tva: "نسبة الضريبة (%)", set_saved: "تم الحفظ",
    set_numbering: "يتم ترقيم الوثائق (عروض الثمن، الفواتير…) تلقائيا حسب سلاسل سنوية.",
    tip_edit: "تعديل", tip_view: "عرض / طباعة", tip_delete: "حذف", tip_pay: "تسجيل أداء",
    tip_quick_entry: "إدخال سريع للمخزون",
  },
};
const CAT_LABELS = {
  fr: { Peinture: "Peinture", Quincaillerie: "Quincaillerie", Plomberie: "Plomberie", "Électricité": "Électricité", Outillage: "Outillage", "Produits d'entretien": "Produits d'entretien", "Colles & Mastics": "Colles & Mastics", Divers: "Divers" },
  ar: { Peinture: "دهان", Quincaillerie: "خردوات", Plomberie: "سباكة", "Électricité": "كهرباء", Outillage: "عدة وأدوات", "Produits d'entretien": "مواد التنظيف", "Colles & Mastics": "الغراء والمعجون", Divers: "متنوع" },
};
const PAY_LABELS = {
  fr: { "Espèces": "Espèces", "Chèque": "Chèque", "Virement": "Virement", "Carte": "Carte", "Effet": "Effet", "Crédit": "Crédit" },
  ar: { "Espèces": "نقدا", "Chèque": "شيك", "Virement": "تحويل", "Carte": "بطاقة", "Effet": "كمبيالة", "Crédit": "آجل" },
};
const PAY_KEYS = ["Espèces", "Chèque", "Virement", "Carte", "Effet", "Crédit"];

const I18nContext = createContext(null);
function useI18n() { return useContext(I18nContext); }

/* ================================================================== */
/*  Base de données persistante                                        */
/* ================================================================== */
const KEYS = {
  products: "droguerie_products", clients: "droguerie_clients", suppliers: "droguerie_suppliers",
  sales: "droguerie_sales", purchases: "droguerie_purchases", settings: "droguerie_settings",
  legacyInvoices: "droguerie_invoices",
};
async function loadKey(key, fb) { try { if (!window.storage) return fb; const r = await window.storage.get(key); return r ? JSON.parse(r.value) : fb; } catch { return fb; } }
async function saveKey(key, v) { try { if (!window.storage) return; await window.storage.set(key, JSON.stringify(v)); } catch (e) { console.error(e); } }
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/* ================================================================== */
/*  Utilitaires                                                        */
/* ================================================================== */
const fmt = (n) => (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDH = (n) => fmt(n) + " DH";
const todayISO = () => new Date().toISOString().slice(0, 10);
function computeTotaux(lignes, taux, ttc) {
  const base = lignes.reduce((s, l) => s + (Number(l.prixUnit) || 0) * (Number(l.qte) || 0), 0);
  if (ttc) { const t = base, ht = t / (1 + taux / 100); return { totalHT: ht, tva: t - ht, totalTTC: t }; }
  const ht = base, tva = ht * taux / 100; return { totalHT: ht, tva, totalTTC: ht + tva };
}
function reglement(doc) {
  const paye = (doc.paiements || []).reduce((s, p) => s + (Number(p.montant) || 0), 0);
  const reste = (doc.totalTTC || 0) - paye;
  return { paye, reste: Math.max(0, reste), statut: paye <= 0.001 ? "non réglée" : reste <= 0.01 ? "réglée" : "partielle" };
}

/* Montant en lettres : Français */
function lettresFR(n) {
  n = Math.floor(n); if (n === 0) return "zéro";
  const u = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "", "quatre-vingt", ""];
  const b100 = (x) => { if (x < 20) return u[x]; const t = Math.floor(x / 10), r = x % 10; if (t === 7) return "soixante" + (r === 1 ? "-et-" : "-") + u[10 + r]; if (t === 9) return "quatre-vingt-" + u[10 + r]; let w = tens[t]; if (r === 1 && t !== 8) w += "-et-un"; else if (r > 0) w += "-" + u[r]; if (t === 8 && r === 0) w += "s"; return w; };
  const b1000 = (x) => { if (x < 100) return b100(x); const c = Math.floor(x / 100), r = x % 100; let w = c === 1 ? "cent" : u[c] + " cent"; if (c > 1 && r === 0) w += "s"; if (r > 0) w += " " + b100(r); return w; };
  let res = ""; const mil = Math.floor(n / 1000000); n %= 1000000; const k = Math.floor(n / 1000); n %= 1000;
  if (mil > 0) res += (mil === 1 ? "un million" : b1000(mil) + " millions") + " ";
  if (k > 0) res += (k === 1 ? "mille" : b1000(k) + " mille") + " ";
  if (n > 0) res += b1000(n); return res.trim();
}
/* Montant en lettres : Arabe (تفقيط) */
function lettresAR(n) {
  n = Math.floor(n); if (n === 0) return "صفر";
  const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
  const tens = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  const hund = ["", "مائة", "مئتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];
  const b100 = (x) => { if (x < 20) return ones[x]; const t = Math.floor(x / 10), r = x % 10; return r === 0 ? tens[t] : ones[r] + " و" + tens[t]; };
  const b1000 = (x) => { if (x < 100) return b100(x); const c = Math.floor(x / 100), r = x % 100; return r === 0 ? hund[c] : hund[c] + " و" + b100(r); };
  const parts = []; const mil = Math.floor(n / 1000000); n %= 1000000; const th = Math.floor(n / 1000); n %= 1000;
  if (mil > 0) parts.push(mil === 1 ? "مليون" : mil === 2 ? "مليونان" : b1000(mil) + " مليون");
  if (th > 0) { if (th === 1) parts.push("ألف"); else if (th === 2) parts.push("ألفان"); else if (th <= 10) parts.push(b1000(th) + " آلاف"); else parts.push(b1000(th) + " ألف"); }
  if (n > 0) parts.push(b1000(n));
  return parts.join(" و");
}
function montantLettres(total, lang) {
  const dh = Math.floor(total), cts = Math.round((total - dh) * 100);
  if (lang === "ar") { let s = lettresAR(dh) + " درهم"; if (cts > 0) s += " و" + lettresAR(cts) + " سنتيم"; return s; }
  let s = lettresFR(dh) + " dirham" + (dh > 1 ? "s" : ""); if (cts > 0) s += " et " + lettresFR(cts) + " centime" + (cts > 1 ? "s" : "");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const CATEGORIES = ["Peinture", "Quincaillerie", "Plomberie", "Électricité", "Outillage", "Produits d'entretien", "Colles & Mastics", "Divers"];

const SALE_STAGES = [
  { id: "devis", numKey: "devis", prefix: "DEV", counter: "devis", titreKey: "doc_devis", courtKey: "st_devis" },
  { id: "commande", numKey: "commande", prefix: "BC", counter: "commande", titreKey: "doc_bc", courtKey: "st_commande" },
  { id: "livraison", numKey: "bl", prefix: "BL", counter: "bl", titreKey: "doc_bl", courtKey: "st_livraison" },
  { id: "facture", numKey: "facture", prefix: "FAC", counter: "facture", titreKey: "doc_facture", courtKey: "st_facture" },
];
const PURCHASE_STAGES = [
  { id: "commande", numKey: "commande", prefix: "CF", counter: "cf", titreKey: "doc_bc", courtKey: "st_commande" },
  { id: "reception", numKey: "reception", prefix: "BR", counter: "br", titreKey: "doc_br", courtKey: "st_reception" },
  { id: "facture", numKey: "facture", prefix: "FF", counter: "ff", titreKey: "doc_ff", courtKey: "st_facture" },
];
const stageIndex = (stages, id) => stages.findIndex((s) => s.id === id);

/* ================================================================== */
/*  Données de démarrage                                               */
/* ================================================================== */
function seedData() {
  const sup = [
    { id: uid(), nom: "Sté Maghreb Peintures", ice: "001234567000045", tel: "0522-45-12-00", ville: "Casablanca", contact: "M. Alami" },
    { id: uid(), nom: "Quincaillerie Atlas", ice: "002345678000067", tel: "0524-33-78-90", ville: "Marrakech", contact: "M. Bouzid" },
    { id: uid(), nom: "ElecPro Distribution", ice: "003456789000012", tel: "0537-66-44-22", ville: "Rabat", contact: "Mme Idrissi" },
  ];
  const cli = [
    { id: uid(), nom: "Client comptoir", type: "particulier", ice: "", tel: "", ville: "", adresse: "" },
    { id: uid(), nom: "Ets Bennani BTP", type: "entreprise", ice: "001987654000033", tel: "0661-22-33-44", ville: "Marrakech", adresse: "Sidi Ghanem" },
    { id: uid(), nom: "Ménara Construction", type: "entreprise", ice: "004112233000088", tel: "0524-11-22-33", ville: "Marrakech", adresse: "Av. Hassan II" },
  ];
  const p = (ref, nom, cat, pa, pv, q, min, unite) => ({ id: uid(), ref, nom, categorie: cat, fournisseurId: "", prixAchat: pa, prixVente: pv, quantite: q, stockMin: min, unite });
  const prod = [
    p("PEI-001", "Peinture acrylique blanche 20L", "Peinture", 280, 380, 24, 5, "Pot"),
    p("PEI-002", "Diluant white spirit 5L", "Peinture", 45, 65, 40, 8, "Bidon"),
    p("PEI-003", "Rouleau peinture 18cm", "Peinture", 12, 22, 120, 20, "Pièce"),
    p("PEI-004", "Pinceau plat 50mm", "Peinture", 8, 16, 80, 15, "Pièce"),
    p("QUI-001", "Vis aggloméré 4x40 (boîte 200)", "Quincaillerie", 18, 30, 60, 10, "Boîte"),
    p("QUI-002", "Cheville nylon S6 (sachet 100)", "Quincaillerie", 9, 18, 3, 10, "Sachet"),
    p("PLO-001", "Tube PVC Ø100 (barre 4m)", "Plomberie", 35, 55, 45, 10, "Barre"),
    p("PLO-002", "Robinet mélangeur évier", "Plomberie", 120, 190, 15, 4, "Pièce"),
    p("ELE-001", "Fil électrique 2.5mm² (rouleau 100m)", "Électricité", 140, 210, 18, 5, "Rouleau"),
    p("ELE-002", "Disjoncteur 16A", "Électricité", 38, 60, 50, 12, "Pièce"),
    p("OUT-001", "Perceuse à percussion 650W", "Outillage", 320, 450, 8, 3, "Pièce"),
    p("OUT-002", "Mètre ruban 5m", "Outillage", 15, 28, 2, 8, "Pièce"),
    p("ENT-001", "Eau de javel 5L", "Produits d'entretien", 12, 22, 90, 20, "Bidon"),
    p("COL-001", "Colle blanche menuisier 1kg", "Colles & Mastics", 14, 25, 35, 10, "Pot"),
    p("COL-002", "Mastic silicone transparent", "Colles & Mastics", 16, 30, 4, 12, "Cartouche"),
  ];
  prod[0].fournisseurId = sup[0].id; prod[4].fournisseurId = sup[1].id; prod[8].fournisseurId = sup[2].id;
  const settings = { nomEntreprise: "Droguerie Al Baraka", ice: "002456789000045", rc: "45821", adresse: "N°12, Avenue Mohammed V", ville: "Marrakech", tel: "0524-44-55-66", tva: 20, lang: "fr", compteurs: { devis: 1, commande: 1, bl: 1, facture: 1, cf: 1, br: 1, ff: 1 } };
  return { sup, cli, prod, settings };
}

/* ================================================================== */
/*  UI réutilisable                                                    */
/* ================================================================== */
function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 overflow-y-auto">
      <div className={`bg-white rounded-xl shadow-2xl w-full ${wide ? "max-w-3xl" : "max-w-lg"} my-8`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200"><h3 className="font-semibold text-slate-800">{title}</h3><button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={20} /></button></div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
function Field({ label, children }) { return <label className="block"><span className="text-xs font-medium text-slate-500 mb-1 block">{label}</span>{children}</label>; }
const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100";
const btnPrimary = "flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm";

function StatCard({ icon: Icon, label, value, sub, tone = "slate" }) {
  const tones = { slate: "bg-slate-100 text-slate-600", amber: "bg-amber-100 text-amber-700", emerald: "bg-emerald-100 text-emerald-700", red: "bg-red-100 text-red-600", blue: "bg-sky-100 text-sky-700" };
  return <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-500">{label}</span><span className={`p-1.5 rounded-lg ${tones[tone]}`}><Icon size={16} /></span></div><div className="mt-2 text-2xl font-bold text-slate-800 font-mono tracking-tight">{value}</div>{sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}</div>;
}
function Header({ title, subtitle, action }) { return <div className="flex items-end justify-between mb-6 gap-4"><div><h1 className="text-2xl font-bold text-slate-800">{title}</h1>{subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}</div>{action}</div>; }
const Row = ({ label, value }) => <div className="flex justify-between text-slate-500"><span>{label}</span><span className="font-mono">{value}</span></div>;

function StageBadge({ stages, stage }) {
  const { t } = useI18n();
  const s = stages.find((x) => x.id === stage);
  const tone = stage === "facture" ? "bg-emerald-100 text-emerald-700" : stage === "devis" || stage === "commande" ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-700";
  return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${tone}`}>{t(s?.courtKey)}</span>;
}
function PayBadge({ doc }) {
  const { t } = useI18n(); const r = reglement(doc);
  const map = { "réglée": "pay_paid", "partielle": "pay_partial", "non réglée": "pay_unpaid" };
  const tone = r.statut === "réglée" ? "bg-emerald-100 text-emerald-700" : r.statut === "partielle" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600";
  return <span className={`text-[11px] px-2 py-0.5 rounded-full ${tone}`}>{t(map[r.statut])}{r.statut === "partielle" && ` · ${t("pay_rest")} ${fmt(r.reste)}`}</span>;
}

/* ================================================================== */
/*  Application principale                                             */
/* ================================================================== */
export default function App() {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    (async () => {
      let prod = await loadKey(KEYS.products, null);
      if (!prod) {
        const s = seedData();
        await saveKey(KEYS.products, s.prod); await saveKey(KEYS.clients, s.cli); await saveKey(KEYS.suppliers, s.sup);
        await saveKey(KEYS.sales, []); await saveKey(KEYS.purchases, []); await saveKey(KEYS.settings, s.settings);
        setProducts(s.prod); setClients(s.cli); setSuppliers(s.sup); setSales([]); setPurchases([]); setSettings(s.settings);
      } else {
        let st = await loadKey(KEYS.settings, seedData().settings);
        if (!st.compteurs) st = { ...st, compteurs: { devis: 1, commande: 1, bl: 1, facture: st.prochainNumero || 1, cf: 1, br: 1, ff: 1 } };
        if (!st.lang) st = { ...st, lang: "fr" };
        let sl = await loadKey(KEYS.sales, null);
        if (!sl) {
          const old = await loadKey(KEYS.legacyInvoices, []);
          sl = old.map((i) => ({ id: i.id, date: i.date, clientId: i.clientId, clientNom: i.clientNom, clientIce: i.clientIce, lignes: i.lignes, tauxTva: i.tauxTva || 20, totalHT: i.sousTotalHT, tva: i.tva, totalTTC: i.totalTTC, stage: "facture", numeros: { facture: i.numero }, livre: true, paiements: i.statut === "payée" ? [{ id: uid(), date: i.date, montant: i.totalTTC, mode: i.paiement || "Espèces" }] : [] }));
          await saveKey(KEYS.sales, sl);
        }
        setProducts(prod); setClients(await loadKey(KEYS.clients, [])); setSuppliers(await loadKey(KEYS.suppliers, []));
        setSales(sl); setPurchases(await loadKey(KEYS.purchases, [])); setSettings(st);
      }
      setLoading(false);
    })();
  }, []);

  const persist = {
    products: (v) => { setProducts(v); saveKey(KEYS.products, v); },
    clients: (v) => { setClients(v); saveKey(KEYS.clients, v); },
    suppliers: (v) => { setSuppliers(v); saveKey(KEYS.suppliers, v); },
    sales: (v) => { setSales(v); saveKey(KEYS.sales, v); },
    purchases: (v) => { setPurchases(v); saveKey(KEYS.purchases, v); },
    settings: (v) => { setSettings(v); saveKey(KEYS.settings, v); },
  };

  if (loading || !settings) {
    const loadTxt = (settings?.lang === "ar") ? I18N.ar.loading : I18N.fr.loading;
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500"><div className="text-center"><Boxes className="mx-auto mb-3 animate-pulse text-amber-500" size={40} />{loadTxt}</div></div>;
  }

  const lang = settings.lang || "fr";
  const dir = lang === "ar" ? "rtl" : "ltr";
  const locale = lang === "ar" ? "ar-MA" : "fr-FR";
  const i18n = {
    lang, dir, locale,
    t: (k) => (I18N[lang]?.[k] ?? I18N.fr[k] ?? k),
    tCat: (c) => CAT_LABELS[lang]?.[c] || c,
    tPay: (m) => PAY_LABELS[lang]?.[m] || m,
    money: montantLettres,
  };
  const setLang = (l) => persist.settings({ ...settings, lang: l });

  const lowStock = products.filter((p) => p.quantite <= p.stockMin);
  const nav = [
    { id: "dashboard", k: "nav_dashboard", icon: LayoutDashboard },
    { id: "products", k: "nav_products", icon: Package },
    { id: "sales", k: "nav_sales", icon: Receipt },
    { id: "purchases", k: "nav_purchases", icon: ShoppingCart },
    { id: "clients", k: "nav_clients", icon: Users },
    { id: "suppliers", k: "nav_suppliers", icon: Truck },
    { id: "settings", k: "nav_settings", icon: SettingsIcon },
  ];

  return (
    <I18nContext.Provider value={i18n}>
      <div dir={dir} className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
        <aside className="w-60 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen">
          <div className="px-5 py-5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500 text-slate-900 w-9 h-9 rounded-lg grid place-items-center font-bold">DP</span>
              <div><div className="font-bold text-white leading-tight">Droguerie<span className="text-amber-500">Pro</span></div><div className="text-[11px] text-slate-500">{i18n.t("app_tagline")}</div></div>
            </div>
            <div className="mt-4 flex bg-slate-800 rounded-lg p-0.5 text-xs">
              <button onClick={() => setLang("fr")} className={`flex-1 py-1.5 rounded-md font-medium transition ${lang === "fr" ? "bg-amber-500 text-slate-900" : "text-slate-400"}`}>Français</button>
              <button onClick={() => setLang("ar")} className={`flex-1 py-1.5 rounded-md font-medium transition ${lang === "ar" ? "bg-amber-500 text-slate-900" : "text-slate-400"}`}>العربية</button>
            </div>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {nav.map((n) => (
              <button key={n.id} onClick={() => setView(n.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${view === n.id ? "bg-amber-500 text-slate-900 font-semibold" : "hover:bg-slate-800 text-slate-300"}`}>
                <n.icon size={18} />{i18n.t(n.k)}
                {n.id === "products" && lowStock.length > 0 && <span className={`ms-auto text-[11px] px-1.5 rounded-full ${view === n.id ? "bg-slate-900 text-amber-400" : "bg-red-500 text-white"}`}>{lowStock.length}</span>}
              </button>
            ))}
          </nav>
          <div className="px-5 py-4 border-t border-slate-800 text-[11px] text-slate-500">{settings.nomEntreprise}<br />ICE : {settings.ice}</div>
        </aside>

        <main className="flex-1 min-w-0">
          {view === "dashboard" && <Dashboard products={products} sales={sales} purchases={purchases} lowStock={lowStock} goTo={setView} />}
          {view === "products" && <Products products={products} suppliers={suppliers} persist={persist} />}
          {view === "sales" && <Sales sales={sales} clients={clients} products={products} settings={settings} persist={persist} />}
          {view === "purchases" && <Purchases purchases={purchases} suppliers={suppliers} products={products} settings={settings} persist={persist} />}
          {view === "clients" && <Clients clients={clients} persist={persist} />}
          {view === "suppliers" && <Suppliers suppliers={suppliers} persist={persist} />}
          {view === "settings" && <SettingsView settings={settings} persist={persist} />}
        </main>
      </div>
    </I18nContext.Provider>
  );
}

/* ================================================================== */
/*  Tableau de bord                                                    */
/* ================================================================== */
function Dashboard({ products, sales, purchases, lowStock, goTo }) {
  const { t, locale } = useI18n();
  const month = todayISO().slice(0, 7), today = todayISO();
  const factures = sales.filter((s) => s.stage === "facture");
  const caMonth = factures.filter((s) => s.date.slice(0, 7) === month).reduce((a, s) => a + s.totalTTC, 0);
  const caToday = factures.filter((s) => s.date === today).reduce((a, s) => a + s.totalTTC, 0);
  const stockValue = products.reduce((a, p) => a + p.quantite * p.prixAchat, 0);
  const creances = factures.reduce((a, s) => a + reglement(s).reste, 0);
  const dettes = purchases.filter((p) => p.stage === "facture").reduce((a, p) => a + reglement(p).reste, 0);
  const devisEnCours = sales.filter((s) => s.stage !== "facture").length;
  const cmdAchat = purchases.filter((p) => p.stage !== "facture").length;
  const days = [...Array(7)].map((_, idx) => { const d = new Date(); d.setDate(d.getDate() - (6 - idx)); const iso = d.toISOString().slice(0, 10); return { label: d.toLocaleDateString(locale, { weekday: "short" }), iso, total: factures.filter((s) => s.date === iso).reduce((a, s) => a + s.totalTTC, 0) }; });
  const maxDay = Math.max(1, ...days.map((d) => d.total));
  const sold = {}; factures.forEach((s) => s.lignes.forEach((l) => { sold[l.nom] = (sold[l.nom] || 0) + l.qte; }));
  const topProd = Object.entries(sold).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Header title={t("nav_dashboard")} subtitle={new Date().toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard icon={Wallet} label={t("dash_ca_month")} value={fmtDH(caMonth)} tone="emerald" />
        <StatCard icon={TrendingUp} label={t("dash_sales_today")} value={fmtDH(caToday)} tone="amber" />
        <StatCard icon={Boxes} label={t("dash_stock_value")} value={fmtDH(stockValue)} sub={`${products.length} ${t("references")}`} />
        <StatCard icon={AlertTriangle} label={t("dash_stock_alert")} value={lowStock.length} tone={lowStock.length ? "red" : "slate"} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={HandCoins} label={t("dash_receivables")} value={fmtDH(creances)} tone={creances ? "red" : "slate"} sub={t("dash_to_collect")} />
        <StatCard icon={CreditCard} label={t("dash_debts")} value={fmtDH(dettes)} tone={dettes ? "red" : "slate"} sub={t("dash_to_pay")} />
        <StatCard icon={ClipboardList} label={t("dash_quotes_orders")} value={devisEnCours} tone="blue" sub={t("dash_in_progress")} />
        <StatCard icon={ShoppingCart} label={t("dash_purchase_orders")} value={cmdAchat} tone="blue" sub={t("dash_in_progress")} />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-700 mb-4 text-sm">{t("dash_sales_7days")}</h3>
          <div className="flex items-end gap-3 h-44">
            {days.map((d) => (<div key={d.iso} className="flex-1 flex flex-col items-center gap-1"><div className="text-[10px] text-slate-400 font-mono">{d.total > 0 ? Math.round(d.total) : ""}</div><div className="w-full bg-slate-100 rounded-t-md flex items-end" style={{ height: "100%" }}><div className="w-full bg-amber-400 rounded-t-md transition-all" style={{ height: `${(d.total / maxDay) * 100}%` }} /></div><div className="text-[11px] text-slate-500">{d.label}</div></div>))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-slate-700 text-sm">{t("dash_stock_alerts")}</h3>{lowStock.length > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{lowStock.length}</span>}</div>
          {lowStock.length === 0 ? <p className="text-sm text-slate-400">{t("dash_no_alert")}</p> : <ul className="space-y-2">{lowStock.slice(0, 6).map((p) => <li key={p.id} className="flex items-center justify-between text-sm"><span className="text-slate-700 truncate pe-2">{p.nom}</span><span className="font-mono text-red-600 shrink-0">{p.quantite}/{p.stockMin}</span></li>)}</ul>}
          <button onClick={() => goTo("products")} className="mt-4 text-xs text-amber-600 font-medium hover:underline">{t("dash_manage_stock")}</button>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5"><h3 className="font-semibold text-slate-700 mb-3 text-sm">{t("dash_top_products")}</h3>{topProd.length === 0 ? <p className="text-sm text-slate-400">{t("dash_no_sale")}</p> : <ul className="space-y-2">{topProd.map(([nom, qte]) => <li key={nom} className="flex items-center justify-between text-sm"><span className="text-slate-700 truncate pe-2">{nom}</span><span className="font-mono text-slate-500">{qte} {t("dash_sold")}</span></li>)}</ul>}</div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><h3 className="font-semibold text-slate-700 mb-3 text-sm">{t("dash_last_invoices")}</h3>{factures.length === 0 ? <p className="text-sm text-slate-400">{t("dash_no_invoice")}</p> : <ul className="space-y-2">{[...factures].slice(-5).reverse().map((i) => <li key={i.id} className="flex items-center justify-between text-sm"><span className="font-mono text-slate-600">{i.numeros.facture}</span><span className="text-slate-400 truncate px-2">{i.clientNom}</span><span className="font-mono font-semibold text-slate-700">{fmtDH(i.totalTTC)}</span></li>)}</ul>}</div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Produits / Stock                                                   */
/* ================================================================== */
function Products({ products, suppliers, persist }) {
  const { t, tCat } = useI18n();
  const [q, setQ] = useState(""); const [cat, setCat] = useState("");
  const [editing, setEditing] = useState(null); const [entry, setEntry] = useState(null);
  const filtered = products.filter((p) => (!q || p.nom.toLowerCase().includes(q.toLowerCase()) || p.ref.toLowerCase().includes(q.toLowerCase())) && (!cat || p.categorie === cat));
  const save = (d) => { d.id ? persist.products(products.map((p) => p.id === d.id ? d : p)) : persist.products([...products, { ...d, id: uid() }]); setEditing(null); };
  const remove = (id) => { if (confirm(t("conf_del_product"))) persist.products(products.filter((p) => p.id !== id)); };
  const addStock = (id, qty) => { persist.products(products.map((p) => p.id === id ? { ...p, quantite: p.quantite + qty } : p)); setEntry(null); };
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Header title={t("nav_products")} subtitle={`${products.length} ${t("prod_in_base")}`} action={<button onClick={() => setEditing({})} className={btnPrimary}><Plus size={16} />{t("prod_new")}</button>} />
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]"><Search size={16} className="absolute start-3 top-2.5 text-slate-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("prod_search")} className={inputCls + " ps-9"} /></div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className={inputCls + " max-w-[200px]"}><option value="">{t("prod_all_cats")}</option>{CATEGORIES.map((c) => <option key={c} value={c}>{tCat(c)}</option>)}</select>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase"><tr><th className="text-start px-4 py-3 font-medium">{t("col_ref")}</th><th className="text-start px-4 py-3 font-medium">{t("c_designation")}</th><th className="text-start px-4 py-3 font-medium">{t("col_category")}</th><th className="text-end px-4 py-3 font-medium">{t("col_purchase")}</th><th className="text-end px-4 py-3 font-medium">{t("col_sale")}</th><th className="text-center px-4 py-3 font-medium">{t("col_stock")}</th><th className="px-4 py-3"></th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((p) => { const low = p.quantite <= p.stockMin; return (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.ref}</td>
                <td className="px-4 py-3 font-medium text-slate-700">{p.nom}<span className="text-slate-400 font-normal"> · {p.unite}</span></td>
                <td className="px-4 py-3 text-slate-500">{tCat(p.categorie)}</td>
                <td className="px-4 py-3 text-end font-mono text-slate-500">{fmt(p.prixAchat)}</td>
                <td className="px-4 py-3 text-end font-mono text-slate-700">{fmt(p.prixVente)}</td>
                <td className="px-4 py-3 text-center"><span className={`font-mono px-2 py-0.5 rounded-full text-xs ${low ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"}`}>{p.quantite}{low && <AlertTriangle size={11} className="inline ms-1 -mt-0.5" />}</span></td>
                <td className="px-4 py-3"><div className="flex items-center justify-end gap-1"><button onClick={() => setEntry(p)} title={t("tip_quick_entry")} className="p-1.5 text-slate-400 hover:text-emerald-600"><PackageCheck size={16} /></button><button onClick={() => setEditing(p)} title={t("tip_edit")} className="p-1.5 text-slate-400 hover:text-amber-600"><Pencil size={16} /></button><button onClick={() => remove(p.id)} title={t("tip_delete")} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button></div></td>
              </tr>); })}
            {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-slate-400">{t("prod_none")}</td></tr>}
          </tbody>
        </table>
      </div>
      {editing && <ProductModal product={editing} suppliers={suppliers} onSave={save} onClose={() => setEditing(null)} />}
      {entry && <StockEntryModal product={entry} onConfirm={addStock} onClose={() => setEntry(null)} />}
    </div>
  );
}
function ProductModal({ product, suppliers, onSave, onClose }) {
  const { t, tCat } = useI18n();
  const [f, setF] = useState({ ref: "", nom: "", categorie: CATEGORIES[0], fournisseurId: "", prixAchat: "", prixVente: "", quantite: "", stockMin: "", unite: "Pièce", ...product });
  const up = (k, v) => setF({ ...f, [k]: v });
  const submit = () => { if (!f.nom.trim()) return alert(t("err_designation")); onSave({ ...f, prixAchat: +f.prixAchat || 0, prixVente: +f.prixVente || 0, quantite: +f.quantite || 0, stockMin: +f.stockMin || 0 }); };
  return (
    <Modal title={product.id ? t("pm_edit") : t("pm_new")} onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-4">
        <Field label={t("pm_reference")}><input value={f.ref} onChange={(e) => up("ref", e.target.value)} className={inputCls} placeholder="PEI-005" /></Field>
        <Field label={t("pm_unit")}><input value={f.unite} onChange={(e) => up("unite", e.target.value)} className={inputCls} placeholder={t("pm_unit_ph")} /></Field>
        <div className="col-span-2"><Field label={t("pm_designation_req")}><input value={f.nom} onChange={(e) => up("nom", e.target.value)} className={inputCls} /></Field></div>
        <Field label={t("pm_category")}><select value={f.categorie} onChange={(e) => up("categorie", e.target.value)} className={inputCls}>{CATEGORIES.map((c) => <option key={c} value={c}>{tCat(c)}</option>)}</select></Field>
        <Field label={t("pm_supplier")}><select value={f.fournisseurId} onChange={(e) => up("fournisseurId", e.target.value)} className={inputCls}><option value="">{t("pm_none")}</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}</select></Field>
        <Field label={t("pm_purchase_ht")}><input type="number" value={f.prixAchat} onChange={(e) => up("prixAchat", e.target.value)} className={inputCls} /></Field>
        <Field label={t("pm_sale_ttc")}><input type="number" value={f.prixVente} onChange={(e) => up("prixVente", e.target.value)} className={inputCls} /></Field>
        <Field label={t("pm_qty_stock")}><input type="number" value={f.quantite} onChange={(e) => up("quantite", e.target.value)} className={inputCls} /></Field>
        <Field label={t("pm_threshold")}><input type="number" value={f.stockMin} onChange={(e) => up("stockMin", e.target.value)} className={inputCls} /></Field>
      </div>
      {f.prixAchat > 0 && f.prixVente > 0 && <p className="text-xs text-slate-400 mt-3">{t("pm_margin")} <span className="font-mono text-emerald-600">{fmtDH(f.prixVente - f.prixAchat)}</span></p>}
      <div className="flex justify-end gap-2 mt-5"><button onClick={onClose} className="px-4 py-2 text-sm text-slate-500">{t("c_cancel")}</button><button onClick={submit} className={btnPrimary}><Save size={16} />{t("c_save")}</button></div>
    </Modal>
  );
}
function StockEntryModal({ product, onConfirm, onClose }) {
  const { t } = useI18n(); const [qty, setQty] = useState("");
  return (
    <Modal title={t("prod_quick_entry")} onClose={onClose}>
      <p className="text-sm text-slate-600 mb-1">{product.nom}</p>
      <p className="text-xs text-slate-400 mb-4">{t("se_stock_current")} <span className="font-mono">{product.quantite} {product.unite}</span></p>
      <Field label={t("se_qty_add")}><input type="number" autoFocus value={qty} onChange={(e) => setQty(e.target.value)} className={inputCls} /></Field>
      <p className="text-[11px] text-slate-400 mt-2">{t("prod_quick_tip")}</p>
      <div className="flex justify-end gap-2 mt-5"><button onClick={onClose} className="px-4 py-2 text-sm text-slate-500">{t("c_cancel")}</button><button onClick={() => +qty > 0 && onConfirm(product.id, +qty)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg text-sm">{t("se_add")}</button></div>
    </Modal>
  );
}

/* ================================================================== */
/*  Éditeur de lignes (partagé)                                        */
/* ================================================================== */
function LineEditor({ products, lignes, setLignes, priceField, limitStock }) {
  const { t } = useI18n();
  const [pick, setPick] = useState(""); const [qte, setQte] = useState(1);
  const add = () => {
    const p = products.find((x) => x.id === pick); if (!p || qte < 1) return;
    if (limitStock && qte > p.quantite) return alert(`${t("se_insufficient")} ${p.quantite}`);
    const ex = lignes.find((l) => l.produitId === p.id);
    if (ex) setLignes(lignes.map((l) => l.produitId === p.id ? { ...l, qte: l.qte + qte } : l));
    else setLignes([...lignes, { produitId: p.id, ref: p.ref, nom: p.nom, prixUnit: p[priceField], qte }]);
    setPick(""); setQte(1);
  };
  const upL = (id, k, v) => setLignes(lignes.map((l) => l.produitId === id ? { ...l, [k]: +v } : l));
  const rm = (id) => setLignes(lignes.filter((l) => l.produitId !== id));
  return (
    <>
      <div className="flex gap-2 items-end mb-3">
        <div className="flex-1"><Field label={t("le_product")}><select value={pick} onChange={(e) => setPick(e.target.value)} className={inputCls}><option value="">{t("le_choose")}</option>{products.map((p) => <option key={p.id} value={p.id}>{p.nom} · {fmt(p[priceField])} DH{limitStock ? ` · ${t("le_stock")} ${p.quantite}` : ""}</option>)}</select></Field></div>
        <div className="w-20"><Field label={t("c_qty")}><input type="number" min={1} value={qte} onChange={(e) => setQte(+e.target.value)} className={inputCls} /></Field></div>
        <button onClick={add} className="bg-slate-800 hover:bg-slate-900 text-white px-4 rounded-lg text-sm h-[38px]"><Plus size={16} /></button>
      </div>
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase"><tr><th className="text-start px-3 py-2 font-medium">{t("c_designation")}</th><th className="text-end px-3 py-2 font-medium w-28">{t("c_pu")}</th><th className="text-center px-3 py-2 font-medium w-20">{t("c_qty")}</th><th className="text-end px-3 py-2 font-medium w-28">{t("c_amount")}</th><th className="w-8"></th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {lignes.map((l) => (<tr key={l.produitId}><td className="px-3 py-2 text-slate-700">{l.nom}</td><td className="px-3 py-1"><input type="number" value={l.prixUnit} onChange={(e) => upL(l.produitId, "prixUnit", e.target.value)} className="w-full text-end font-mono text-xs border border-slate-200 rounded px-1 py-1" /></td><td className="px-3 py-1"><input type="number" min={1} value={l.qte} onChange={(e) => upL(l.produitId, "qte", e.target.value)} className="w-full text-center font-mono text-xs border border-slate-200 rounded px-1 py-1" /></td><td className="px-3 py-2 text-end font-mono font-medium">{fmt(l.prixUnit * l.qte)}</td><td className="px-2"><button onClick={() => rm(l.produitId)} className="text-slate-300 hover:text-red-500"><Trash2 size={15} /></button></td></tr>))}
            {lignes.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-slate-400">{t("le_no_lines")}</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ================================================================== */
/*  Aperçu / impression                                                */
/* ================================================================== */
function DocPreview({ doc, stages, settings, party, partyLabel, onClose }) {
  const { t, lang, money } = useI18n();
  const assigned = stages.filter((s) => doc.numeros[s.numKey]);
  const [viewId, setViewId] = useState(doc.stage);
  const cur = stages.find((s) => s.id === viewId) || stages[0];
  const r = reglement(doc);
  return (
    <Modal title={`${t(cur.titreKey)} · ${doc.numeros[cur.numKey] || ""}`} onClose={onClose} wide>
      {assigned.length > 1 && <div className="flex gap-1 mb-4">{assigned.map((s) => <button key={s.id} onClick={() => setViewId(s.id)} className={`text-xs px-3 py-1 rounded-full ${viewId === s.id ? "bg-amber-500 text-slate-900 font-semibold" : "bg-slate-100 text-slate-500"}`}>{t(s.courtKey)}</button>)}</div>}
      <div className="bg-white text-slate-800 text-sm">
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-4">
          <div><h2 className="text-xl font-bold">{settings.nomEntreprise}</h2><p className="text-xs text-slate-500 mt-1">{settings.adresse}, {settings.ville}</p><p className="text-xs text-slate-500">Tél : {settings.tel}</p><p className="text-xs text-slate-500">ICE : {settings.ice}{settings.rc && ` · RC : ${settings.rc}`}</p></div>
          <div className="text-end"><div className="text-2xl font-bold text-amber-500">{t(cur.titreKey)}</div><div className="font-mono text-slate-600 mt-1">{doc.numeros[cur.numKey]}</div><div className="text-xs text-slate-500">{t("c_date")} : {doc.date}</div></div>
        </div>
        <div className="mb-4 bg-slate-50 rounded-lg p-3"><div className="text-xs text-slate-400 uppercase mb-1">{partyLabel}</div><div className="font-semibold">{party?.nom}</div>{party?.ice && <div className="text-xs text-slate-500">ICE : {party.ice}</div>}</div>
        <table className="w-full text-sm mb-4">
          <thead><tr className="bg-slate-800 text-white text-xs"><th className="text-start px-3 py-2">{t("c_designation")}</th><th className="text-end px-3 py-2">{t("c_pu")}</th><th className="text-center px-3 py-2">{t("c_qty")}</th><th className="text-end px-3 py-2">{t("c_amount")}</th></tr></thead>
          <tbody>{doc.lignes.map((l, i) => <tr key={i} className="border-b border-slate-100"><td className="px-3 py-2">{l.nom}</td><td className="px-3 py-2 text-end font-mono">{fmt(l.prixUnit)}</td><td className="px-3 py-2 text-center font-mono">{l.qte}</td><td className="px-3 py-2 text-end font-mono">{fmt(l.prixUnit * l.qte)}</td></tr>)}</tbody>
        </table>
        <div className="flex justify-end mb-4"><div className="w-64 space-y-1 text-sm"><div className="flex justify-between text-slate-500"><span>{t("c_total_ht")}</span><span className="font-mono">{fmtDH(doc.totalHT)}</span></div><div className="flex justify-between text-slate-500"><span>{`TVA ${doc.tauxTva}%`}</span><span className="font-mono">{fmtDH(doc.tva)}</span></div><div className="flex justify-between font-bold text-base border-t-2 border-slate-800 pt-1"><span>{t("c_total_ttc")}</span><span className="font-mono">{fmtDH(doc.totalTTC)}</span></div></div></div>
        {cur.id === "facture" && <><p className="text-xs text-slate-600 italic border-t border-slate-200 pt-3">{t("dp_invoice_words")} <span className="font-semibold not-italic">{money(doc.totalTTC, lang)}</span>.</p>{doc.paiements?.length > 0 && <div className="mt-2 text-xs text-slate-500"><span className="font-semibold">{t("dp_payments")}</span> {doc.paiements.map((p) => `${fmt(p.montant)}`).join(" · ")} — <span className={r.statut === "réglée" ? "text-emerald-600" : "text-amber-600"}>{r.statut === "réglée" ? t("dp_settled") : `${t("dp_remaining")} ${fmtDH(r.reste)}`}</span></div>}</>}
      </div>
      <div className="flex justify-end gap-2 mt-5"><button onClick={onClose} className="px-4 py-2 text-sm text-slate-500">{t("c_close")}</button><button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm"><Printer size={16} />{t("c_print")}</button></div>
    </Modal>
  );
}

/* ================================================================== */
/*  Modale de paiement                                                 */
/* ================================================================== */
function PaymentModal({ doc, label, onConfirm, onClose }) {
  const { t, tPay } = useI18n(); const r = reglement(doc);
  const [montant, setMontant] = useState(r.reste.toFixed(2));
  const [mode, setMode] = useState("Espèces"); const [date, setDate] = useState(todayISO());
  return (
    <Modal title={label} onClose={onClose}>
      <div className="bg-slate-50 rounded-lg p-3 mb-4 text-sm space-y-1"><Row label={t("c_total_ttc")} value={fmtDH(doc.totalTTC)} /><Row label={t("pmod_already")} value={fmtDH(r.paye)} /><div className="flex justify-between font-semibold text-slate-700"><span>{t("pmod_remaining")}</span><span className="font-mono">{fmtDH(r.reste)}</span></div></div>
      <div className="grid grid-cols-2 gap-4">
        <Field label={t("pmod_amount")}><input type="number" autoFocus value={montant} onChange={(e) => setMontant(e.target.value)} className={inputCls} /></Field>
        <Field label={t("c_date")}><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} /></Field>
        <div className="col-span-2"><Field label={t("pmod_mode")}><select value={mode} onChange={(e) => setMode(e.target.value)} className={inputCls}>{PAY_KEYS.map((m) => <option key={m} value={m}>{tPay(m)}</option>)}</select></Field></div>
      </div>
      <div className="flex justify-end gap-2 mt-5"><button onClick={onClose} className="px-4 py-2 text-sm text-slate-500">{t("c_cancel")}</button><button onClick={() => +montant > 0 && onConfirm({ id: uid(), date, montant: +montant, mode })} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg text-sm">{t("pmod_save")}</button></div>
    </Modal>
  );
}

/* ================================================================== */
/*  Bannière de circuit + tableau de pièces                            */
/* ================================================================== */
function CircuitBanner({ steps }) {
  return <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center flex-wrap gap-1 text-xs text-slate-500">{steps.map((s, i) => <span key={i} className="flex items-center gap-1"><span className="px-2.5 py-1 rounded-full bg-slate-100 font-medium text-slate-600">{i + 1}. {s}</span>{i < steps.length - 1 && <ChevronRight size={14} className="text-slate-300 rtl:rotate-180" />}</span>)}</div>;
}
function DocTable({ docs, stages, partyKey, onView, onAdvance, onPay, onEdit, onRemove, kind, emptyText }) {
  const { t } = useI18n();
  const primaryNum = (d) => { for (let i = stages.length - 1; i >= 0; i--) if (d.numeros[stages[i].numKey]) return d.numeros[stages[i].numKey]; return "—"; };
  const editableStage = kind === "vente" ? "devis" : "commande";
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase"><tr><th className="text-start px-4 py-3 font-medium">{t("t_piece")}</th><th className="text-start px-4 py-3 font-medium">{t("c_date")}</th><th className="text-start px-4 py-3 font-medium">{kind === "vente" ? t("t_client") : t("t_supplier")}</th><th className="text-end px-4 py-3 font-medium">{t("c_total_ttc")}</th><th className="text-center px-4 py-3 font-medium">{t("t_stage")}</th><th className="text-center px-4 py-3 font-medium">{t("t_payment")}</th><th className="px-4 py-3"></th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {[...docs].reverse().map((d) => {
            const idx = stageIndex(stages, d.stage); const next = stages[idx + 1]; const isFacture = d.stage === "facture"; const r = reglement(d);
            return (<tr key={d.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-mono text-slate-600">{primaryNum(d)}</td>
              <td className="px-4 py-3 text-slate-500">{d.date}</td>
              <td className="px-4 py-3 text-slate-700">{d[partyKey]}</td>
              <td className="px-4 py-3 text-end font-mono font-semibold text-slate-700">{fmtDH(d.totalTTC)}</td>
              <td className="px-4 py-3 text-center"><StageBadge stages={stages} stage={d.stage} /></td>
              <td className="px-4 py-3 text-center">{isFacture ? <PayBadge doc={d} /> : <span className="text-slate-300">—</span>}</td>
              <td className="px-4 py-3"><div className="flex items-center justify-end gap-1">
                {next && <button onClick={() => onAdvance(d)} className="flex items-center gap-1 text-xs bg-amber-100 hover:bg-amber-200 text-amber-700 font-medium px-2 py-1 rounded-lg" title={`${t("next_to")} ${t(next.courtKey)}`}>{t(next.courtKey)}<ArrowRight size={13} className="rtl:rotate-180" /></button>}
                {isFacture && r.statut !== "réglée" && <button onClick={() => onPay(d)} className="flex items-center text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-medium px-2 py-1 rounded-lg" title={t("tip_pay")}><HandCoins size={13} /></button>}
                {d.stage === editableStage && <button onClick={() => onEdit(d)} className="p-1.5 text-slate-400 hover:text-amber-600" title={t("tip_edit")}><Pencil size={15} /></button>}
                <button onClick={() => onView(d)} className="p-1.5 text-slate-400 hover:text-sky-600" title={t("tip_view")}><FileText size={15} /></button>
                <button onClick={() => onRemove(d)} className="p-1.5 text-slate-400 hover:text-red-600" title={t("tip_delete")}><Trash2 size={15} /></button>
              </div></td>
            </tr>);
          })}
          {docs.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-slate-400">{emptyText}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

/* ================================================================== */
/*  CIRCUIT DE VENTE                                                   */
/* ================================================================== */
function Sales({ sales, clients, products, settings, persist }) {
  const { t } = useI18n();
  const [builder, setBuilder] = useState(null); const [preview, setPreview] = useState(null);
  const [pay, setPay] = useState(null); const [filter, setFilter] = useState("tous");
  const filtered = filter === "tous" ? sales : sales.filter((s) => s.stage === filter);
  const bump = (st, c) => ({ ...st, compteurs: { ...st.compteurs, [c]: (st.compteurs[c] || 1) + 1 } });

  const createDoc = (startId, base) => {
    const st0 = SALE_STAGES.find((s) => s.id === startId); let st = settings;
    const year = (base.date || todayISO()).slice(0, 4);
    const numeros = { [st0.numKey]: `${st0.prefix}-${year}-${String(st.compteurs[st0.counter]).padStart(4, "0")}` }; st = bump(st, st0.counter);
    const tot = computeTotaux(base.lignes, base.tauxTva, true);
    let doc = { id: uid(), date: base.date, clientId: base.clientId, clientNom: base.clientNom, clientIce: base.clientIce, lignes: base.lignes, tauxTva: base.tauxTva, ...tot, stage: startId, numeros, livre: false, paiements: [] };
    let prods = products;
    if (stageIndex(SALE_STAGES, startId) >= stageIndex(SALE_STAGES, "livraison")) { prods = products.map((p) => { const l = doc.lignes.find((x) => x.produitId === p.id); return l ? { ...p, quantite: p.quantite - l.qte } : p; }); doc.livre = true; }
    persist.products(prods); persist.settings(st); persist.sales([...sales, doc]); setBuilder(null);
  };
  const editDevis = (doc, base) => { const tot = computeTotaux(base.lignes, base.tauxTva, true); persist.sales(sales.map((s) => s.id === doc.id ? { ...s, ...base, ...tot } : s)); setBuilder(null); };
  const advance = (doc) => {
    const idx = stageIndex(SALE_STAGES, doc.stage), next = SALE_STAGES[idx + 1]; if (!next) return;
    let st = settings; const year = doc.date.slice(0, 4);
    const numeros = { ...doc.numeros, [next.numKey]: `${next.prefix}-${year}-${String(st.compteurs[next.counter]).padStart(4, "0")}` }; st = bump(st, next.counter);
    let upd = { ...doc, stage: next.id, numeros }; let prods = products;
    if (next.id === "livraison" && !doc.livre) {
      for (const l of doc.lignes) { const p = products.find((x) => x.id === l.produitId); if (p && l.qte > p.quantite) return alert(`${t("insufficient_for")} ${l.nom} (${t("available")} ${p.quantite}).`); }
      prods = products.map((p) => { const l = doc.lignes.find((x) => x.produitId === p.id); return l ? { ...p, quantite: p.quantite - l.qte } : p; }); upd.livre = true;
    }
    persist.products(prods); persist.settings(st); persist.sales(sales.map((s) => s.id === doc.id ? upd : s));
  };
  const addPayment = (doc, p) => { persist.sales(sales.map((s) => s.id === doc.id ? { ...s, paiements: [...(s.paiements || []), p] } : s)); setPay(null); };
  const remove = (doc) => { if (!confirm(t("conf_del_sale"))) return; let prods = products; if (doc.livre) prods = products.map((p) => { const l = doc.lignes.find((x) => x.produitId === p.id); return l ? { ...p, quantite: p.quantite + l.qte } : p; }); persist.products(prods); persist.sales(sales.filter((s) => s.id !== doc.id)); };

  const filters = [["tous", "f_all"], ["devis", "f_quotes"], ["commande", "f_orders"], ["livraison", "f_deliveries"], ["facture", "f_invoices"]];
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Header title={t("nav_sales")} subtitle={t("sales_circuit")} action={<div className="flex gap-2"><button onClick={() => setBuilder({ start: "devis" })} className="flex items-center gap-2 bg-white border border-slate-300 hover:border-amber-400 text-slate-700 font-medium px-4 py-2 rounded-lg text-sm"><ClipboardList size={16} />{t("sales_new_quote")}</button><button onClick={() => setBuilder({ start: "facture" })} className={btnPrimary}><Receipt size={16} />{t("sales_direct")}</button></div>} />
      <CircuitBanner steps={[t("st_devis"), t("st_commande"), t("st_livraison"), t("st_facture"), t("step_encaissement")]} />
      <div className="flex gap-1 my-4 flex-wrap">{filters.map(([k, lbl]) => <button key={k} onClick={() => setFilter(k)} className={`text-sm px-3 py-1.5 rounded-lg ${filter === k ? "bg-slate-800 text-white" : "bg-white border border-slate-200 text-slate-500"}`}>{t(lbl)}</button>)}</div>
      <DocTable docs={filtered} stages={SALE_STAGES} partyKey="clientNom" kind="vente" emptyText={t("empty_sales")} onView={setPreview} onAdvance={advance} onPay={setPay} onEdit={(d) => setBuilder({ start: "devis", doc: d })} onRemove={remove} />
      {builder && <SaleBuilder start={builder.start} doc={builder.doc} clients={clients} products={products} tva={settings.tva} onCreate={createDoc} onEdit={editDevis} onClose={() => setBuilder(null)} />}
      {preview && <DocPreview doc={preview} stages={SALE_STAGES} settings={settings} party={{ nom: preview.clientNom, ice: preview.clientIce }} partyLabel={t("t_client")} onClose={() => setPreview(null)} />}
      {pay && <PaymentModal doc={pay} label={t("encaissement")} onConfirm={(p) => addPayment(pay, p)} onClose={() => setPay(null)} />}
    </div>
  );
}
function SaleBuilder({ start, doc, clients, products, tva, onCreate, onEdit, onClose }) {
  const { t } = useI18n(); const editing = !!doc;
  const [clientId, setClientId] = useState(doc?.clientId || clients[0]?.id || "");
  const [date, setDate] = useState(doc?.date || todayISO());
  const [lignes, setLignes] = useState(doc?.lignes || []);
  const tauxTva = doc?.tauxTva ?? tva; const tot = computeTotaux(lignes, tauxTva, true);
  const submit = () => { if (lignes.length === 0) return alert(t("err_one_product")); const c = clients.find((x) => x.id === clientId); const base = { date, clientId, clientNom: c?.nom || "Client comptoir", clientIce: c?.ice || "", lignes, tauxTva }; editing ? onEdit(doc, base) : onCreate(start, base); };
  const titre = editing ? t("builder_edit_quote") : start === "facture" ? t("builder_direct") : t("builder_quote");
  return (
    <Modal title={titre} onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-4 mb-4"><Field label={t("t_client")}><select value={clientId} onChange={(e) => setClientId(e.target.value)} className={inputCls}>{clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></Field><Field label={t("c_date")}><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} /></Field></div>
      <LineEditor products={products} lignes={lignes} setLignes={setLignes} priceField="prixVente" limitStock={start === "facture"} />
      <div className="flex justify-end mt-4"><div className="w-60 space-y-1 text-sm"><Row label={t("c_total_ht")} value={fmtDH(tot.totalHT)} /><Row label={`TVA ${tauxTva}%`} value={fmtDH(tot.tva)} /><div className="flex justify-between font-bold text-slate-800 border-t border-slate-200 pt-1"><span>{t("c_total_ttc")}</span><span className="font-mono">{fmtDH(tot.totalTTC)}</span></div></div></div>
      {start === "facture" && !editing && <p className="text-xs text-amber-600 mt-2">{t("warn_direct")}</p>}
      <div className="flex justify-end gap-2 mt-5"><button onClick={onClose} className="px-4 py-2 text-sm text-slate-500">{t("c_cancel")}</button><button onClick={submit} className={btnPrimary}><Save size={16} />{editing ? t("c_save") : start === "facture" ? t("btn_validate_sale") : t("btn_create_quote")}</button></div>
    </Modal>
  );
}

/* ================================================================== */
/*  CIRCUIT D'ACHAT                                                    */
/* ================================================================== */
function Purchases({ purchases, suppliers, products, settings, persist }) {
  const { t } = useI18n();
  const [builder, setBuilder] = useState(null); const [preview, setPreview] = useState(null);
  const [pay, setPay] = useState(null); const [filter, setFilter] = useState("tous");
  const filtered = filter === "tous" ? purchases : purchases.filter((p) => p.stage === filter);
  const bump = (st, c) => ({ ...st, compteurs: { ...st.compteurs, [c]: (st.compteurs[c] || 1) + 1 } });
  const applyReception = (prods, doc) => prods.map((p) => { const l = doc.lignes.find((x) => x.produitId === p.id); return l ? { ...p, quantite: p.quantite + l.qte, prixAchat: l.prixUnit } : p; });
  const createDoc = (startId, base) => {
    const st0 = PURCHASE_STAGES.find((s) => s.id === startId); let st = settings; const year = (base.date || todayISO()).slice(0, 4);
    const numeros = { [st0.numKey]: `${st0.prefix}-${year}-${String(st.compteurs[st0.counter]).padStart(4, "0")}` }; st = bump(st, st0.counter);
    const tot = computeTotaux(base.lignes, base.tauxTva, false);
    let doc = { id: uid(), date: base.date, fournisseurId: base.fournisseurId, fournisseurNom: base.fournisseurNom, fournisseurIce: base.fournisseurIce, lignes: base.lignes, tauxTva: base.tauxTva, ...tot, stage: startId, numeros, recu: false, paiements: [] };
    let prods = products;
    if (stageIndex(PURCHASE_STAGES, startId) >= stageIndex(PURCHASE_STAGES, "reception")) { prods = applyReception(products, doc); doc.recu = true; }
    persist.products(prods); persist.settings(st); persist.purchases([...purchases, doc]); setBuilder(null);
  };
  const editCmd = (doc, base) => { const tot = computeTotaux(base.lignes, base.tauxTva, false); persist.purchases(purchases.map((p) => p.id === doc.id ? { ...p, ...base, ...tot } : p)); setBuilder(null); };
  const advance = (doc) => {
    const idx = stageIndex(PURCHASE_STAGES, doc.stage), next = PURCHASE_STAGES[idx + 1]; if (!next) return;
    let st = settings; const year = doc.date.slice(0, 4);
    const numeros = { ...doc.numeros, [next.numKey]: `${next.prefix}-${year}-${String(st.compteurs[next.counter]).padStart(4, "0")}` }; st = bump(st, next.counter);
    let upd = { ...doc, stage: next.id, numeros }; let prods = products;
    if (next.id === "reception" && !doc.recu) { prods = applyReception(products, doc); upd.recu = true; }
    persist.products(prods); persist.settings(st); persist.purchases(purchases.map((p) => p.id === doc.id ? upd : p));
  };
  const addPayment = (doc, p) => { persist.purchases(purchases.map((x) => x.id === doc.id ? { ...x, paiements: [...(x.paiements || []), p] } : x)); setPay(null); };
  const remove = (doc) => { if (!confirm(t("conf_del_purchase"))) return; let prods = products; if (doc.recu) prods = products.map((p) => { const l = doc.lignes.find((x) => x.produitId === p.id); return l ? { ...p, quantite: Math.max(0, p.quantite - l.qte) } : p; }); persist.products(prods); persist.purchases(purchases.filter((p) => p.id !== doc.id)); };

  const filters = [["tous", "f_all"], ["commande", "f_orders"], ["reception", "f_receptions"], ["facture", "f_invoices"]];
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Header title={t("nav_purchases")} subtitle={t("purch_circuit")} action={<div className="flex gap-2"><button onClick={() => setBuilder({ start: "commande" })} className="flex items-center gap-2 bg-white border border-slate-300 hover:border-amber-400 text-slate-700 font-medium px-4 py-2 rounded-lg text-sm"><ClipboardList size={16} />{t("purch_order")}</button><button onClick={() => setBuilder({ start: "reception" })} className={btnPrimary}><PackageCheck size={16} />{t("purch_direct")}</button></div>} />
      <CircuitBanner steps={[t("st_commande"), t("st_reception"), t("st_facture"), t("step_reglement")]} />
      <div className="flex gap-1 my-4 flex-wrap">{filters.map(([k, lbl]) => <button key={k} onClick={() => setFilter(k)} className={`text-sm px-3 py-1.5 rounded-lg ${filter === k ? "bg-slate-800 text-white" : "bg-white border border-slate-200 text-slate-500"}`}>{t(lbl)}</button>)}</div>
      <DocTable docs={filtered} stages={PURCHASE_STAGES} partyKey="fournisseurNom" kind="achat" emptyText={t("empty_purch")} onView={setPreview} onAdvance={advance} onPay={setPay} onEdit={(d) => setBuilder({ start: "commande", doc: d })} onRemove={remove} />
      {builder && <PurchaseBuilder start={builder.start} doc={builder.doc} suppliers={suppliers} products={products} tva={settings.tva} onCreate={createDoc} onEdit={editCmd} onClose={() => setBuilder(null)} />}
      {preview && <DocPreview doc={preview} stages={PURCHASE_STAGES} settings={settings} party={{ nom: preview.fournisseurNom, ice: preview.fournisseurIce }} partyLabel={t("t_supplier")} onClose={() => setPreview(null)} />}
      {pay && <PaymentModal doc={pay} label={t("reglement_fourn")} onConfirm={(p) => addPayment(pay, p)} onClose={() => setPay(null)} />}
    </div>
  );
}
function PurchaseBuilder({ start, doc, suppliers, products, tva, onCreate, onEdit, onClose }) {
  const { t } = useI18n(); const editing = !!doc;
  const [fournisseurId, setFournisseurId] = useState(doc?.fournisseurId || suppliers[0]?.id || "");
  const [date, setDate] = useState(doc?.date || todayISO());
  const [lignes, setLignes] = useState(doc?.lignes || []);
  const tauxTva = doc?.tauxTva ?? tva; const tot = computeTotaux(lignes, tauxTva, false);
  const submit = () => { if (lignes.length === 0) return alert(t("err_one_product")); const f = suppliers.find((x) => x.id === fournisseurId); const base = { date, fournisseurId, fournisseurNom: f?.nom || "Fournisseur", fournisseurIce: f?.ice || "", lignes, tauxTva }; editing ? onEdit(doc, base) : onCreate(start, base); };
  const titre = editing ? t("pbld_edit") : start === "reception" ? t("pbld_direct") : t("pbld_order");
  return (
    <Modal title={titre} onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-4 mb-4"><Field label={t("t_supplier")}><select value={fournisseurId} onChange={(e) => setFournisseurId(e.target.value)} className={inputCls}>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}</select></Field><Field label={t("c_date")}><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} /></Field></div>
      <p className="text-xs text-slate-400 mb-2">{t("pbld_price_note")}</p>
      <LineEditor products={products} lignes={lignes} setLignes={setLignes} priceField="prixAchat" limitStock={false} />
      <div className="flex justify-end mt-4"><div className="w-60 space-y-1 text-sm"><Row label={t("c_total_ht")} value={fmtDH(tot.totalHT)} /><Row label={`TVA ${tauxTva}%`} value={fmtDH(tot.tva)} /><div className="flex justify-between font-bold text-slate-800 border-t border-slate-200 pt-1"><span>{t("c_total_ttc")}</span><span className="font-mono">{fmtDH(tot.totalTTC)}</span></div></div></div>
      {start === "reception" && !editing && <p className="text-xs text-amber-600 mt-2">{t("warn_reception")}</p>}
      <div className="flex justify-end gap-2 mt-5"><button onClick={onClose} className="px-4 py-2 text-sm text-slate-500">{t("c_cancel")}</button><button onClick={submit} className={btnPrimary}><Save size={16} />{editing ? t("c_save") : start === "reception" ? t("btn_validate_reception") : t("btn_create_order")}</button></div>
    </Modal>
  );
}

/* ================================================================== */
/*  Clients & Fournisseurs                                             */
/* ================================================================== */
function Clients({ clients, persist }) {
  const { t } = useI18n(); const [editing, setEditing] = useState(null);
  const save = (d) => { d.id ? persist.clients(clients.map((c) => c.id === d.id ? d : c)) : persist.clients([...clients, { ...d, id: uid() }]); setEditing(null); };
  const remove = (id) => { if (confirm(t("conf_del_client"))) persist.clients(clients.filter((c) => c.id !== id)); };
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Header title={t("nav_clients")} subtitle={`${clients.length} ${t("cl_count")}`} action={<button onClick={() => setEditing({})} className={btnPrimary}><Plus size={16} />{t("cl_new")}</button>} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((c) => (<div key={c.id} className="bg-white rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between"><div><div className="font-semibold text-slate-800">{c.nom}</div><span className={`text-[11px] px-2 py-0.5 rounded-full ${c.type === "entreprise" ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-700"}`}>{c.type === "entreprise" ? t("type_ent") : t("type_part")}</span></div><div className="flex gap-1"><button onClick={() => setEditing(c)} className="p-1 text-slate-400 hover:text-amber-600"><Pencil size={15} /></button><button onClick={() => remove(c.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={15} /></button></div></div><div className="mt-3 space-y-1 text-xs text-slate-500">{c.ice && <div>ICE : <span className="font-mono">{c.ice}</span></div>}{c.tel && <div className="flex items-center gap-1"><Phone size={12} />{c.tel}</div>}{c.ville && <div className="flex items-center gap-1"><MapPin size={12} />{c.ville}</div>}</div></div>))}
      </div>
      {editing && <PersonModal entity={editing} type="client" onSave={save} onClose={() => setEditing(null)} />}
    </div>
  );
}
function Suppliers({ suppliers, persist }) {
  const { t } = useI18n(); const [editing, setEditing] = useState(null);
  const save = (d) => { d.id ? persist.suppliers(suppliers.map((s) => s.id === d.id ? d : s)) : persist.suppliers([...suppliers, { ...d, id: uid() }]); setEditing(null); };
  const remove = (id) => { if (confirm(t("conf_del_supplier"))) persist.suppliers(suppliers.filter((s) => s.id !== id)); };
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Header title={t("nav_suppliers")} subtitle={`${suppliers.length} ${t("sup_count")}`} action={<button onClick={() => setEditing({})} className={btnPrimary}><Plus size={16} />{t("sup_new")}</button>} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((s) => (<div key={s.id} className="bg-white rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between"><div className="flex items-center gap-2"><span className="bg-slate-100 text-slate-500 p-2 rounded-lg"><Building2 size={16} /></span><div className="font-semibold text-slate-800">{s.nom}</div></div><div className="flex gap-1"><button onClick={() => setEditing(s)} className="p-1 text-slate-400 hover:text-amber-600"><Pencil size={15} /></button><button onClick={() => remove(s.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={15} /></button></div></div><div className="mt-3 space-y-1 text-xs text-slate-500">{s.contact && <div>{t("person_contact")} : {s.contact}</div>}{s.ice && <div>ICE : <span className="font-mono">{s.ice}</span></div>}{s.tel && <div className="flex items-center gap-1"><Phone size={12} />{s.tel}</div>}{s.ville && <div className="flex items-center gap-1"><MapPin size={12} />{s.ville}</div>}</div></div>))}
      </div>
      {editing && <PersonModal entity={editing} type="supplier" onSave={save} onClose={() => setEditing(null)} />}
    </div>
  );
}
function PersonModal({ entity, type, onSave, onClose }) {
  const { t } = useI18n(); const isClient = type === "client";
  const [f, setF] = useState(isClient ? { nom: "", type: "particulier", ice: "", tel: "", ville: "", adresse: "", ...entity } : { nom: "", contact: "", ice: "", tel: "", ville: "", ...entity });
  const up = (k, v) => setF({ ...f, [k]: v });
  const submit = () => { if (!f.nom.trim()) return alert(t("err_name")); onSave(f); };
  return (
    <Modal title={entity.id ? t("person_edit") : isClient ? t("cl_new") : t("sup_new")} onClose={onClose}>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><Field label={t("person_name_req")}><input value={f.nom} onChange={(e) => up("nom", e.target.value)} className={inputCls} /></Field></div>
        {isClient ? <Field label={t("person_type")}><select value={f.type} onChange={(e) => up("type", e.target.value)} className={inputCls}><option value="particulier">{t("type_part")}</option><option value="entreprise">{t("type_ent")}</option></select></Field> : <Field label={t("person_contact")}><input value={f.contact} onChange={(e) => up("contact", e.target.value)} className={inputCls} /></Field>}
        <Field label="ICE"><input value={f.ice} onChange={(e) => up("ice", e.target.value)} className={inputCls} /></Field>
        <Field label={t("person_phone")}><input value={f.tel} onChange={(e) => up("tel", e.target.value)} className={inputCls} /></Field>
        <Field label={t("person_city")}><input value={f.ville} onChange={(e) => up("ville", e.target.value)} className={inputCls} /></Field>
        {isClient && <div className="col-span-2"><Field label={t("person_address")}><input value={f.adresse} onChange={(e) => up("adresse", e.target.value)} className={inputCls} /></Field></div>}
      </div>
      <div className="flex justify-end gap-2 mt-5"><button onClick={onClose} className="px-4 py-2 text-sm text-slate-500">{t("c_cancel")}</button><button onClick={submit} className={btnPrimary}><Save size={16} />{t("c_save")}</button></div>
    </Modal>
  );
}

/* ================================================================== */
/*  Paramètres                                                         */
/* ================================================================== */
function SettingsView({ settings, persist }) {
  const { t } = useI18n(); const [f, setF] = useState(settings); const [saved, setSaved] = useState(false);
  const up = (k, v) => { setF({ ...f, [k]: v }); setSaved(false); };
  const save = () => { persist.settings({ ...f, tva: +f.tva || 0 }); setSaved(true); };
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Header title={t("nav_settings")} subtitle={t("set_subtitle")} />
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <Field label={t("set_company")}><input value={f.nomEntreprise} onChange={(e) => up("nomEntreprise", e.target.value)} className={inputCls} /></Field>
        <div className="grid grid-cols-2 gap-4"><Field label="ICE"><input value={f.ice} onChange={(e) => up("ice", e.target.value)} className={inputCls} /></Field><Field label={t("set_rc")}><input value={f.rc} onChange={(e) => up("rc", e.target.value)} className={inputCls} /></Field></div>
        <Field label={t("set_address")}><input value={f.adresse} onChange={(e) => up("adresse", e.target.value)} className={inputCls} /></Field>
        <div className="grid grid-cols-2 gap-4"><Field label={t("set_city")}><input value={f.ville} onChange={(e) => up("ville", e.target.value)} className={inputCls} /></Field><Field label={t("set_phone")}><input value={f.tel} onChange={(e) => up("tel", e.target.value)} className={inputCls} /></Field></div>
        <Field label={t("set_tva")}><input type="number" value={f.tva} onChange={(e) => up("tva", e.target.value)} className={inputCls + " max-w-[150px]"} /></Field>
        <div className="flex items-center gap-3 pt-2"><button onClick={save} className={btnPrimary}><Save size={16} />{t("c_save")}</button>{saved && <span className="text-sm text-emerald-600 flex items-center gap-1"><CheckCircle2 size={15} />{t("set_saved")}</span>}</div>
      </div>
      <p className="text-xs text-slate-400 mt-4 flex items-center gap-1"><Globe size={13} />{t("set_numbering")}</p>
    </div>
  );
}
