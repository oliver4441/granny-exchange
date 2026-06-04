import type { Metadata } from "next";
import { WalletProviderWrapper } from "@/components/WalletProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Granny Exchange — Swap SOL ↔ $GRANNY",
  description:
    "The official exchange for $GRANNY Coin. Swap SOL for Granny Coin with the best rates on Solana.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WalletProviderWrapper>{children}</WalletProviderWrapper>
      </body>
    </html>
  );
}
