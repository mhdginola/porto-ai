import { issueSiweNonce } from "@/lib/auth-demo/siwe";
import { POLICIES, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = await rateLimit(req, POLICIES.siweNonce);
  if (limited) return limited;
  return Response.json({ nonce: await issueSiweNonce() });
}
