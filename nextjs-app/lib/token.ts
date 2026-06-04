// Token configuration for $GRANNY
// Update MINT_ADDRESS after devnet token creation

export const GRANNY_TOKEN = {
  // Will be set after running 01-create-token.ts
  MINT_ADDRESS: process.env.NEXT_PUBLIC_GRANNY_MINT || "",
  SYMBOL: "GRANNY",
  NAME: "Granny Coin",
  DECIMALS: 9,
  // Devnet image placeholder - replace with real one later
  LOGO_URI: "/granny-logo.png",
};

export const SOL_MINT = "So11111111111111111111111111111111111111112";

// Network configuration
export const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
export const RPC_URL =
  NETWORK === "mainnet-beta"
    ? "https://api.mainnet-beta.solana.com"
    : "https://api.devnet.solana.com";
