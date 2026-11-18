"use client";

import { Check, ExternalLink, Loader2, Wallet, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  defineChain,
  erc20Abi,
  formatUnits,
  getAddress,
  parseAbi,
  type Address,
  type Hex,
} from "viem";
import { useLocale } from "@/components/layout/LocaleProvider";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatIdr } from "@/lib/format-idr";
import type { TranslationKey } from "@/lib/i18n/translations";
import type {
  CryptoQuote,
  CryptoRailInfo,
  XenditDemoState,
} from "@/lib/payment-demo/billing";
import { cn } from "@/lib/utils";

// Mirrors contracts/src/SubscriptionPayments.sol
const PAYMENTS_ABI = parseAbi([
  "function pay(bytes32 invoiceId, uint256 amount, uint256 deadline, bytes signature)",
]);

const USER_REJECTED = 4001;
const CHAIN_NOT_ADDED = 4902;

type Step = "connect" | "network" | "balance" | "approve" | "pay" | "confirm";
const STEPS: Step[] = ["connect", "network", "balance", "approve", "pay", "confirm"];

type Props = {
  open: boolean;
  /** Local invoice id (in_…), used to confirm with the server. */
  invoiceId: string | null;
  quote: CryptoQuote | null;
  rail: CryptoRailInfo | null;
  totalIdr: number;
  onClose: () => void;
  onPaid: (state: XenditDemoState) => void;
};

export function CryptoPayModal(props: Props) {
  if (!props.open || !props.quote || !props.rail || !props.invoiceId) return null;
  return (
    <CryptoPayInner
      key={props.quote.invoiceId}
      {...props}
      quote={props.quote}
      rail={props.rail}
      invoiceId={props.invoiceId}
    />
  );
}

function CryptoPayInner({
  invoiceId,
  quote,
  rail,
  totalIdr,
  onClose,
  onPaid,
}: Props & { quote: CryptoQuote; rail: CryptoRailInfo; invoiceId: string }) {
  const { t, locale } = useLocale();
  const loc = locale === "id" ? "id" : "en";
  const [step, setStep] = useState<Step>("connect");
  const [done, setDone] = useState<Set<Step>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ key: TranslationKey; faucet?: boolean } | null>(null);
  const [account, setAccount] = useState<Address | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [txs, setTxs] = useState<{ approve?: Hex; pay?: Hex }>({});

  const amount = BigInt(quote.amount);
  const amountLabel = `${formatUnits(amount, quote.tokenDecimals)} ${quote.tokenSymbol}`;
  const txUrl = (h?: Hex) => (h && rail.explorerUrl ? `${rail.explorerUrl}/tx/${h}` : null);

  const chain = defineChain({
    id: rail.chainId,
    name: rail.chainName,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: rail.rpcUrl ? [rail.rpcUrl] : [] } },
    ...(rail.explorerUrl && {
      blockExplorers: { default: { name: "Explorer", url: rail.explorerUrl } },
    }),
  });

  const markDone = (s: Step) => setDone((d) => new Set(d).add(s));

  function clients() {
    const eth = window.ethereum;
    if (!eth) throw Object.assign(new Error("no wallet"), { code: "NO_WALLET" });
    return {
      eth,
      wallet: createWalletClient({ chain, transport: custom(eth) }),
      // Reads go through the wallet's own RPC connection.
      reader: createPublicClient({ chain, transport: custom(eth) }),
    };
  }

  function fail(err: unknown) {
    const code = (err as { code?: number | string })?.code;
    const msg = String((err as Error)?.message ?? "");
    if (code === "NO_WALLET") setError({ key: "payment.crypto.error.noWallet" });
    else if (code === USER_REJECTED || /rejected|denied/i.test(msg)) setError({ key: "payment.crypto.error.rejected" });
    else if (/QuoteExpired|expired/i.test(msg)) setError({ key: "payment.crypto.error.expired" });
    else if (/insufficient funds|gas/i.test(msg)) setError({ key: "payment.crypto.error.gas", faucet: false });
    else setError({ key: "payment.crypto.error.generic" });
  }

  /** Runs the remaining steps in order; resumes from the current step. */
  async function run() {
    if (Date.now() / 1000 > quote.deadline) {
      setError({ key: "payment.crypto.error.expired" });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { eth, wallet, reader } = clients();

      // 1. Connect
      const [first] = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      const owner = getAddress(first);
      setAccount(owner);
      markDone("connect");

      // 2. Network
      setStep("network");
      const current = Number.parseInt((await eth.request({ method: "eth_chainId" })) as string, 16);
      if (current !== rail.chainId) {
        const chainIdHex = `0x${rail.chainId.toString(16)}`;
        try {
          await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: chainIdHex }] });
        } catch (err) {
          if ((err as { code?: number }).code !== CHAIN_NOT_ADDED || !rail.rpcUrl) throw err;
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: chainIdHex,
                chainName: rail.chainName,
                nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
                rpcUrls: [rail.rpcUrl],
                ...(rail.explorerUrl && { blockExplorerUrls: [rail.explorerUrl] }),
              },
            ],
          });
        }
      }
      markDone("network");

      // 3. Balance
      setStep("balance");
      const bal = await reader.readContract({
        address: quote.token,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [owner],
      });
      setBalance(bal);
      if (bal < amount) {
        setError({ key: "payment.crypto.error.balance", faucet: true });
        return;
      }
      markDone("balance");

      // 4. Approve (only if the allowance is too low)
      setStep("approve");
      const allowance = await reader.readContract({
        address: quote.token,
        abi: erc20Abi,
        functionName: "allowance",
        args: [owner, quote.contract],
      });
      if (allowance < amount) {
        const approveHash = await wallet.writeContract({
          account: owner,
          address: quote.token,
          abi: erc20Abi,
          functionName: "approve",
          args: [quote.contract, amount], // exact amount, not unlimited
        });
        setTxs((x) => ({ ...x, approve: approveHash }));
        await reader.waitForTransactionReceipt({ hash: approveHash });
      }
      markDone("approve");

      // 5. Pay
      setStep("pay");
      const payHash = await wallet.writeContract({
        account: owner,
        address: quote.contract,
        abi: PAYMENTS_ABI,
        functionName: "pay",
        args: [quote.invoiceId, amount, BigInt(quote.deadline), quote.signature],
      });
      setTxs((x) => ({ ...x, pay: payHash }));
      const receipt = await reader.waitForTransactionReceipt({ hash: payHash });
      if (receipt.status !== "success") throw new Error("payment reverted");
      markDone("pay");

      // 6. Server confirms on-chain (waits for confirmations)
      setStep("confirm");
      for (let attempt = 0; attempt < 40; attempt++) {
        const res = await fetch("/api/projects/payment/xendit/crypto-confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invoiceId, txHash: payHash }),
        });
        const data = (await res.json()) as { status?: string; state?: XenditDemoState };
        if (res.ok && data.status === "paid" && data.state) {
          markDone("confirm");
          onPaid(data.state);
          return;
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
      setError({ key: "payment.crypto.error.slow" });
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  // Refresh the balance after a faucet visit when the tab regains focus.
  useEffect(() => {
    const onFocus = () => {
      if (error?.faucet && !busy) setError(null);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [error, busy]);

  const finished = done.has("confirm");

  return (
    <Modal open onClose={busy ? () => {} : onClose} title={t("payment.crypto.title")} className="max-w-lg">
      <div className="rounded-xl border border-foreground/10 bg-foreground/[0.03] p-4">
        <p className="text-xs text-foreground/55">{t("payment.crypto.amountDue")}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{amountLabel}</p>
        <p className="mt-1 text-xs text-foreground/50">
          ≈ {formatIdr(totalIdr, loc)} · {t("payment.crypto.rate").replace(
            "{rate}",
            formatIdr(rail.idrPerToken, loc)
          ).replace("{symbol}", quote.tokenSymbol)}{" "}
          · {rail.chainName}
        </p>
        {account && (
          <p className="mt-2 font-mono text-[11px] text-foreground/50">
            {account.slice(0, 6)}…{account.slice(-4)}
            {balance !== null &&
              ` · ${t("payment.crypto.balance")} ${formatUnits(balance, quote.tokenDecimals)} ${quote.tokenSymbol}`}
          </p>
        )}
      </div>

      <ol className="mt-4 space-y-2">
        {STEPS.map((s) => {
          const isDone = done.has(s);
          const isActive = step === s && !isDone;
          const link = s === "approve" ? txUrl(txs.approve) : s === "pay" ? txUrl(txs.pay) : null;
          return (
            <li key={s} className="flex items-center gap-2.5 text-sm">
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
                  isDone
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : isActive
                      ? "border-primary text-primary-text"
                      : "border-foreground/20 text-foreground/40"
                )}
              >
                {isDone ? (
                  <Check className="h-3 w-3" />
                ) : isActive && busy ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  STEPS.indexOf(s) + 1
                )}
              </span>
              <span className={cn(isDone || isActive ? "text-foreground" : "text-foreground/45")}>
                {t(`payment.crypto.step.${s}` as TranslationKey)}
              </span>
              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto inline-flex items-center gap-1 text-[11px] text-primary-text hover:underline"
                >
                  tx <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </li>
          );
        })}
      </ol>

      {error && (
        <div role="alert" className="mt-4 flex items-start gap-2 rounded-md border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
          <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {t(error.key)}
            {error.faucet && rail.faucetUrl && (
              <>
                {" "}
                <a href={rail.faucetUrl} target="_blank" rel="noreferrer" className="font-semibold underline">
                  {t("payment.crypto.getTokens").replace("{symbol}", quote.tokenSymbol)}
                </a>
              </>
            )}
          </span>
        </div>
      )}

      <div className="mt-5 flex gap-2">
        {finished ? (
          <Button className="flex-1" onClick={onClose}>
            <Check className="h-4 w-4" /> {t("payment.crypto.done")}
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose} disabled={busy}>
              {t("payment.cancel")}
            </Button>
            <Button className="flex-1" onClick={() => void run()} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
              {busy
                ? t("payment.crypto.working")
                : error
                  ? t("payment.crypto.retry")
                  : t("payment.crypto.payWith").replace("{amount}", amountLabel)}
            </Button>
          </>
        )}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-foreground/45">{t("payment.crypto.note")}</p>
    </Modal>
  );
}
