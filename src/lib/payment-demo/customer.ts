import { cookies } from "next/headers";
import { getAuthDemoSession } from "@/lib/auth-demo/session";
import type { XenditDemoState } from "@/lib/payment-demo/billing";
import { newId } from "@/lib/payment-demo/server";

/** Anonymous visitor id — scopes Xendit-mode demo data per browser. */
const COOKIE = "pay_demo_cid";
const VALID = /^cus_[A-Za-z0-9_-]{8,40}$/;

export type BillingCustomer = {
  id: string;
  account: XenditDemoState["account"];
};

/** Billing customer id for an Auth-demo user. */
export function customerIdForUser(userId: number): string {
  return `usr_${userId}`;
}

/**
 * Signed in to the Auth demo → the subscription belongs to that account (so it
 * can unlock plan-gated modules there). Otherwise → an anonymous per-browser id.
 */
export async function getBillingCustomer(): Promise<BillingCustomer> {
  const user = await getAuthDemoSession();
  if (user) {
    return {
      id: customerIdForUser(user.id),
      account: { name: user.name, email: user.email },
    };
  }

  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing && VALID.test(existing)) return { id: existing, account: null };

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
  return { id, account: null };
}

export async function getCustomerId(): Promise<string> {
  return (await getBillingCustomer()).id;
}
