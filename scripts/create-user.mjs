// Creates a confirmed demo user via Supabase Admin API.
// Usage: node scripts/create-user.mjs
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const email = process.argv[2] || "demo@manucrm.io";
const password = process.argv[3] || "password123";
const name = process.argv[4] || "Gleb Romanov";
const role = process.argv[5] || "Admin";

// Use Supabase's built-in function to create confirmed user via auth schema
// We hash password via crypt() — Supabase uses bcrypt.
const [existing] = await sql`select id from auth.users where email = ${email} limit 1`;
if (existing) {
  console.log("User already exists:", email);
  await sql`update public.user_profiles set full_name = ${name}, role = ${role} where id = ${existing.id}`;
  await sql.end();
  process.exit(0);
}

const [row] = await sql`
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    ${email},
    crypt(${password}, gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    ${JSON.stringify({ full_name: name, role })}::jsonb,
    '', '', '', ''
  )
  returning id
`;
console.log("Created user:", email, row.id);

// Identity row — required by GoTrue for password sign-in
await sql`
  insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), ${row.id}, ${row.id}, ${JSON.stringify({ sub: row.id, email, email_verified: true, phone_verified: false })}::jsonb, 'email', now(), now(), now())
`;

// Profile
await sql`
  insert into public.user_profiles (id, full_name, role)
  values (${row.id}, ${name}, ${role})
  on conflict (id) do update set full_name = excluded.full_name, role = excluded.role
`;

await sql.end();
