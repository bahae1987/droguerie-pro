-- DrogueriePro V46 - Données initiales minimales

insert into branches(id, name, city, active)
values (1, 'Droguerie principale', 'Casablanca', true)
on conflict (id) do nothing;

insert into roles(id, name, description) values
(1, 'Administrateur', 'Administration métier'),
(2, 'Gérant', 'Gestion droguerie'),
(3, 'Vendeur', 'Ventes et clients affectés'),
(4, 'Magasinier', 'Stock et achats'),
(99, 'SuperAdmin', 'Administration plateforme SaaS')
on conflict (id) do update set name = excluded.name, description = excluded.description;

insert into permissions(code, module, label) values
('dashboard.read','Tableau de bord','Consulter tableau de bord'),
('products.read','Produits','Consulter produits'),
('products.write','Produits','Créer modifier produits'),
('products.delete','Produits','Supprimer produits'),
('stock.read','Stock','Consulter stock'),
('stock.adjust','Stock','Ajuster stock'),
('stock.transfer','Stock','Transfert stock'),
('clients.read','Clients','Consulter clients'),
('clients.write','Clients','Créer modifier clients'),
('clients.delete','Clients','Supprimer clients'),
('clients.assign','Clients','Affecter clients'),
('suppliers.read','Fournisseurs','Consulter fournisseurs'),
('suppliers.write','Fournisseurs','Créer modifier fournisseurs'),
('suppliers.delete','Fournisseurs','Supprimer fournisseurs'),
('sales.read','Ventes','Consulter ventes'),
('sales.write','Ventes','Créer modifier ventes'),
('sales.delete','Ventes','Supprimer ventes'),
('sales.pay','Ventes','Encaisser ventes'),
('purchases.read','Achats','Consulter achats'),
('purchases.write','Achats','Créer modifier achats'),
('purchases.delete','Achats','Supprimer achats'),
('purchases.pay','Achats','Régler achats'),
('payments.read','Paiements','Consulter paiements'),
('payments.cancel','Paiements','Annuler paiements'),
('users.read','Utilisateurs','Consulter utilisateurs'),
('users.write','Utilisateurs','Créer modifier utilisateurs'),
('settings.manage','Paramètres','Gérer paramètres'),
('permissions.manage','Autorisations','Gérer autorisations'),
('branches.manage','Drogueries','Gérer drogueries'),
('mobile.manage','Application mobile','Gérer application mobile'),
('reporting.read','Reporting','Consulter reporting'),
('superadmin.manage','SaaS','Centre SuperAdmin'),
('modules.manage','SaaS','Gérer modules'),
('database.manage','SaaS','Base données'),
('backup.manage','SaaS','Sauvegarde base')
on conflict (code) do update set module = excluded.module, label = excluded.label;

insert into role_permissions(role_id, permission_id)
select 1, id from permissions
where code not in ('superadmin.manage','modules.manage','database.manage','backup.manage')
on conflict do nothing;

insert into role_permissions(role_id, permission_id)
select 99, id from permissions
on conflict do nothing;

insert into users(username, full_name, password_hash, active, branch_id, role_id)
values
('admin', 'Administrateur', 'admin123', true, 1, 1),
('superadmin', 'Super Administrateur', 'superadmin123', true, null, 99)
on conflict (username) do nothing;

insert into app_settings(key, value) values
('vat_rate','20'),
('theme','light'),
('company_name','DrogueriePro'),
('company_ice',''),
('company_phone',''),
('company_address','')
on conflict (key) do nothing;
