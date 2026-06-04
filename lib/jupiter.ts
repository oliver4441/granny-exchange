// Jupiter API integration for swap quotes and transactions
// Docs: https://station.jup.ag/docs/api

import { GRANNY_TOKEN, SOL_MINT, NETWORK } from "./token";

const JUPITER_API =
  NETWORK === "mainnet-beta"
    ? "https://quote-api.jup.ag/v6"
    : "https://quote-api.jup.ag/v6"; // Jupiter devnet uses same endpoint with different tokens

export interface SwapQuote {
  inAmount: string;
  outAmount: string;
  priceImpactPct: number;
  marketInfos: any[];
  otherAmountThreshold: string;
  swapMode: string;
  routePlan: any[];
}

/**
 * Get a quote for swapping between SOL and $GRANNY
 */
export async function getSwapQuote(
  inputMint: string,
  outputMint: string,
  amountInSmallestUnit: number,
  slippageBps: number = 50 // 0.5% default slippage
): Promise<SwapQuote> {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: amountInSmallestUnit.toString(),
    slippageBps: slippageBps.toString(),
    onlyDirectRoutes: "false",
    asLegacyTransaction: "false",
  });

  const response = await fetch(`${JUPITER_API}/quote?${params}`);
  if (!response.ok) {
    throw new Error(`Jupiter quote failed: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Build a swap transaction from a Jupiter quote
 */
export async function buildSwapTransaction(
  quote: SwapQuote,
  userPublicKey: string,
  wrapAndUnwrapSol: boolean = true
) {
  const response = await fetch(`${JUPITER_API}/swap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey,
      wrapAndUnwrapSol,
      dynamicComputeUnitLimit: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Jupiter swap build failed: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Quick helper: get SOL → $GRANNY quote
 */
export function quoteSolToGranny(solAmount: number): Promise<SwapQuote> {
  const lamports = Math.floor(solAmount * 1_000_000_000);
  return getSwapQuote(SOL_MINT, GRANNY_TOKEN.MINT_ADDRESS, lamports);
}

/**
 * Quick helper: get $GRANNY → SOL quote
 */
export function quoteGrannyToSol(grannyAmount: number): Promise<SwapQuote> {
  const amount = Math.floor(grannyAmount * Math.pow(10, GRANNY_TOKEN.DECIMALS));
  return getSwapQuote(GRANNY_TOKEN.MINT_ADDRESS, SOL_MINT, amount);
}
