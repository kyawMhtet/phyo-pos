import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "pos_session";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function expectedSessionToken(): string {
  const password = requireEnv("POS_PASSWORD");
  const secret = requireEnv("SESSION_SECRET");
  return createHmac("sha256", secret).update(password).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function checkPassword(password: string): boolean {
  return safeEqual(password, requireEnv("POS_PASSWORD"));
}

export function isValidSessionValue(value: string | undefined): boolean {
  if (!value) return false;
  return safeEqual(value, expectedSessionToken());
}

export async function createSession() {
  const store = await cookies();
  store.set(SESSION_COOKIE, expectedSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
