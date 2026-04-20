import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import postgres from "postgres";
import bcrypt from "bcryptjs";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4];
const role = process.argv[5] || "Sales";

if (!email || !password || !name) {
  console.error("usage: node scripts/add-user.mjs <email> <password> <full_name> [role]");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 10);
await sql`
  insert into public.app_users (email, password_hash, full_name, role)
  values (${email}, ${hash}, ${name}, ${role})
  on conflict (email) do update set password_hash = excluded.password_hash, full_name = excluded.full_name, role = excluded.role
`;
console.log(`ready — login as ${email} / ${password} (role: ${role})`);
await sql.end();
