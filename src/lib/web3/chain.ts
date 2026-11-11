import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

/**
 * Token gate config — defaults to Circle's official test USDC on Base Sepolia
 * (free from https://faucet.circle.com). Overridable via env.
 */
export const TOKEN_GATE = {
  chain: baseSepolia,
  tokenAddress: (process.env.TOKEN_GATE_ADDRESS?.trim() ||
    "0x036CbD53842c5426634e7929541eC2318f3dCF7e") as `0x${string}`,
  symbol: process.env.TOKEN_GATE_SYMBOL?.trim() || "USDC",
  /** Minimum balance in whole tokens. */
  minBalance: Number(process.env.TOKEN_GATE_MIN ?? "1"),
  faucetUrl: "https://faucet.circle.com",
};

export const publicClient = createPublicClient({
  chain: baseSepolia,
  // Default public RPC is rate-limited; set TOKEN_GATE_RPC_URL (e.g. Alchemy) for production.
  transport: http(process.env.TOKEN_GATE_RPC_URL?.trim() || undefined, { timeout: 8_000 }),
});

export function explorerAddressUrl(address: string) {
  return `${baseSepolia.blockExplorers.default.url}/address/${address}`;
}
