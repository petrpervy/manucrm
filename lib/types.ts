export type Role = "Sales" | "Production" | "Customer Service" | "Admin";
export type OrderStatus = "Quote" | "Received" | "In Production" | "Completed" | "Delivered" | "Cancelled";
export type Priority = "Low" | "Normal" | "High" | "Urgent";

export const ORDER_STATUSES: OrderStatus[] = ["Quote", "Received", "In Production", "Completed", "Delivered", "Cancelled"];
export const PRIORITIES: Priority[] = ["Low", "Normal", "High", "Urgent"];
export const ROLES: Role[] = ["Sales", "Production", "Customer Service", "Admin"];

export type Customer = {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  industry: string;
  notes: string;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: number;
  customer_id: number;
  order_number: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  specifications: string;
  deadline: string | null;
  status: OrderStatus;
  priority: Priority;
  notes: string;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
};

export type Profile = {
  id: string;
  full_name: string | null;
  role: Role;
  avatar_url: string | null;
};
