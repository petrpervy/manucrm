"use server";
import { redirect } from "next/navigation";
import { login, logout, signup } from "@/lib/auth";

export async function loginAction(_: unknown, formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const s = await login(email, password);
  if (!s) return { error: "Invalid email or password" };
  redirect("/dashboard");
}

export async function signupAction(_: unknown, formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("full_name") || "");
  const role = String(formData.get("role") || "Sales") as any;
  try {
    await signup(email, password, fullName, role);
  } catch (e: any) {
    if (String(e.message || "").includes("duplicate")) return { error: "Email already in use" };
    return { error: "Could not create account" };
  }
  redirect("/dashboard");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}
