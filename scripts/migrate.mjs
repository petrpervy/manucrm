import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const schema = `
create extension if not exists "uuid-ossp";

-- user_profiles extends auth.users with role
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'Sales' check (role in ('Sales','Production','Customer Service','Admin')),
  avatar_url text,
  created_at timestamptz default now()
);

create table if not exists public.customers (
  id bigserial primary key,
  name text not null,
  company text default '',
  email text default '',
  phone text default '',
  address text default '',
  industry text default '',
  notes text default '',
  owner_id uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_customers_name on public.customers using gin (to_tsvector('english', coalesce(name,'') || ' ' || coalesce(company,'')));

create table if not exists public.orders (
  id bigserial primary key,
  customer_id bigint not null references public.customers(id) on delete restrict,
  order_number text unique not null,
  product_name text not null,
  quantity integer not null default 1,
  unit_price numeric(12,2) default 0,
  specifications text default '',
  deadline date,
  status text not null default 'Quote' check (status in ('Quote','Received','In Production','Completed','Delivered','Cancelled')),
  priority text not null default 'Normal' check (priority in ('Low','Normal','High','Urgent')),
  notes text default '',
  assigned_to uuid references public.user_profiles(id) on delete set null,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_deadline on public.orders(deadline);
create index if not exists idx_orders_customer on public.orders(customer_id);

create table if not exists public.order_activity (
  id bigserial primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  kind text not null check (kind in ('status_change','note','assignment','created','priority_change')),
  old_value text,
  new_value text,
  content text,
  actor_id uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists idx_activity_order on public.order_activity(order_id, created_at desc);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists customers_touch on public.customers;
create trigger customers_touch before update on public.customers
  for each row execute function public.touch_updated_at();

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- Auto-log status changes to activity
create or replace function public.log_order_changes() returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.order_activity(order_id, kind, new_value, actor_id)
    values (NEW.id, 'created', NEW.status, NEW.created_by);
  elsif TG_OP = 'UPDATE' then
    if OLD.status is distinct from NEW.status then
      insert into public.order_activity(order_id, kind, old_value, new_value, actor_id)
      values (NEW.id, 'status_change', OLD.status, NEW.status, NEW.assigned_to);
    end if;
    if OLD.priority is distinct from NEW.priority then
      insert into public.order_activity(order_id, kind, old_value, new_value, actor_id)
      values (NEW.id, 'priority_change', OLD.priority, NEW.priority, NEW.assigned_to);
    end if;
    if OLD.assigned_to is distinct from NEW.assigned_to then
      insert into public.order_activity(order_id, kind, new_value, actor_id)
      values (NEW.id, 'assignment', NEW.assigned_to::text, NEW.assigned_to);
    end if;
  end if;
  return NEW;
end $$;

drop trigger if exists orders_log on public.orders;
create trigger orders_log after insert or update on public.orders
  for each row execute function public.log_order_changes();

-- Auto-create profile on signup
create or replace function public.handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into public.user_profiles (id, full_name, role)
  values (NEW.id, coalesce(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), coalesce(NEW.raw_user_meta_data->>'role','Sales'))
  on conflict (id) do nothing;
  return NEW;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.user_profiles enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_activity enable row level security;

drop policy if exists "profiles_read_all" on public.user_profiles;
create policy "profiles_read_all" on public.user_profiles for select using (auth.uid() is not null);
drop policy if exists "profiles_update_self" on public.user_profiles;
create policy "profiles_update_self" on public.user_profiles for update using (id = auth.uid());

-- Authenticated users can do everything to CRM data (role enforcement happens in app)
drop policy if exists "customers_all" on public.customers;
create policy "customers_all" on public.customers for all using (auth.uid() is not null) with check (auth.uid() is not null);
drop policy if exists "orders_all" on public.orders;
create policy "orders_all" on public.orders for all using (auth.uid() is not null) with check (auth.uid() is not null);
drop policy if exists "activity_all" on public.order_activity;
create policy "activity_all" on public.order_activity for all using (auth.uid() is not null) with check (auth.uid() is not null);
`;

async function main() {
  console.log("running migration…");
  await sql.unsafe(schema);
  console.log("schema applied.");

  // Seed only if empty
  const [{ count }] = await sql`select count(*)::int as count from public.customers`;
  if (count === 0) {
    console.log("seeding demo data…");
    const customers = [
      ["Acme Industries", "Acme Corp", "john.smith@acme.com", "555-0101", "123 Industrial Blvd, Rochester NY", "Automotive", "Long-term account. Prefers weekly updates."],
      ["Rochester Metals", "Rochester Metals LLC", "orders@rochestermetals.com", "555-0182", "456 Factory Rd, Rochester NY", "Metals", "Rush orders common. Always confirm deadline."],
      ["Great Lakes Fabrication", "GL Fab Inc", "procurement@glfab.com", "555-0247", "789 Mill St, Buffalo NY", "Fabrication", "New client as of Jan 2026."],
      ["Empire State Manufacturing", "ESM Group", "buying@esmgroup.net", "555-0315", "321 Commerce Ave, Syracuse NY", "Industrial", "High-volume orders. Net-30 terms."],
      ["Niagara Precision", "Niagara Precision Works", "hello@niagaraprec.com", "555-0422", "88 Falls Ave, Niagara Falls NY", "Aerospace", "Tight tolerance work — AS9100 certified required."],
      ["Finger Lakes Steel", "FLS Holdings", "jane@fingerlakessteel.com", "555-0588", "12 Lakeview Rd, Geneva NY", "Steel", "Quarterly reviews. Strong relationship."],
    ];
    const ids = [];
    for (const c of customers) {
      const [r] = await sql`insert into public.customers (name,company,email,phone,address,industry,notes) values (${c[0]},${c[1]},${c[2]},${c[3]},${c[4]},${c[5]},${c[6]}) returning id`;
      ids.push(r.id);
    }
    const orders = [
      [ids[0], "ORD-2026-001", "Steel Brackets", 500, 12.5, "Grade A steel, 4-hole bracket, 2\" x 4\"", "2026-04-25", "Delivered", "Normal", "Completed ahead of schedule."],
      [ids[0], "ORD-2026-002", "Mounting Plates", 200, 28, "Stainless, 1/4\" thick, 6\" x 6\"", "2026-05-10", "In Production", "High", ""],
      [ids[1], "ORD-2026-003", "Custom Flanges", 75, 62, "Carbon steel, ASME B16.5 standard", "2026-04-30", "Completed", "Normal", "QC passed 4/15."],
      [ids[1], "ORD-2026-004", "Pipe Fittings", 1000, 4.75, "Schedule 40, 1\" NPT threads", "2026-05-20", "Received", "Urgent", "Rush order confirmed."],
      [ids[2], "ORD-2026-005", "Welded Frames", 30, 145, "Square tube, 1.5\" x 1.5\", powder coated black", "2026-05-05", "In Production", "Normal", ""],
      [ids[3], "ORD-2026-006", "Sheet Metal Panels", 400, 18, "16-gauge cold-rolled, laser cut to spec", "2026-05-15", "Received", "Normal", "Drawings attached to email."],
      [ids[4], "ORD-2026-007", "Aluminum Housings", 150, 87, "6061-T6, anodized, precision machined", "2026-06-01", "Quote", "High", "Awaiting final drawing approval."],
      [ids[5], "ORD-2026-008", "I-Beams", 48, 320, "A36 structural, 20ft lengths", "2026-04-22", "In Production", "Urgent", "Construction deadline critical."],
      [ids[2], "ORD-2026-009", "Gaskets", 2500, 2.1, "Nitrile rubber, custom cut", "2026-05-28", "Received", "Low", ""],
      [ids[5], "ORD-2026-010", "Machined Shafts", 60, 195, "4140 steel, heat treated, ground finish", "2026-06-10", "Quote", "Normal", "Pending customer spec review."],
    ];
    for (const o of orders) {
      await sql`insert into public.orders (customer_id, order_number, product_name, quantity, unit_price, specifications, deadline, status, priority, notes) values (${o[0]},${o[1]},${o[2]},${o[3]},${o[4]},${o[5]},${o[6]},${o[7]},${o[8]},${o[9]})`;
    }
    console.log(`seeded ${customers.length} customers, ${orders.length} orders`);
  } else {
    console.log(`already has ${count} customers — skipping seed`);
  }

  await sql.end();
  console.log("done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
