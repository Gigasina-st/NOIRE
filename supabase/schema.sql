-- NOIRE / Supabase foundation
-- Run this once in the Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null,
  price numeric(12,2) not null default 0 check (price >= 0),
  currency text not null default 'EUR',
  description text not null default '',
  details jsonb not null default '[]'::jsonb,
  image text not null default '',
  gallery jsonb not null default '[]'::jsonb,
  colors jsonb not null default '["Noir","Ivory","Stone"]'::jsonb,
  sizes jsonb not null default '["XS","S","M","L","XL"]'::jsonb,
  stock integer not null default 0 check (stock >= 0),
  featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete set null,
  email text not null,
  status text not null default 'pending' check (status in ('pending','confirmed','processing','shipped','delivered','cancelled')),
  subtotal numeric(12,2) not null default 0,
  currency text not null default 'EUR',
  shipping_address jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price numeric(12,2) not null,
  quantity integer not null check (quantity > 0),
  size text,
  color text
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.newsletter_subscribers enable row level security;

drop policy if exists "public can read active products" on public.products;
create policy "public can read active products" on public.products
for select using (active = true or public.is_admin());

drop policy if exists "admins manage products" on public.products;
create policy "admins manage products" on public.products
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles
for select using (id = auth.uid() or public.is_admin());

drop policy if exists "admins read profiles" on public.profiles;
create policy "admins read profiles" on public.profiles
for select using (public.is_admin());

drop policy if exists "admins manage orders" on public.orders;
create policy "admins manage orders" on public.orders
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "customers read own orders" on public.orders;
create policy "customers read own orders" on public.orders
for select using (customer_id = auth.uid());

drop policy if exists "admins manage order items" on public.order_items;
create policy "admins manage order items" on public.order_items
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "customers read own order items" on public.order_items;
create policy "customers read own order items" on public.order_items
for select using (exists(select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid()));

drop policy if exists "public can subscribe" on public.newsletter_subscribers;
create policy "public can subscribe" on public.newsletter_subscribers
for insert with check (true);

drop policy if exists "admins read subscribers" on public.newsletter_subscribers;
create policy "admins read subscribers" on public.newsletter_subscribers
for select using (public.is_admin());

-- After creating your first account, promote it:
-- update public.profiles set role='admin' where id='YOUR_AUTH_USER_UUID';

-- Performance indexes for storefront and customer order history.
create index if not exists products_active_created_at_idx on public.products (active, created_at);
create index if not exists orders_customer_created_at_idx on public.orders (customer_id, created_at desc);
create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- Customers may create only orders belonging to their own authenticated account.
drop policy if exists "customers create own orders" on public.orders;
create policy "customers create own orders" on public.orders
for insert to authenticated
with check (customer_id = auth.uid());

-- Customers may create line items only for their own orders.
drop policy if exists "customers create own order items" on public.order_items;
create policy "customers create own order items" on public.order_items
for insert to authenticated
with check (exists(select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid()));
