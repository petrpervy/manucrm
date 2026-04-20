import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL, { prepare: false });
await sql`drop table if exists public.order_activity cascade`;
await sql`drop table if exists public.order_status_log cascade`;
await sql`drop table if exists public.orders cascade`;
await sql`drop table if exists public.customers cascade`;
await sql`drop table if exists public.user_profiles cascade`;
console.log("tables dropped");
await sql.end();
