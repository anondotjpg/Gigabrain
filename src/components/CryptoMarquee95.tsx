'use client';

import { useEffect, useState } from "react";

type Coin = {
  id: string;
  symbol: string;
  price: number;
  change: number;
};

const COINS = [
  { id: "bitcoin", symbol: "BTC" },
  { id: "ethereum", symbol: "ETH" },
  { id: "solana", symbol: "SOL" },
  { id: "bonk", symbol: "BONK" },
  { id: "dogecoin", symbol: "DOGE" },
  { id: "shiba-inu", symbol: "SHIB" },
  { id: "avalanche-2", symbol: "AVAX" },
  { id: "arbitrum", symbol: "ARB" },
];

function formatPrice(price: number) {
  if (price >= 1) {
    return `$${price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  if (price >= 0.01) {
    return `$${price.toFixed(4)}`;
  }

  return `$${price.toPrecision(4)}`;
}

function CoinList({ coins }: { coins: Coin[] }) {
  return (
    <>
      {coins.map((coin) => {
        const up = coin.change >= 0;
        return (
          <span
            key={coin.symbol}
            style={{ marginRight: 12, color: "#000" }}
          >
            <strong>{coin.symbol}</strong>{" "}
            {formatPrice(coin.price)}{" "}
            <span style={{ color: up ? "#008000" : "#800000" }}>
              {up ? "▲" : "▼"} {coin.change.toFixed(2)}%
            </span>
          </span>
        );
      })}
    </>
  );
}

export function CryptoMarquee95() {
  const [coins, setCoins] = useState<Coin[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const ids = COINS.map(c => c.id).join(",");

        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price` +
            `?ids=${ids}` +
            `&vs_currencies=usd` +
            `&include_24hr_change=true`
        );

        const data = await res.json();

        const parsed: Coin[] = COINS.map(c => ({
          id: c.symbol,
          symbol: c.symbol,
          price: data[c.id]?.usd ?? 0,
          change: data[c.id]?.usd_24h_change ?? 0,
        }));

        setCoins(parsed);
      } catch (e) {
        console.error("Failed to load crypto prices", e);
      }
    }

    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        width: 520,
        background: "#c0c0c0",
        fontFamily: "VT323, monospace",
        borderTop: "2px solid #fff",
        borderLeft: "2px solid #fff",
        borderRight: "2px solid #404040",
        borderBottom: "2px solid #404040",
        zIndex: 9999,
      }}
    >
      {/* Title bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(90deg, #000080, #1084d0)",
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          fontWeight: 700,
          color: "#fff",
          padding: "4px 6px",
          fontSize: 16,
        }}
      >
        <span>Crypto</span>

        <a
          href="https://x.com/DononBonk"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="/truth.png"
            alt="Truth Social"
            style={{
              width: 18,
              height: 18,
              imageRendering: "pixelated",
            }}
          />
        </a>
      </div>

      {/* Marquee */}
      <div
        style={{
          overflow: "hidden",
          whiteSpace: "nowrap",
          background: "#e0e0e0",
          borderTop: "1px solid #808080",
          padding: "6px 0",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            animation: "marquee 22s linear infinite",
          }}
        >
          {/* First copy */}
          <div style={{ display: "inline-block", paddingRight: 12 }}>
            <CoinList coins={coins} />
          </div>
          {/* Second copy for seamless loop */}
          <div style={{ display: "inline-block", paddingRight: 12 }}>
            <CoinList coins={coins} />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}