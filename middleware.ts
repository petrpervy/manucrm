import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-only-secret-change-me-in-production-manucrm-2026"
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isApiOrAsset = pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".");
  if (isApiOrAsset) return NextResponse.next();

  const token = request.cookies.get("manucrm_session")?.value;
  let authed = false;
  if (token) {
    try { await jwtVerify(token, secret); authed = true; } catch {}
  }

  if (!authed && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (authed && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
