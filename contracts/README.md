# Contracts — SubscriptionPayments

Pays subscription invoices from the portfolio's Payment demo in USDC (testnet).

- `src/SubscriptionPayments.sol` — accepts `pay(invoiceId, amount, deadline, signature)`
  only with an EIP-712 quote signed by the billing server; forwards funds to the
  treasury; each invoice payable once.
- `test/SubscriptionPayments.t.sol` — Foundry tests incl. fuzzing.
- `script/Deploy.s.sol` — deployment script.

OpenZeppelin comes from the root `node_modules` (`npm install` at repo root);
forge-std is a Foundry lib.

## Setup

```bash
# Foundry: https://book.getfoundry.sh/getting-started/installation
curl -L https://foundry.paradigm.xyz | bash && foundryup

cd contracts
forge install foundry-rs/forge-std
forge build
forge test -vv
```

## Deploy to Base Sepolia

1. Wallets (testnet only — never reuse keys that hold real assets):
   - **deployer**: needs a little Base Sepolia ETH for gas (any Base Sepolia faucet).
     Store it encrypted: `cast wallet import deployer --interactive`
   - **signer**: dedicated key that only signs quotes; holds nothing.
     Create one: `cast wallet new` → put the private key in the server env
     `CRYPTO_SIGNER_PRIVATE_KEY`, its address in `PAYMENT_SIGNER`.
   - **treasury**: any address you control; receives the USDC.
2. Deploy (+ verify on Basescan if `BASESCAN_API_KEY` is set):

```bash
export BASE_SEPOLIA_RPC_URL=https://base-sepolia.infura.io/v3/<key>
export PAYMENT_TREASURY=0x...   PAYMENT_SIGNER=0x...
forge script script/Deploy.s.sol --rpc-url base_sepolia --account deployer --broadcast --verify
```

3. Set `CRYPTO_PAYMENTS_CONTRACT=<deployed address>` in the app env and restart.

USDC for testing: https://faucet.circle.com (select Base Sepolia).
