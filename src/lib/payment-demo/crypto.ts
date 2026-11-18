/**
 * Stablecoin (USDC) payment rail for the subscription demo — testnet only.
 *
 * The server signs an EIP-712 quote {invoiceId, amount, deadline}; the
 * SubscriptionPayments contract (contracts/src) accepts a payment only with that
 * signature, so the amount is enforced on-chain and each invoice is payable once.
 * Settlement is verified by reading `paidBy(invoiceId)` at a block that already
 * has enough confirmations — no event scanning, and reorg-safe.
 */
import {
  createPublicClient,
  getAddress,
  http,
  isAddress,
  keccak256,
  parseAbi,
  stringToHex,
  type Address,
  type Hex,
  type PublicClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia, foundry } from "viem/chains";
import type { CryptoQuote, CryptoRailInfo } from "@/lib/payment-demo/billing";

export type { CryptoQuote, CryptoRailInfo };

/** Testnets only: this is a public portfolio and must never move real money. */
const SUPPORTED_CHAINS = { [baseSepolia.id]: baseSepolia, [foundry.id]: foundry } as const;

export const PAYMENTS_ABI = parseAbi([
  "function pay(bytes32 invoiceId, uint256 amount, uint256 deadline, bytes signature)",
  "function paidBy(bytes32 invoiceId) view returns (address)",
  "function signer() view returns (address)",
  "event InvoicePaid(bytes32 indexed invoiceId, address indexed payer, uint256 amount)",
]);

const QUOTE_TYPES = {
  Quote: [
    { name: "invoiceId", type: "bytes32" },
    { name: "amount", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

function env(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

function loadConfig() {
  const chainId = Number(env("CRYPTO_CHAIN_ID") ?? baseSepolia.id);
  const chain = SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS];
  const contract = env("CRYPTO_PAYMENTS_CONTRACT");
  const signerKey = env("CRYPTO_SIGNER_PRIVATE_KEY");
  if (!chain || !contract || !isAddress(contract) || !signerKey || !/^0x[0-9a-fA-F]{64}$/.test(signerKey)) {
    return null;
  }
  return {
    chain,
    contract: getAddress(contract),
    signer: privateKeyToAccount(signerKey as Hex),
    token: getAddress(env("CRYPTO_TOKEN_ADDRESS") ?? "0x036CbD53842c5426634e7929541eC2318f3dCF7e"),
    tokenSymbol: env("CRYPTO_TOKEN_SYMBOL") ?? "USDC",
    tokenDecimals: Number(env("CRYPTO_TOKEN_DECIMALS") ?? 6),
    /** Demo FX rate: how many IDR one token is worth (testnet pricing, see UI). */
    idrPerToken: BigInt(env("CRYPTO_IDR_PER_TOKEN") ?? "100000"),
    confirmations: Math.max(1, Number(env("CRYPTO_CONFIRMATIONS") ?? 2)),
    rpcUrl: env("CRYPTO_RPC_URL") ?? env("TOKEN_GATE_RPC_URL"),
  };
}

let cached: ReturnType<typeof loadConfig> | undefined;
function config() {
  if (cached === undefined) cached = loadConfig();
  return cached;
}

export function isCryptoEnabled(): boolean {
  return config() !== null;
}

function requireConfig() {
  const c = config();
  if (!c) throw new Error("Crypto payments are not configured");
  return c;
}

let client: PublicClient | null = null;
function publicClient(): PublicClient {
  const c = requireConfig();
  client ??= createPublicClient({
    chain: c.chain,
    transport: http(c.rpcUrl, { timeout: 10_000 }),
  }) as PublicClient;
  return client;
}

export function cryptoRailInfo(): CryptoRailInfo | null {
  const c = config();
  if (!c) return null;
  const isBase = c.chain.id === baseSepolia.id;
  return {
    chainId: c.chain.id,
    chainName: c.chain.name,
    explorerUrl: c.chain.blockExplorers?.default.url ?? null,
    // Public RPC only (used for wallet_addEthereumChain); never the private key'd URL.
    rpcUrl: c.chain.rpcUrls.default.http[0] ?? null,
    contract: c.contract,
    token: c.token,
    tokenSymbol: c.tokenSymbol,
    tokenDecimals: c.tokenDecimals,
    idrPerToken: Number(c.idrPerToken),
    faucetUrl: isBase ? "https://faucet.circle.com" : null,
  };
}

/** On-chain invoice id: keccak256 of our external invoice reference. */
export function onchainInvoiceId(externalId: string): Hex {
  return keccak256(stringToHex(externalId));
}

/** IDR total → token base units, rounded up so the merchant is never short. */
export function idrToTokenUnits(idr: number): bigint {
  const c = requireConfig();
  const scale = BigInt(10) ** BigInt(c.tokenDecimals);
  return (BigInt(idr) * scale + c.idrPerToken - BigInt(1)) / c.idrPerToken;
}

export async function signQuote(externalId: string, idrTotal: number, ttlSeconds: number): Promise<CryptoQuote> {
  const c = requireConfig();
  const invoiceId = onchainInvoiceId(externalId);
  const amount = idrToTokenUnits(idrTotal);
  const deadline = Math.floor(Date.now() / 1000) + ttlSeconds;
  const signature = await c.signer.signTypedData({
    domain: { name: "SubscriptionPayments", version: "1", chainId: c.chain.id, verifyingContract: c.contract },
    types: QUOTE_TYPES,
    primaryType: "Quote",
    message: { invoiceId, amount, deadline: BigInt(deadline) },
  });
  return {
    invoiceId,
    amount: amount.toString(),
    deadline,
    signature,
    chainId: c.chain.id,
    contract: c.contract,
    token: c.token,
    tokenSymbol: c.tokenSymbol,
    tokenDecimals: c.tokenDecimals,
  };
}

export type SettlementStatus =
  | { status: "paid"; payer: Address; blockNumber: bigint }
  | { status: "unconfirmed" } // paid in a recent block, waiting for confirmations
  | { status: "unpaid" };

/** Read `paidBy` at the latest block that has the required confirmations. */
export async function checkSettlement(invoiceId: Hex): Promise<SettlementStatus> {
  const c = requireConfig();
  const pc = publicClient();
  // cacheTime 0: viem caches the block number for a few seconds by default,
  // which would make the confirmation count lag behind the chain.
  const latest = await pc.getBlockNumber({ cacheTime: 0 });
  const confirmedBlock = latest - BigInt(c.confirmations - 1);

  const read = (blockNumber: bigint) =>
    pc.readContract({ address: c.contract, abi: PAYMENTS_ABI, functionName: "paidBy", args: [invoiceId], blockNumber });

  const payer = await read(confirmedBlock);
  if (payer !== "0x0000000000000000000000000000000000000000") {
    return { status: "paid", payer, blockNumber: confirmedBlock };
  }
  if (confirmedBlock !== latest) {
    const recent = await read(latest);
    if (recent !== "0x0000000000000000000000000000000000000000") return { status: "unconfirmed" };
  }
  return { status: "unpaid" };
}

/** Sanity check used at startup / in tests: the contract trusts our signer key. */
export async function contractSignerMatches(): Promise<boolean> {
  const c = requireConfig();
  const onchain = await publicClient().readContract({
    address: c.contract,
    abi: PAYMENTS_ABI,
    functionName: "signer",
  });
  return getAddress(onchain) === c.signer.address;
}

export function cryptoChannelLabel(): string {
  const c = requireConfig();
  return `${c.tokenSymbol} · ${c.chain.name}`;
}

export function explorerTxUrl(txHash: string): string | null {
  const base = config()?.chain.blockExplorers?.default.url;
  return base && /^0x[0-9a-fA-F]{64}$/.test(txHash) ? `${base}/tx/${txHash}` : null;
}
