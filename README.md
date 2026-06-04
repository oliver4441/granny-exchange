# 👵 Granny Exchange

A decentralized exchange (DEX) interface for swapping SOL ↔ $GRANNY on Solana.

**Built by:** Oliver (Omix Systems)
**Tech:** Next.js 15, Solana, Jupiter API, Supabase

## Quick Start

```bash
# Install dependencies
npm install

# Copy env file and fill in your values
cp .env.example .env.local

# Run dev server
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SOLANA_NETWORK` | `devnet` or `mainnet-beta` |
| `NEXT_PUBLIC_GRANNY_MINT` | $GRANNY token mint address |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |

## How It Works

1. User connects Phantom wallet
2. Selects swap direction (SOL→GRANNY or GRANNY→SOL)
3. Jupiter API provides the best swap quote
4. User confirms in wallet
5. Trade executes on-chain
6. Trade logged to Supabase for history

## File Structure

```
app/
├── page.tsx          # Main page with swap UI
├── layout.tsx        # Root layout
└── globals.css       # Tailwind + custom styles
components/
├── SwapCard.tsx      # Full swap widget with Jupiter integration
lib/
├── jupiter.ts        # Jupiter API helpers
├── supabase.ts       # Supabase client + trade logging
└── token.ts          # Token configs (mint address, decimals, etc.)
supabase/
└── migrations/       # Database schema
```

## Deployment

```bash
# Build for production
npm run build

# The `dist` folder can be deployed to Vercel
# Or use: vercel --prod
```

## Devnet Testing

1. Set Phantom wallet to devnet: Settings → Developer Settings → Testnet/Devnet
2. Request free devnet SOL from faucet
3. Granny Exchange will use devnet for testing (zero cost)
