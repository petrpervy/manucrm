import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const email = "demo@manucrm.io";
const [u] = await sql`select id, email from auth.users where email = ${email}`;
if (!u) { console.log("no user"); process.exit(1); }

// Add identities row if missing (required by GoTrue)
const [ident] = await sql`select id from auth.identities where user_id = ${u.id} limit 1`;
if (!ident) {
  await sql`
    insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), ${u.id}, ${u.id}, ${JSON.stringify({ sub: u.id, email: u.email, email_verified: true, phone_verified: false })}::jsonb, 'email', now(), now(), now())
  `;
  console.log("identity added");
} else {
  console.log("identity exists");
}
await sql.end();
