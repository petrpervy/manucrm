"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/types";

export async function createCustomerInline(formData: FormData): Promise<{ id: number; name: string; company: string }> {
  const supabase = createClient();
  const payload = {
    name: String(formData.get("name") || "").trim(),
    company: String(formData.get("company") || ""),
    email: String(formData.get("email") || ""),
    phone: String(formData.get("phone") || ""),
    industry: String(formData.get("industry") || ""),
  };
  if (!payload.name) throw new Error("Name required");
  const { data, error } = await supabase.from("customers").insert(payload).select("id, name, company").single();
  if (error) throw error;
  revalidatePath("/customers");
  revalidatePath("/orders/new");
  return data as any;
}

export async function createCustomer(formData: FormData) {
  const supabase = createClient();
  const payload = {
    name: String(formData.get("name") || "").trim(),
    company: String(formData.get("company") || ""),
    email: String(formData.get("email") || ""),
    phone: String(formData.get("phone") || ""),
    address: String(formData.get("address") || ""),
    industry: String(formData.get("industry") || ""),
    notes: String(formData.get("notes") || ""),
  };
  if (!payload.name) throw new Error("Name required");
  const { data, error } = await supabase.from("customers").insert(payload).select("id").single();
  if (error) throw error;
  revalidatePath("/customers");
  redirect(`/customers/${data.id}`);
}

export async function updateCustomer(id: number, formData: FormData) {
  const supabase = createClient();
  const payload = {
    name: String(formData.get("name") || "").trim(),
    company: String(formData.get("company") || ""),
    email: String(formData.get("email") || ""),
    phone: String(formData.get("phone") || ""),
    address: String(formData.get("address") || ""),
    industry: String(formData.get("industry") || ""),
    notes: String(formData.get("notes") || ""),
  };
  const { error } = await supabase.from("customers").update(payload).eq("id", id);
  if (error) throw error;
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
}

export async function createOrder(formData: FormData) {
  const supabase = createClient();
  const { getSession } = await import("@/lib/auth");
  const s = await getSession();
  const year = new Date().getFullYear();
  const { count } = await supabase.from("orders").select("*", { count: "exact", head: true });
  const orderNumber = `ORD-${year}-${String((count ?? 0) + 1).padStart(3, "0")}`;

  const payload: any = {
    customer_id: Number(formData.get("customer_id")),
    order_number: orderNumber,
    product_name: String(formData.get("product_name") || ""),
    quantity: Number(formData.get("quantity") || 1),
    unit_price: Number(formData.get("unit_price") || 0),
    specifications: String(formData.get("specifications") || ""),
    deadline: String(formData.get("deadline") || "") || null,
    status: String(formData.get("status") || "Quote"),
    priority: String(formData.get("priority") || "Normal"),
    notes: String(formData.get("notes") || ""),
    created_by_email: s?.email ?? null,
  };
  const { data, error } = await supabase.from("orders").insert(payload).select("id").single();
  if (error) throw error;
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  redirect(`/orders/${data.id}`);
}

export async function updateOrder(id: number, formData: FormData) {
  const supabase = createClient();
  const payload: any = {
    product_name: String(formData.get("product_name") || ""),
    quantity: Number(formData.get("quantity") || 1),
    unit_price: Number(formData.get("unit_price") || 0),
    specifications: String(formData.get("specifications") || ""),
    deadline: String(formData.get("deadline") || "") || null,
    status: String(formData.get("status") || "Quote"),
    priority: String(formData.get("priority") || "Normal"),
    notes: String(formData.get("notes") || ""),
  };
  const { error } = await supabase.from("orders").update(payload).eq("id", id);
  if (error) throw error;
  revalidatePath(`/orders/${id}`);
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/production");
}

export async function updateOrderStatus(id: number, status: OrderStatus) {
  const supabase = createClient();
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) throw error;
  revalidatePath("/orders");
  revalidatePath("/production");
  revalidatePath("/dashboard");
}
