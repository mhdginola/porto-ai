import { erc20Abi, formatUnits } from "viem";
import { publicClient, TOKEN_GATE } from "@/lib/web3/chain";

export type TokenGateResult =
  | { ok: true; balance: string; meets: boolean }
  | { ok: false; error: "rpc_unavailable" };

const CACHE_MS = 30_000;
const cache = new Map<string, { at: number; result: TokenGateResult }>();
let decimals: number | null = null;

/** ERC-20 balance check on-chain (cached briefly to spare the public RPC). Fails closed. */
export async function checkTokenGate(address: `0x${string}`): Promise<TokenGateResult> {
  const key = address.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.result;

  let result: TokenGateResult;
  try {
    decimals ??= await publicClient.readContract({
      address: TOKEN_GATE.tokenAddress,
      abi: erc20Abi,
      functionName: "decimals",
    });
    const raw = await publicClient.readContract({
      address: TOKEN_GATE.tokenAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    });
    const balance = formatUnits(raw, decimals);
    result = { ok: true, balance, meets: Number(balance) >= TOKEN_GATE.minBalance };
  } catch (err) {
    console.error("[token-gate] balance check failed:", err);
    result = { ok: false, error: "rpc_unavailable" };
  }
  if (result.ok) cache.set(key, { at: Date.now(), result });
  if (cache.size > 1000) cache.delete(cache.keys().next().value!);
  return result;
}
