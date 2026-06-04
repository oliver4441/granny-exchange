"use client";

import { useEffect, useState } from "react";
import { getRecentTrades, TradeRecord } from "@/lib/supabase";

export default function RecentTrades() {
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrades() {
      try {
        const { data } = await getRecentTrades(10);
        if (data) setTrades(data);
      } catch {
        // Supabase not configured yet — that's fine
      } finally {
        setLoading(false);
      }
    }
    fetchTrades();
    // Refresh every 30 seconds
    const interval = setInterval(fetchTrades, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="card w-full max-w-md">
        <h3 className="text-sm font-semibold mb-3 text-[var(--muted)]">
          Recent Trades
        </h3>
        <div className="text-center text-[var(--muted)] py-4 text-sm">
          Loading...
        </div>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="card w-full max-w-md">
        <h3 className="text-sm font-semibold mb-3 text-[var(--muted)]">
          Recent Trades
        </h3>
        <div className="text-center text-[var(--muted)] py-6 text-sm">
          <p className="text-2xl mb-2">📊</p>
          <p>No trades yet. Be the first to swap!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card w-full max-w-md">
      <h3 className="text-sm font-semibold mb-3 text-[var(--muted)]">
        Recent Trades
      </h3>
      <div className="space-y-2">
        {trades.map((trade) => (
          <div
            key={trade.id}
            className="flex justify-between items-center py-2 border-b border-[var(--card-border)] last:border-0"
          >
            <div>
              <span className="text-sm font-medium">
                {trade.input_amount} {trade.input_token}
              </span>
              <span className="text-[var(--muted)] mx-1">→</span>
              <span className="text-sm font-medium">
                {trade.output_amount?.toLocaleString()} {trade.output_token}
              </span>
            </div>
            <a
              href={`https://explorer.solana.com/tx/${trade.tx_signature}?cluster=devnet`}
              target="_blank"
              rel="noopener"
              className="text-xs text-purple-400 hover:underline font-mono"
            >
              {trade.tx_signature?.slice(0, 8)}...
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
