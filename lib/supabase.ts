// Supabase client for trade history and stats
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface TradeRecord {
  id?: number;
  wallet: string;
  input_token: string;
  output_token: string;
  input_amount: number;
  output_amount: number;
  tx_signature: string;
  network: string;
  created_at?: string;
}

export async function logTrade(trade: TradeRecord) {
  const { error } = await supabase.from("trades").insert(trade);
  if (error) console.error("Failed to log trade:", error);
}

export async function getRecentTrades(limit: number = 20) {
  return supabase
    .from("trades")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
}
