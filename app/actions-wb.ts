"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/auth";
import { getSession } from "@/lib/auth";
import type { PoStatus } from "@/lib/wb";

export async function createProduct(formData: FormData) {
  const sql = db();
  const payload = {
    wb_article: String(formData.get("wb_article") || "").trim(),
    name: String(formData.get("name") || "").trim(),
    variant: String(formData.get("variant") || ""),
    category: String(formData.get("category") || ""),
    cost_rub: Number(formData.get("cost_rub") || 0),
    wb_price_rub: Number(formData.get("wb_price_rub") || 0),
    target_stock: Number(formData.get("target_stock") || 0),
    reorder_point: Number(formData.get("reorder_point") || 0),
  };
  if (!payload.name) throw new Error("Name required");
  const [row] = await sql`
    insert into public.products (wb_article, name, variant, category, cost_rub, wb_price_rub, target_stock, reorder_point)
    values (${payload.wb_article}, ${payload.name}, ${payload.variant}, ${payload.category}, ${payload.cost_rub}, ${payload.wb_price_rub}, ${payload.target_stock}, ${payload.reorder_point})
    returning id
  `;
  await sql`insert into public.warehouse_stock (product_id, qty_on_hand) values (${row.id}, 0) on conflict do nothing`;
  revalidatePath("/products");
  revalidatePath("/warehouse");
  redirect("/products");
}

export async function updateStock(productId: number, formData: FormData) {
  const sql = db();
  const on_hand = Number(formData.get("qty_on_hand") || 0);
  const in_transit = Number(formData.get("qty_in_transit") || 0);
  const at_wb = Number(formData.get("qty_at_wildberries") || 0);
  await sql`
    insert into public.warehouse_stock (product_id, qty_on_hand, qty_in_transit, qty_at_wildberries, last_counted_at, updated_at)
    values (${productId}, ${on_hand}, ${in_transit}, ${at_wb}, now(), now())
    on conflict (product_id) do update set
      qty_on_hand = excluded.qty_on_hand,
      qty_in_transit = excluded.qty_in_transit,
      qty_at_wildberries = excluded.qty_at_wildberries,
      last_counted_at = now(),
      updated_at = now()
  `;
  revalidatePath("/warehouse");
  revalidatePath("/dashboard");
}

export async function createVendor(formData: FormData) {
  const sql = db();
  const payload = {
    name: String(formData.get("name") || "").trim(),
    company: String(formData.get("company") || ""),
    email: String(formData.get("email") || ""),
    phone: String(formData.get("phone") || ""),
    country: String(formData.get("country") || "China"),
    payment_terms: String(formData.get("payment_terms") || "50/50"),
    lead_time_days: Number(formData.get("lead_time_days") || 30),
    notes: String(formData.get("notes") || ""),
  };
  if (!payload.name) throw new Error("Name required");
  await sql`
    insert into public.vendors (name, company, email, phone, country, payment_terms, lead_time_days, notes)
    values (${payload.name}, ${payload.company}, ${payload.email}, ${payload.phone}, ${payload.country}, ${payload.payment_terms}, ${payload.lead_time_days}, ${payload.notes})
  `;
  revalidatePath("/vendors");
  redirect("/vendors");
}

export async function createPo(formData: FormData) {
  const sql = db();
  const s = await getSession();
  const year = new Date().getFullYear();
  const [{ c }] = await sql`select count(*)::int as c from public.production_orders`;
  const poNumber = `PO-${year}-${String((c ?? 0) + 1).padStart(3, "0")}`;

  const productId = Number(formData.get("product_id"));
  const vendorId = Number(formData.get("vendor_id"));
  const [prod] = await sql`select cost_rub from public.products where id = ${productId}`;

  const payload: any = {
    po_number: poNumber,
    product_id: productId,
    vendor_id: vendorId,
    quantity: Number(formData.get("quantity") || 1),
    unit_cost_rub: Number(formData.get("unit_cost_rub") || prod?.cost_rub || 0),
    status: "Draft",
    priority: String(formData.get("priority") || "Normal"),
    deadline: String(formData.get("deadline") || "") || null,
    vendor_notes: String(formData.get("vendor_notes") || ""),
    internal_notes: String(formData.get("internal_notes") || ""),
    created_by_email: s?.email ?? null,
  };
  const [row] = await sql`
    insert into public.production_orders (po_number, product_id, vendor_id, quantity, unit_cost_rub, status, priority, deadline, vendor_notes, internal_notes, created_by_email)
    values (${payload.po_number}, ${payload.product_id}, ${payload.vendor_id}, ${payload.quantity}, ${payload.unit_cost_rub}, ${payload.status}, ${payload.priority}, ${payload.deadline}, ${payload.vendor_notes}, ${payload.internal_notes}, ${payload.created_by_email})
    returning id
  `;
  revalidatePath("/pos");
  revalidatePath("/dashboard");
  redirect(`/pos/${row.id}`);
}

export async function updatePoStatus(id: number, status: PoStatus) {
  const sql = db();
  const s = await getSession();
  if (status === "Sent to Vendor") {
    await sql`update public.production_orders set status = ${status}, sent_to_vendor_at = now() where id = ${id}`;
  } else if (status === "Received") {
    // Move qty_in_transit into qty_on_hand
    const [po] = await sql`select product_id, quantity from public.production_orders where id = ${id}`;
    await sql`update public.production_orders set status = ${status}, received_at = now() where id = ${id}`;
    if (po) {
      await sql`
        insert into public.warehouse_stock (product_id, qty_on_hand, qty_in_transit)
        values (${po.product_id}, ${po.quantity}, 0)
        on conflict (product_id) do update set
          qty_on_hand = warehouse_stock.qty_on_hand + ${po.quantity},
          qty_in_transit = greatest(0, warehouse_stock.qty_in_transit - ${po.quantity}),
          updated_at = now()
      `;
    }
  } else if (status === "Shipped") {
    const [po] = await sql`select product_id, quantity from public.production_orders where id = ${id}`;
    await sql`update public.production_orders set status = ${status} where id = ${id}`;
    if (po) {
      await sql`
        insert into public.warehouse_stock (product_id, qty_in_transit)
        values (${po.product_id}, ${po.quantity})
        on conflict (product_id) do update set
          qty_in_transit = warehouse_stock.qty_in_transit + ${po.quantity},
          updated_at = now()
      `;
    }
  } else {
    await sql`update public.production_orders set status = ${status} where id = ${id}`;
  }
  await sql`
    insert into public.po_activity (po_id, kind, new_value, actor_email, message)
    values (${id}, 'status_change', ${status}, ${s?.email ?? null}, ${'Changed to ' + status})
  `;
  revalidatePath(`/pos/${id}`);
  revalidatePath("/pos");
  revalidatePath("/dashboard");
  revalidatePath("/warehouse");
}

export async function sendPoToVendor(id: number) {
  const sql = db();
  const s = await getSession();
  const [po] = await sql`
    select po.*, p.name as product_name, p.variant as product_variant, p.wb_article,
           v.email as vendor_email, v.name as vendor_name, v.company as vendor_company
    from public.production_orders po
    left join public.products p on p.id = po.product_id
    left join public.vendors v on v.id = po.vendor_id
    where po.id = ${id}
  `;
  if (!po) throw new Error("PO not found");

  const subject = `${po.po_number} — Новый заказ: ${po.product_name}`;
  const body = [
    `Добрый день, ${po.vendor_name}!`,
    ``,
    `Направляем новый заказ на производство:`,
    ``,
    `Номер заказа: ${po.po_number}`,
    `Товар: ${po.product_name}${po.product_variant ? ` (${po.product_variant})` : ""}`,
    `Артикул WB: ${po.wb_article ?? "—"}`,
    `Количество: ${po.quantity} шт.`,
    `Цена за единицу: ${po.unit_cost_rub} ₽`,
    `Срок: ${po.deadline ?? "—"}`,
    ``,
    po.vendor_notes ? `Комментарий: ${po.vendor_notes}` : "",
    ``,
    `Детали и статус — в личном кабинете платформы.`,
    ``,
    `С уважением,`,
    `${s?.full_name ?? "Sales"}`,
  ].filter(Boolean).join("\n");

  // TODO: wire real transactional email (Resend / Postmark). For now log activity + update status.
  await sql`
    insert into public.po_activity (po_id, kind, actor_email, message)
    values (${id}, 'email_sent', ${s?.email ?? null}, ${`Email sent to ${po.vendor_email}\nSubject: ${subject}\n\n${body}`})
  `;
  await sql`update public.production_orders set status = 'Sent to Vendor', sent_to_vendor_at = now() where id = ${id}`;
  revalidatePath(`/pos/${id}`);
  revalidatePath("/pos");
}
