"use server";

import { redirect } from "next/navigation";
import { checkPassword, createSession, destroySession } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";

export type LoginState = { error?: string };

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const { dict } = await getDictionary();
  const password = String(formData.get("password") ?? "");
  if (!password) return { error: dict.login.passwordRequired };
  if (!checkPassword(password)) return { error: dict.login.wrongPassword };

  await createSession();
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
