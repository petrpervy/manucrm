import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import postgres from "postgres";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-only-secret-change-me-in-production-manucrm-2026"
);

let _sql: ReturnType<typeof postgres> | null = null;
export function db() {
  if (!_sql) _sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  return _sql;
}

export type Session = {
  id: number;
  email: string;
  full_name: string;
  role: "Sales" | "Production" | "Customer Service" | "Admin";
};

const COOKIE = "manucrm_session";

export async function signSession(s: Session) {
  return await new SignJWT(s as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const c = cookies().get(COOKIE);
  if (!c) return null;
  return await verifySession(c.value);
}

export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) throw new Error("Unauthenticated");
  return s;
}

export async function login(email: string, password: string): Promise<Session | null> {
  const sql = db();
  const [user] = await sql`select id, email, password_hash, full_name, role from public.app_users where lower(email) = lower(${email}) limit 1`;
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash as string);
  if (!ok) return null;
  const session: Session = { id: user.id as number, email: user.email as string, full_name: user.full_name as string, role: user.role as Session["role"] };
  const token = await signSession(session);
  cookies().set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return session;
}

export async function signup(email: string, password: string, fullName: string, role: Session["role"]) {
  const sql = db();
  const hash = await bcrypt.hash(password, 10);
  const [u] = await sql`insert into public.app_users (email, password_hash, full_name, role) values (${email}, ${hash}, ${fullName}, ${role}) returning id, email, full_name, role`;
  const session: Session = { id: u.id as number, email: u.email as string, full_name: u.full_name as string, role: u.role as Session["role"] };
  const token = await signSession(session);
  cookies().set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return session;
}

export async function logout() {
  cookies().delete(COOKIE);
}
