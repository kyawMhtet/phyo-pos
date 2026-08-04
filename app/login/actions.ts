"use server";

import { redirect } from "next/navigation";
import { checkPassword, createSession, destroySession } from "@/lib/auth";

export type LoginState = { error?: string };

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) {
    return { error: "Wrong password" };
  }
  await createSession();
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
