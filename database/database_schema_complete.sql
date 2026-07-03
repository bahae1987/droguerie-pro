-- DrogueriePro V46 - Structure base de données complète
-- À conserver en local
-- Compatible PostgreSQL / Supabase

create table if not exists roles (
  id bigserial primary key,
  name text unique not null,
  description text
);

create table if not exists permissions (
  id bigserial primary key,
  code text unique not null,
  module text,
  label text
);

create table if not exists role_permissions (
  role_id bigint references roles(id) on delete cascade,
  permission_id bigint references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists branches (
  id bigserial primary key,
  name text not null,
  city text,
  address text,
  phone text,
  manager_name text,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists users (
  id bigserial primary key,
  username text unique not null,
  full_name text,
  password_hash text not null,
  active boolean default true,
  branch_id bigint references branches(id),
  role_id bigint references roles(id),
  created_at timestamptz default now()
);

create table if not exists clients (
  id bigserial primary key,
  name text not null,
  type text,
  ice text,
  phone text,
  city text,
  address text,
  branch_id bigint references branches(id),
  created_by bigint references users(id),
  created_by_label text,
  assigned_to bigint references users(id),
  created_at timestamptz default now()
);

create table if not exists suppliers (
  id bigserial primary key,
  name text not null,
  ice text,
  phone text,
  city text,
  contact text,
  address text,
  branch_id bigint references branches(id),
  created_by bigint references users(id),
  created_by_label text,
  assigned_to bigint references users(id),
  created_at timestamptz default now()
);

create table if not exists products (
  id bigserial primary key,
  ref text not null,
  name text not null,
  name_ar text,
  category text,
  unit text,
  purchase_price numeric default 0,
  sale_price numeric default 0,
  quantity numeric default 0,
  min_stock numeric default 0,
  supplier_id bigint references suppliers(id),
  branch_id bigint references branches(id),
  created_at timestamptz default now()
);

create unique index if not exists products_ref_branch_unique
on products(ref, coalesce(branch_id, 0));

create table if not exists sales (
  id bigserial primary key,
  stage text not null,
  date date default current_date,
  client_id bigint references clients(id),
  client_name text,
  numbers_json jsonb default '{}'::jsonb,
  lines_json jsonb default '[]'::jsonb,
  payments_json jsonb default '[]'::jsonb,
  total_ht numeric default 0,
  vat numeric default 0,
  total_ttc numeric default 0,
  base_doc_id bigint,
  qty_done numeric default 0,
  processed_lines_json jsonb default '{}'::jsonb,
  created_by bigint references users(id),
  created_by_label text,
  branch_id bigint references branches(id),
  created_at timestamptz default now()
);

create table if not exists purchases (
  id bigserial primary key,
  stage text not null,
  date date default current_date,
  supplier_id bigint references suppliers(id),
  supplier_name text,
  numbers_json jsonb default '{}'::jsonb,
  lines_json jsonb default '[]'::jsonb,
  payments_json jsonb default '[]'::jsonb,
  total_ht numeric default 0,
  vat numeric default 0,
  total_ttc numeric default 0,
  base_doc_id bigint,
  qty_done numeric default 0,
  processed_lines_json jsonb default '{}'::jsonb,
  created_by bigint references users(id),
  created_by_label text,
  branch_id bigint references branches(id),
  created_at timestamptz default now()
);

create table if not exists stock_movements (
  id bigserial primary key,
  product_id bigint references products(id),
  quantity numeric default 0,
  reason text,
  branch_id bigint references branches(id),
  doc_type text,
  doc_number text,
  user_id bigint references users(id),
  user_label text,
  created_at timestamptz default now()
);

create table if not exists audit_logs (
  id bigserial primary key,
  module text,
  action text,
  object_label text,
  detail text,
  user_id bigint,
  user_label text,
  branch_id bigint,
  created_at timestamptz default now()
);

create table if not exists app_settings (
  key text primary key,
  value text
);

create table if not exists counters (
  name text primary key,
  value bigint default 1
);

create table if not exists saas_modules (
  code text primary key,
  name text not null,
  description text,
  enabled boolean default true,
  monthly_price numeric default 0,
  yearly_price numeric default 0,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists tenants (
  id bigserial primary key,
  name text not null,
  contact_name text,
  email text,
  phone text,
  plan text default 'standard',
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists tenant_modules (
  tenant_id bigint references tenants(id) on delete cascade,
  module_code text references saas_modules(code) on delete cascade,
  enabled boolean default true,
  primary key (tenant_id, module_code)
);

create index if not exists idx_products_branch_id on products(branch_id);
create index if not exists idx_clients_branch_id on clients(branch_id);
create index if not exists idx_suppliers_branch_id on suppliers(branch_id);
create index if not exists idx_sales_branch_id on sales(branch_id);
create index if not exists idx_purchases_branch_id on purchases(branch_id);
create index if not exists idx_sales_created_by on sales(created_by);
create index if not exists idx_purchases_created_by on purchases(created_by);
create index if not exists idx_stock_movements_branch_id on stock_movements(branch_id);
create index if not exists idx_audit_logs_branch_id on audit_logs(branch_id);

-- RLS désactivé pour application front Supabase contrôlée par permissions applicatives
alter table roles disable row level security;
alter table permissions disable row level security;
alter table role_permissions disable row level security;
alter table branches disable row level security;
alter table users disable row level security;
alter table clients disable row level security;
alter table suppliers disable row level security;
alter table products disable row level security;
alter table sales disable row level security;
alter table purchases disable row level security;
alter table stock_movements disable row level security;
alter table audit_logs disable row level security;
alter table app_settings disable row level security;
alter table counters disable row level security;
alter table saas_modules disable row level security;
alter table tenants disable row level security;
alter table tenant_modules disable row level security;
