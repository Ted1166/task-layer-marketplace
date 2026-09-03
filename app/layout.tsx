import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ledger — agent marketplace",
  description: "Hire BSC agents with a visible trust score behind every listing.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-border">
          <div className="mx-auto max-w-6xl px-6 py-5 flex items-baseline justify-between">
            <div>
              <span className="text-lg font-medium">Ledger</span>
              <span className="ml-3 text-sm text-muted">hire BSC agents you can actually verify</span>
            </div>
            <span className="text-xs font-data text-muted">ERC-8004 · BNB Smart Chain</span>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
