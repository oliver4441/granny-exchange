"use client";

import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { GRANNY_TOKEN, SOL_MINT } from "@/lib/token";
import { getSwapQuote, buildSwapTransaction } from "@/lib/jupiter";
import { logTrade } from "@/lib/supabase";

interface SwapCardProps {
  walletAddress: string;
  onDisconnect: () => void;
}

export default function SwapCard({ walletAddress, onDisconnect }: SwapCardProps) {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();

  const [inputAmount, setInputAmount] = useState("");
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<"sol-to-granny" | "granny-to-sol">("sol-to-granny");

  const inputToken = direction === "sol-to-granny" ? "SOL" : "GRANNY";
  const outputToken = direction === "sol-to-granny" ? "GRANNY" : "SOL";
  const inputDecimals = direction === "sol-to-granny" ? 9 : GRANNY_TOKEN.DECIMALS;
  const inputMint = direction === "sol-to-granny" ? SOL_MINT : GRANNY_TOKEN.MINT_ADDRESS;
  const outputMint = direction === "sol-to-granny" ? GRANNY_TOKEN.MINT_ADDRESS : SOL_MINT;

  const getQuote = useCallback(async () => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) return;
    if (!GRANNY_TOKEN.MINT_ADDRESS) {
      setError("Token not yet deployed. Waiting for devnet faucet.");
      return;
    }

    setLoading(true);
    setError(null);
    setQuote(null);

    try {
      const amount = Math.floor(parseFloat(inputAmount) * Math.pow(10, inputDecimals));
      const q = await getSwapQuote(inputMint, outputMint, amount);
      setQuote(q);
    } catch (err: any) {
      setError(err.message || "Failed to get quote. Token may not be created yet.");
    } finally {
      setLoading(false);
    }
  }, [inputAmount, inputDecimals, inputMint, outputMint]);

  const executeSwap = useCallback(async () => {
    if (!quote || !publicKey || !signTransaction) {
      setError("Get a quote first and ensure wallet is connected");
      return;
    }

    setSwapping(true);
    setError(null);
    setStatus(null);

    try {
      const { swapTransaction } = await buildSwapTransaction(quote, publicKey.toBase58());

      // Deserialize the transaction
      const tx = Transaction.from(Buffer.from(swapTransaction, "base64"));

      // Sign with wallet
      const signedTx = await signTransaction(tx);

      // Send to network
      const txid = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(txid, "confirmed");

      setStatus(`✅ Swap confirmed! TX: ${txid.slice(0, 16)}...`);

      // Log to Supabase
      logTrade({
        wallet: publicKey.toBase58(),
        input_token: inputToken,
        output_token: outputToken,
        input_amount: parseFloat(inputAmount),
        output_amount: parseInt(quote.outAmount) / Math.pow(10, direction === "sol-to-granny" ? GRANNY_TOKEN.DECIMALS : 9),
        tx_signature: txid,
        network: "devnet",
      });
    } catch (err: any) {
      setError(err.message || "Swap failed");
    } finally {
      setSwapping(false);
    }
  }, [quote, publicKey, signTransaction, connection, inputAmount, inputToken, outputToken, direction]);

  const flipDirection = () => {
    setDirection(d => d === "sol-to-granny" ? "granny-to-sol" : "sol-to-granny");
    setInputAmount("");
    setQuote(null);
    setError(null);
  };

  const outputValue = quote
    ? (parseInt(quote.outAmount) / Math.pow(10, direction === "sol-to-granny" ? GRANNY_TOKEN.DECIMALS : 9)).toFixed(2)
    : "—";

  return (
    <div className="card w-full max-w-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Swap</h2>
        <button
          onClick={onDisconnect}
          className="text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
        >
          Disconnect
        </button>
      </div>

      {/* Input */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-[var(--muted)] mb-2">
          <span>You pay</span>
        </div>
        <div className="card !p-4">
          <div className="flex justify-between items-center">
            <input
              type="number"
              placeholder="0"
              value={inputAmount}
              onChange={(e) => {
                setInputAmount(e.target.value);
                setQuote(null);
              }}
              className="swap-input"
              min="0"
              step="any"
            />
            <div className="token-select">
              <span>{inputToken === "SOL" ? "◎" : "👵"}</span>
              <span className="font-semibold">{inputToken}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Arrow */}
      <div className="swap-arrow">
        <button onClick={flipDirection}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M12 19l-7-7M12 19l7-7" className="text-[var(--accent)]" />
          </svg>
        </button>
      </div>

      {/* Output */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-[var(--muted)] mb-2">
          <span>You receive</span>
          {quote && (
            <span>
              Impact:{" "}
              <span className={parseFloat(quote.priceImpactPct) > 5 ? "text-red-400" : "text-green-400"}>
                {parseFloat(quote.priceImpactPct).toFixed(2)}%
              </span>
            </span>
          )}
        </div>
        <div className="card !p-4">
          <div className="flex justify-between items-center">
            <div className="swap-input opacity-70">{outputValue}</div>
            <div className="token-select">
              <span>{outputToken === "SOL" ? "◎" : "👵"}</span>
              <span className="font-semibold">{outputToken}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status / Error */}
      {status && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-300">
          {status}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Action Button */}
      {!quote ? (
        <button onClick={getQuote} disabled={loading || !inputAmount} className="btn-primary">
          {loading ? "Getting quote..." : "Get Quote"}
        </button>
      ) : (
        <button onClick={executeSwap} disabled={swapping} className="btn-primary">
          {swapping ? "Swapping..." : `Swap ${inputToken} → ${outputToken}`}
        </button>
      )}
    </div>
  );
}
