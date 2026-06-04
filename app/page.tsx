"use client";

import { useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import SwapCard from "@/components/SwapCard";
import PriceChart from "@/components/PriceChart";
import RecentTrades from "@/components/RecentTrades";
import "@solana/wallet-adapter-react-ui/styles.css";

export default function Home() {
  const { publicKey, connected, disconnect } = useWallet();
  const { connection } = useConnection();

  const walletAddress = publicKey?.toBase58() || "";

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
    } catch {
      // User cancelled
    }
  }, [disconnect]);

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-[var(--card-border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-amber-500 flex items-center justify-center text-lg font-bold">
            👵
          </div>
          <div>
            <h1 className="text-xl font-bold glow-text">Granny Exchange</h1>
            <p className="text-xs text-[var(--muted)]">Powered by Solana</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {connected && walletAddress && (
            <span className="text-sm font-mono text-[var(--muted)] hidden sm:inline">
              {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
            </span>
          )}
          <WalletMultiButton
            style={{
              background: "linear-gradient(135deg, #a855f7, #7c3aed)",
              borderRadius: "12px",
              padding: "8px 20px",
              fontSize: "14px",
              fontWeight: "600",
              border: "none",
              height: "auto",
            }}
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center px-4 py-8 gap-6">
        {/* Network Badge */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs text-amber-400 font-medium">
            Devnet — Test Mode
          </span>
        </div>

        {/* Swap Card */}
        {connected ? (
          <SwapCard
            walletAddress={walletAddress}
            onDisconnect={handleDisconnect}
          />
        ) : (
          <div className="card w-full max-w-md text-center py-12">
            <div className="text-5xl mb-4">👵</div>
            <h2 className="text-xl font-bold mb-2 glow-text">
              Welcome to Granny Exchange
            </h2>
            <p className="text-[var(--muted)] mb-6 text-sm max-w-sm mx-auto">
              Swap SOL for $GRANNY with the best rates on Solana. Connect your
              wallet to get started.
            </p>
            <div className="flex justify-center">
              <WalletMultiButton
                style={{
                  background: "linear-gradient(135deg, #a855f7, #7c3aed)",
                  borderRadius: "12px",
                  padding: "12px 32px",
                  fontSize: "16px",
                  fontWeight: "600",
                  border: "none",
                  height: "auto",
                }}
              />
            </div>
            <p className="mt-4 text-xs text-[var(--muted)]">
              Don&apos;t have Phantom?{" "}
              <a
                href="https://phantom.app/"
                target="_blank"
                rel="noopener"
                className="text-purple-400 hover:underline"
              >
                Get it here
              </a>
            </p>
          </div>
        )}

        {/* Price Chart */}
        <PriceChart />

        {/* Token Info */}
        <div className="card w-full max-w-md">
          <h3 className="text-sm font-semibold mb-3 text-[var(--muted)]">
            👵 $GRANNY Token
          </h3>
          <div className="trade-row">
            <span className="text-[var(--muted)]">Name</span>
            <span>Granny Coin</span>
          </div>
          <div className="trade-row">
            <span className="text-[var(--muted)]">Ticker</span>
            <span className="font-semibold glow-text">$GRANNY</span>
          </div>
          <div className="trade-row">
            <span className="text-[var(--muted)]">Network</span>
            <span>Solana Devnet</span>
          </div>
          <div className="trade-row">
            <span className="text-[var(--muted)]">Status</span>
            <span className="text-amber-400">⏳ Awaiting devnet faucet</span>
          </div>
          <div className="trade-row">
            <span className="text-[var(--muted)]">Total Supply</span>
            <span>1,000,000,000 $GRANNY</span>
          </div>
          <div className="trade-row">
            <span className="text-[var(--muted)]">Decimals</span>
            <span>9</span>
          </div>
          <div className="trade-row">
            <span className="text-[var(--muted)]">Swap Engine</span>
            <span>Jupiter Aggregator ⚡</span>
          </div>
        </div>

        {/* How it works */}
        <div className="card w-full max-w-md">
          <h3 className="text-sm font-semibold mb-3 text-[var(--muted)]">
            How It Works
          </h3>
          <ol className="text-sm space-y-3 text-[var(--muted)]">
            <li className="flex gap-3">
              <span className="text-purple-400 font-bold">1</span>
              <span>Connect your Phantom wallet (set to devnet mode)</span>
            </li>
            <li className="flex gap-3">
              <span className="text-purple-400 font-bold">2</span>
              <span>Enter SOL or GRANNY amount to swap</span>
            </li>
            <li className="flex gap-3">
              <span className="text-purple-400 font-bold">3</span>
              <span>Jupiter finds the best swap route automatically</span>
            </li>
            <li className="flex gap-3">
              <span className="text-purple-400 font-bold">4</span>
              <span>Review the quote and confirm in your wallet</span>
            </li>
            <li className="flex gap-3">
              <span className="text-purple-400 font-bold">5</span>
              <span>Tokens appear in your wallet instantly</span>
            </li>
          </ol>
        </div>

        {/* Recent Trades */}
        <RecentTrades />

        {/* Granny Wisdom */}
        <div className="card w-full max-w-md text-center py-6">
          <p className="text-lg font-medium glow-text">
            &ldquo;Granny doesn&apos;t panic sell. Granny holds.&rdquo;
          </p>
          <p className="text-xs text-[var(--muted)] mt-2">
            — Ancient Granny Wisdom
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-[var(--muted)] border-t border-[var(--card-border)]">
        <p>👵 Granny Exchange v0.1 — Built on Solana Devnet</p>
        <p className="mt-1">
          Granny sees you swapping. Granny is proud. Now go touch grass.
        </p>
      </footer>
    </main>
  );
}
