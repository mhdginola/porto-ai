import { cookies } from "next/headers";
import { newId } from "@/lib/payment-demo/server";

/** Anonymous visitor id — scopes Xendit-mode demo data per browser. */
const COOKIE = "pay_demo_cid";
const VALID = /^cus_[A-Za-z0-9_-]{8,40}$/;

export async function getCustomerId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing && VALID.test(existing)) return existing;

  const id = newId("cus");
  jar.set({
    name: COOKIE,
    value: id,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return id;
}
