/**
 * useSolana.ts
 * Typed utilities for interacting with a browser-injected Solana wallet
 * (Phantom / any wallet that implements the window.solana standard).
 */

import {
  Connection,
  clusterApiUrl,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

// ── Type augmentation for window.solana ──────────────────────────────────────
export interface SolanaProvider {
  isPhantom?: boolean;
  publicKey: PublicKey | null;
  isConnected: boolean;
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  signAndSendTransaction: (
    transaction: Transaction
  ) => Promise<{ signature: string }>;
}

declare global {
  interface Window {
    solana?: SolanaProvider;
  }
}

// ── Constants ────────────────────────────────────────────────────────────────
export const DEVNET_CONNECTION = new Connection(clusterApiUrl("devnet"), "confirmed");

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the window.solana provider or null if not available. */
export function getSolanaProvider(): SolanaProvider | null {
  if (typeof window === "undefined") return null;
  return window.solana ?? null;
}

/**
 * Ensure the wallet is connected.
 * Calls connect() only when not already connected.
 * Returns the connected PublicKey.
 */
export async function ensureConnected(provider: SolanaProvider): Promise<PublicKey> {
  if (provider.isConnected && provider.publicKey) {
    return provider.publicKey;
  }
  const { publicKey } = await provider.connect();
  return publicKey;
}

/**
 * Queries DEVNET_CONNECTION.getBalance() for the given public key
 * and returns the balance parsed as a float in SOL.
 */
export async function getDevnetBalance(publicKey: PublicKey): Promise<number> {
  const lamports = await DEVNET_CONNECTION.getBalance(publicKey, "confirmed");
  return lamports / LAMPORTS_PER_SOL;
}

/**
 * Send a micro-grant on Solana Devnet with dynamic funding amounts.
 *
 * @param provider   - The window.solana wallet provider
 * @param toAddress  - Base58 public key string of the beneficiary
 * @param solAmount  - Variable floating-point number in SOL (defaults to 0.05)
 * @returns          - Transaction signature string
 */
export async function sendMicroGrant(
  provider: SolanaProvider,
  toAddress: string,
  solAmount: number = 0.05
): Promise<string> {
  const fromPublicKey = await ensureConnected(provider);

  // Pre-flight validation check: ensure sufficient balance
  const balance = await getDevnetBalance(fromPublicKey);
  if (balance < solAmount) {
    throw new Error(
      `Insufficient Devnet SOL balance: You have ${balance.toFixed(3)} SOL, but attempted to send ${solAmount} SOL.`
    );
  }

  const toPubkey = new PublicKey(toAddress);

  // Build the transfer instruction for exactly solAmount * LAMPORTS_PER_SOL
  const lamportsToSend = Math.round(solAmount * LAMPORTS_PER_SOL);
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromPublicKey,
      toPubkey,
      lamports: lamportsToSend,
    })
  );

  // Fetch a recent blockhash so the tx doesn't expire immediately
  const { blockhash, lastValidBlockHeight } =
    await DEVNET_CONNECTION.getLatestBlockhash("confirmed");
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPublicKey;

  // Ask the wallet to sign & broadcast
  const { signature } = await provider.signAndSendTransaction(transaction);

  // Wait for on-chain confirmation
  await DEVNET_CONNECTION.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed"
  );

  return signature;
}

/** Builds a Solscan devnet explorer URL for a given signature. */
export function solscanUrl(signature: string): string {
  return `https://solscan.io/tx/${signature}?cluster=devnet`;
}
