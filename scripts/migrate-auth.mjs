import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import postgres from "postgres";
import bcrypt from "bcryptjs";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

// Create our own users table — no dep on auth.* schema
await sql`
  create table if not exists public.app_users (
    id bigserial primary key,
    email text unique not null,
    password_hash text not null,
    full_name text not null default '',
    role text not null default 'Sales' check (role in ('Sales','Production','Customer Service','Admin')),
    created_at timestamptz default now()
  )
`;

// Drop Supabase-auth profile linkage; replace with simple FK via email on our table
// (we'll keep user_profiles as-is but no longer reference auth.users)
await sql`drop table if exists public.user_profiles cascade`;

// Drop foreign keys on orders/customers that referenced auth.users-backed profiles
await sql`alter table public.customers drop column if exists owner_id`;
await sql`alter table public.orders drop column if exists assigned_to`;
await sql`alter table public.orders drop column if exists created_by`;
await sql`alter table public.order_activity drop column if exists actor_id`;

// Simpler: store actor as email text
await sql`alter table public.orders add column if not exists created_by_email text`;
await sql`alter table public.orders add column if not exists assigned_to_email text`;
await sql`alter table public.order_activity add column if not exists actor_email text`;

// Disable RLS (we now gate at app layer with our cookie auth)
await sql`alter table public.customers disable row level security`;
await sql`alter table public.orders disable row level security`;
await sql`alter table public.order_activity disable row level security`;
await sql`alter table public.app_users disable row level security`;

// Re-create log trigger to use email actor
await sql`
  create or replace function public.log_order_changes() returns trigger language plpgsql as $$
  begin
    if TG_OP = 'INSERT' then
      insert into public.order_activity(order_id, kind, new_value, actor_email)
      values (NEW.id, 'created', NEW.status, NEW.created_by_email);
    elsif TG_OP = 'UPDATE' then
      if OLD.status is distinct from NEW.status then
        insert into public.order_activity(order_id, kind, old_value, new_value, actor_email)
        values (NEW.id, 'status_change', OLD.status, NEW.status, NEW.assigned_to_email);
      end if;
      if OLD.priority is distinct from NEW.priority then
        insert into public.order_activity(order_id, kind, old_value, new_value, actor_email)
        values (NEW.id, 'priority_change', OLD.priority, NEW.priority, NEW.assigned_to_email);
      end if;
    end if;
    return NEW;
  end $$
`;

// Seed a starter admin user
const email = "demo@manucrm.io";
const hash = await bcrypt.hash("password123", 10);
await sql`
  insert into public.app_users (email, password_hash, full_name, role)
  values (${email}, ${hash}, 'Gleb Romanov', 'Admin')
  on conflict (email) do update set password_hash = excluded.password_hash
`;
console.log("ready — login as", email, "/ password123");

await sql.end();
