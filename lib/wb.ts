import "server-only";
import { db } from "@/lib/auth";

export type PoStatus = "Draft" | "Sent to Vendor" | "In Production" | "Shipped" | "Received" | "Cancelled";
export const PO_STATUSES: PoStatus[] = ["Draft", "Sent to Vendor", "In Production", "Shipped", "Received", "Cancelled"];

export type Priority = "Low" | "Normal" | "High" | "Urgent";
export const PRIORITIES: Priority[] = ["Low", "Normal", "High", "Urgent"];

export type Product = {
  id: number;
  wb_article: string;
  name: string;
  variant: string;
  category: string;
  image_url: string;
  cost_rub: number;
  wb_price_rub: number;
  target_stock: number;
  reorder_point: number;
};

export type StockRow = Product & {
  qty_on_hand: number;
  qty_in_transit: number;
  qty_at_wildberries: number;
  total: number;
  low: boolean;
};

export type Vendor = {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  country: string;
  payment_terms: string;
  lead_time_days: number;
  notes: string;
};

export type Po = {
  id: number;
  po_number: string;
  product_id: number;
  vendor_id: number;
  quantity: number;
  unit_cost_rub: number;
  total_cost_rub: number;
  status: PoStatus;
  priority: Priority;
  deadline: string | null;
  vendor_notes: string;
  internal_notes: string;
  created_by_email: string | null;
  created_at: string;
  sent_to_vendor_at: string | null;
  received_at: string | null;
  product_name?: string;
  product_variant?: string;
  product_article?: string;
  vendor_name?: string;
  vendor_company?: string;
  vendor_email?: string;
  vendor_country?: string;
};

export function rub(n: number | string | null | undefined): string {
  const v = Number(n ?? 0);
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(v);
}

export async function getStock(): Promise<StockRow[]> {
  const sql = db();
  const rows = await sql`
    select p.*, coalesce(s.qty_on_hand,0) as qty_on_hand,
           coalesce(s.qty_in_transit,0) as qty_in_transit,
           coalesce(s.qty_at_wildberries,0) as qty_at_wildberries
    from public.products p
    left join public.warehouse_stock s on s.product_id = p.id
    order by p.name, p.variant
  `;
  return rows.map((r: any) => {
    const total = Number(r.qty_on_hand) + Number(r.qty_in_transit) + Number(r.qty_at_wildberries);
    return {
      ...r,
      cost_rub: Number(r.cost_rub),
      wb_price_rub: Number(r.wb_price_rub),
      qty_on_hand: Number(r.qty_on_hand),
      qty_in_transit: Number(r.qty_in_transit),
      qty_at_wildberries: Number(r.qty_at_wildberries),
      total,
      low: total <= Number(r.reorder_point),
    };
  });
}

export async function getProducts(): Promise<Product[]> {
  const sql = db();
  const rows = await sql`select * from public.products order by name, variant`;
  return rows.map((r: any) => ({ ...r, cost_rub: Number(r.cost_rub), wb_price_rub: Number(r.wb_price_rub) })) as Product[];
}

export async function getVendors(): Promise<Vendor[]> {
  const sql = db();
  const rows = await sql`select * from public.vendors order by country, company`;
  return rows as unknown as Vendor[];
}

export async function getVendor(id: number): Promise<Vendor | null> {
  const sql = db();
  const rows = await sql`select * from public.vendors where id = ${id} limit 1`;
  return (rows[0] as unknown as Vendor) ?? null;
}

export async function getPos(filter?: { status?: string; q?: string }): Promise<Po[]> {
  const sql = db();
  const rows = await sql`
    select po.*,
           p.name as product_name, p.variant as product_variant, p.wb_article as product_article,
           v.name as vendor_name, v.company as vendor_company, v.email as vendor_email, v.country as vendor_country
    from public.production_orders po
    left join public.products p on p.id = po.product_id
    left join public.vendors v on v.id = po.vendor_id
    where (${filter?.status ?? null}::text is null or po.status = ${filter?.status ?? null})
      and (${filter?.q ?? null}::text is null or
           po.po_number ilike '%' || ${filter?.q ?? ""} || '%' or
           p.name ilike '%' || ${filter?.q ?? ""} || '%')
    order by po.created_at desc
  `;
  return rows.map((r: any) => ({
    ...r,
    unit_cost_rub: Number(r.unit_cost_rub),
    total_cost_rub: Number(r.total_cost_rub),
  })) as Po[];
}

export async function getPo(id: number): Promise<Po | null> {
  const sql = db();
  const rows = await sql`
    select po.*,
           p.name as product_name, p.variant as product_variant, p.wb_article as product_article,
           v.name as vendor_name, v.company as vendor_company, v.email as vendor_email, v.country as vendor_country
    from public.production_orders po
    left join public.products p on p.id = po.product_id
    left join public.vendors v on v.id = po.vendor_id
    where po.id = ${id}
    limit 1
  `;
  if (!rows[0]) return null;
  return { ...rows[0], unit_cost_rub: Number(rows[0].unit_cost_rub), total_cost_rub: Number(rows[0].total_cost_rub) } as Po;
}

export async function getPoActivity(poId: number) {
  const sql = db();
  return await sql`select * from public.po_activity where po_id = ${poId} order by created_at desc`;
}

export async function getWbDashboard() {
  const sql = db();
  const stock = await getStock();
  const lowStock = stock.filter(s => s.low);
  const [pos] = await sql`
    select count(*)::int as total,
      count(*) filter (where status = 'Draft')::int as draft,
      count(*) filter (where status = 'Sent to Vendor')::int as sent,
      count(*) filter (where status = 'In Production')::int as in_production,
      count(*) filter (where status = 'Shipped')::int as shipped,
      count(*) filter (where status = 'Received')::int as received,
      coalesce(sum(total_cost_rub) filter (where status in ('Sent to Vendor','In Production','Shipped')),0) as open_value
    from public.production_orders
  `;
  const [vendorCount] = await sql`select count(*)::int as c from public.vendors`;
  const [productCount] = await sql`select count(*)::int as c from public.products`;
  return {
    stock,
    lowStock,
    pos: {
      total: Number(pos.total),
      draft: Number(pos.draft),
      sent: Number(pos.sent),
      in_production: Number(pos.in_production),
      shipped: Number(pos.shipped),
      received: Number(pos.received),
      open_value: Number(pos.open_value),
    },
    vendorCount: Number(vendorCount.c),
    productCount: Number(productCount.c),
  };
}
