// Wildberries seller pivot migration.
// Adds products, vendors, warehouse_stock, production_orders, po_activity.
// Extends app_users role to include Warehouse.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

await sql`alter table public.app_users drop constraint if exists app_users_role_check`;
await sql`alter table public.app_users add constraint app_users_role_check
  check (role in ('Sales','Production','Warehouse','Customer Service','Admin'))`;

await sql`
  create table if not exists public.products (
    id bigserial primary key,
    wb_article text unique,
    name text not null,
    variant text default '',
    category text default '',
    image_url text default '',
    cost_rub numeric(12,2) default 0,
    wb_price_rub numeric(12,2) default 0,
    target_stock int default 0,
    reorder_point int default 0,
    created_at timestamptz default now()
  )
`;

await sql`
  create table if not exists public.vendors (
    id bigserial primary key,
    name text not null,
    company text default '',
    email text default '',
    phone text default '',
    country text default 'China',
    payment_terms text default '50/50',
    lead_time_days int default 30,
    notes text default '',
    created_at timestamptz default now()
  )
`;

await sql`
  create table if not exists public.warehouse_stock (
    product_id bigint primary key references public.products(id) on delete cascade,
    qty_on_hand int default 0,
    qty_in_transit int default 0,
    qty_at_wildberries int default 0,
    last_counted_at timestamptz default now(),
    updated_at timestamptz default now()
  )
`;

await sql`
  create table if not exists public.production_orders (
    id bigserial primary key,
    po_number text unique,
    product_id bigint references public.products(id),
    vendor_id bigint references public.vendors(id),
    quantity int not null,
    unit_cost_rub numeric(12,2) default 0,
    total_cost_rub numeric(14,2) generated always as (quantity * unit_cost_rub) stored,
    status text not null default 'Draft'
      check (status in ('Draft','Sent to Vendor','In Production','Shipped','Received','Cancelled')),
    priority text default 'Normal' check (priority in ('Low','Normal','High','Urgent')),
    deadline date,
    vendor_notes text default '',
    internal_notes text default '',
    created_by_email text,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    sent_to_vendor_at timestamptz,
    received_at timestamptz
  )
`;

await sql`
  create table if not exists public.po_activity (
    id bigserial primary key,
    po_id bigint references public.production_orders(id) on delete cascade,
    kind text not null,
    old_value text,
    new_value text,
    actor_email text,
    message text,
    created_at timestamptz default now()
  )
`;

await sql`
  create or replace function public.log_po_changes() returns trigger language plpgsql as $$
  begin
    if TG_OP = 'INSERT' then
      insert into public.po_activity(po_id, kind, new_value, actor_email, message)
      values (NEW.id, 'created', NEW.status, NEW.created_by_email, 'PO created');
    elsif TG_OP = 'UPDATE' then
      if OLD.status is distinct from NEW.status then
        insert into public.po_activity(po_id, kind, old_value, new_value, message)
        values (NEW.id, 'status_change', OLD.status, NEW.status, 'Status changed');
      end if;
    end if;
    return NEW;
  end $$
`;
await sql`drop trigger if exists po_activity_trigger on public.production_orders`;
await sql`create trigger po_activity_trigger after insert or update on public.production_orders
  for each row execute function public.log_po_changes()`;

await sql`alter table public.products disable row level security`;
await sql`alter table public.vendors disable row level security`;
await sql`alter table public.warehouse_stock disable row level security`;
await sql`alter table public.production_orders disable row level security`;
await sql`alter table public.po_activity disable row level security`;

// Seed realistic WB demo data
const productCount = await sql`select count(*)::int as c from public.products`;
if (productCount[0].c === 0) {
  const seedProducts = [
    { wb_article: "142857301", name: "Силиконовый чехол iPhone 15", variant: "Прозрачный", category: "Аксессуары для телефонов", cost_rub: 85, wb_price_rub: 490, target_stock: 400, reorder_point: 120 },
    { wb_article: "142857302", name: "Силиконовый чехол iPhone 15", variant: "Черный матовый", category: "Аксессуары для телефонов", cost_rub: 85, wb_price_rub: 490, target_stock: 400, reorder_point: 120 },
    { wb_article: "198473021", name: "Худи оверсайз хлопок", variant: "Черный / M", category: "Одежда", cost_rub: 680, wb_price_rub: 2490, target_stock: 150, reorder_point: 40 },
    { wb_article: "198473022", name: "Худи оверсайз хлопок", variant: "Черный / L", category: "Одежда", cost_rub: 680, wb_price_rub: 2490, target_stock: 150, reorder_point: 40 },
    { wb_article: "204981115", name: "Бутылка для воды 1л", variant: "Розовая", category: "Спорт", cost_rub: 140, wb_price_rub: 690, target_stock: 300, reorder_point: 80 },
    { wb_article: "215770088", name: "Беспроводные наушники TWS", variant: "Белые", category: "Электроника", cost_rub: 420, wb_price_rub: 1890, target_stock: 200, reorder_point: 60 },
  ];
  for (const p of seedProducts) {
    const [row] = await sql`
      insert into public.products (wb_article, name, variant, category, cost_rub, wb_price_rub, target_stock, reorder_point)
      values (${p.wb_article}, ${p.name}, ${p.variant}, ${p.category}, ${p.cost_rub}, ${p.wb_price_rub}, ${p.target_stock}, ${p.reorder_point})
      returning id
    `;
    await sql`
      insert into public.warehouse_stock (product_id, qty_on_hand, qty_in_transit, qty_at_wildberries)
      values (${row.id}, ${Math.floor(Math.random() * p.target_stock * 0.8)}, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * p.target_stock * 0.5)})
    `;
  }

  const seedVendors = [
    { name: "Чен Вэй", company: "Shenzhen Aurora Electronics", email: "wei.chen@aurora-sz.cn", phone: "+86 755 8888 1234", country: "China", payment_terms: "30/70", lead_time_days: 25, notes: "TWS наушники, чехлы. Хорошее качество, медленнее сроки при пиках." },
    { name: "Мехмет Йылмаз", company: "Istanbul Cotton Mill", email: "mehmet@istcotton.com.tr", phone: "+90 212 555 4477", country: "Turkey", payment_terms: "50/50", lead_time_days: 21, notes: "Худи, футболки. Плотность 320г/м². Минимальный заказ 100шт." },
    { name: "Али Хан", company: "Karachi Apparel Works", email: "ali@karachiapparel.pk", phone: "+92 21 3456 7890", country: "Pakistan", payment_terms: "40/60", lead_time_days: 35, notes: "Бюджетный хлопок. Хорош для базовых линеек." },
    { name: "ООО Полимерпак", company: "Полимерпак", email: "orders@polimerpak.ru", phone: "+7 495 777 8899", country: "Russia", payment_terms: "100% предоплата", lead_time_days: 14, notes: "Бутылки, упаковка. Быстро, но дороже на 25%." },
  ];
  for (const v of seedVendors) {
    await sql`
      insert into public.vendors (name, company, email, phone, country, payment_terms, lead_time_days, notes)
      values (${v.name}, ${v.company}, ${v.email}, ${v.phone}, ${v.country}, ${v.payment_terms}, ${v.lead_time_days}, ${v.notes})
    `;
  }

  const prods = await sql`select id, wb_article, cost_rub from public.products order by id`;
  const vends = await sql`select id, name, company from public.vendors order by id`;
  const year = new Date().getFullYear();
  const seedPos = [
    { product_id: prods[0].id, vendor_id: vends[0].id, quantity: 500, unit_cost: 82, status: "In Production", priority: "Normal", deadline_days: 15 },
    { product_id: prods[2].id, vendor_id: vends[1].id, quantity: 200, unit_cost: 680, status: "Sent to Vendor", priority: "High", deadline_days: 28 },
    { product_id: prods[4].id, vendor_id: vends[3].id, quantity: 400, unit_cost: 135, status: "Shipped", priority: "Normal", deadline_days: 5 },
    { product_id: prods[5].id, vendor_id: vends[0].id, quantity: 250, unit_cost: 410, status: "Draft", priority: "Urgent", deadline_days: 30 },
  ];
  let n = 1;
  for (const po of seedPos) {
    const poNum = `PO-${year}-${String(n++).padStart(3, "0")}`;
    const deadline = new Date(Date.now() + po.deadline_days * 86400000).toISOString().slice(0,10);
    await sql`
      insert into public.production_orders (po_number, product_id, vendor_id, quantity, unit_cost_rub, status, priority, deadline, created_by_email, sent_to_vendor_at)
      values (${poNum}, ${po.product_id}, ${po.vendor_id}, ${po.quantity}, ${po.unit_cost}, ${po.status}, ${po.priority}, ${deadline}, 'demo@manucrm.io', ${po.status !== 'Draft' ? new Date().toISOString() : null})
    `;
  }
}

console.log("WB migration done.");
await sql.end();
