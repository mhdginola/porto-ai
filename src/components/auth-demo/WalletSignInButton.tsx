"use client";

import { Loader2, Wallet } from "lucide-react";
import { useState } from "react";
import { getAddress, toHex } from "viem";
import { createSiweMessage } from "viem/siwe";
import { Button } from "@/components/ui/Button";
import type { AuthDemoSession } from "@/lib/auth-demo/constants";
import type { TranslationKey } from "@/lib/i18n/translations";

type Eip1193Provider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

/** EIP-1193 error code when the user rejects a request in their wallet. */
const USER_REJECTED = 4001;

/**
 * Sign-In with Ethereum (EIP-4361) using the browser's injected wallet
 * (MetaMask, Rabby, Coinbase Wallet extension…). Signing is free — no
 * transaction is sent.
 */
export function WalletSignInButton({
  onSignedIn,
  t,
}: {
  onSignedIn: (user: AuthDemoSession) => void;
  t: (key: TranslationKey) => string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    const eth = window.ethereum;
    if (!eth) {
      setError(t("authDemo.wallet.noWallet"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const [account] = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      if (!account) throw new Error("no account");
      const address = getAddress(account);
      const chainId = Number.parseInt((await eth.request({ method: "eth_chainId" })) as string, 16);

      const nonceRes = await fetch("/api/projects/auth/siwe/nonce", { cache: "no-store" });
      if (!nonceRes.ok) throw new Error("nonce");
      const { nonce } = (await nonceRes.json()) as { nonce: string };

      const now = new Date();
      const message = createSiweMessage({
        domain: window.location.host,
        uri: window.location.origin,
        address,
        chainId,
        nonce,
        version: "1",
        statement: "Sign in to the Auth & Roles demo. This is free and sends no transaction.",
        issuedAt: now,
        expirationTime: new Date(now.getTime() + 5 * 60_000),
      });
      const signature = (await eth.request({
        method: "personal_sign",
        params: [toHex(message), address],
      })) as string;

      const res = await fetch("/api/projects/auth/siwe/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature }),
      });
      const data = (await res.json()) as { user?: AuthDemoSession; error?: string };
      if (!res.ok || !data.user) {
        setError(
          res.status === 429 ? t("authDemo.wallet.rateLimited") : t("authDemo.wallet.failed")
        );
        return;
      }
      onSignedIn(data.user);
    } catch (err) {
      const code = (err as { code?: number })?.code;
      setError(code === USER_REJECTED ? t("authDemo.wallet.rejected") : t("authDemo.wallet.failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 border-t border-foreground/10 pt-4">
      <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => void signIn()} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
        {busy ? t("authDemo.wallet.signing") : t("authDemo.wallet.signIn")}
      </Button>
      <p className="mt-2 text-center text-[11px] text-foreground/45">{t("authDemo.wallet.hint")}</p>
      {error && (
        <p role="alert" className="mt-2 text-center text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
