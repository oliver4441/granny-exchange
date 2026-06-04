-- Trade history table for Granny Exchange
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS trades (
  id BIGSERIAL PRIMARY KEY,
  wallet TEXT NOT NULL,
  input_token TEXT NOT NULL,
  output_token TEXT NOT NULL,
  input_amount NUMERIC NOT NULL,
  output_amount NUMERIC NOT NULL,
  tx_signature TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'devnet',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for recent trades
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_wallet ON trades(wallet);

-- Enable RLS
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for trade logging)
CREATE POLICY "Anyone can insert trades"
  ON trades FOR CHECK (true);

-- Allow reading all trades (public data)
CREATE POLICY "Anyone can read trades"
  ON trades FOR SELECT (true);
