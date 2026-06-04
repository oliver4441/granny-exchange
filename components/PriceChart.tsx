"use client";

import { useEffect, useState } from "react";

interface PricePoint {
  time: string;
  price: number;
}

export default function PriceChart() {
  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate mock price data for now
    // In production, this would fetch from Jupiter's price API or on-chain data
    const generateMockData = () => {
      const points: PricePoint[] = [];
      let price = 1000; // Starting GRANNY per SOL
      const now = Date.now();

      for (let i = 23; i >= 0; i--) {
        const variation = (Math.random() - 0.5) * 50;
        price = Math.max(900, price + variation);
        const time = new Date(now - i * 3600000);
        points.push({
          time: `${time.getHours()}:00`,
          price: Math.round(price),
        });
      }
      return points;
    };

    // Simulate loading
    setTimeout(() => {
      setData(generateMockData());
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="card w-full max-w-md mt-6">
        <h3 className="text-sm font-semibold mb-3 text-[var(--muted)]">
          $GRANNY Price (24h)
        </h3>
        <div className="h-32 flex items-center justify-center text-[var(--muted)]">
          Loading chart...
        </div>
      </div>
    );
  }

  const maxPrice = Math.max(...data.map((d) => d.price));
  const minPrice = Math.min(...data.map((d) => d.price));
  const range = maxPrice - minPrice || 1;
  const currentPrice = data[data.length - 1]?.price || 0;
  const prevPrice = data[data.length - 2]?.price || currentPrice;
  const change = ((currentPrice - prevPrice) / prevPrice) * 100;
  const isUp = change >= 0;

  return (
    <div className="card w-full max-w-md mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-[var(--muted)]">
          $GRANNY / SOL (24h)
        </h3>
        <div className="text-right">
          <span className="text-lg font-bold">
            {(currentPrice / 1000000).toFixed(6)} SOL
          </span>
          <span
            className={`ml-2 text-sm ${isUp ? "text-green-400" : "text-red-400"}`}
          >
            {isUp ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Simple SVG chart */}
      <svg viewBox="0 0 400 120" className="w-full h-32">
        {/* Grid lines */}
        {[0, 30, 60, 90, 120].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="400"
            y2={y}
            stroke="var(--card-border)"
            strokeWidth="0.5"
          />
        ))}

        {/* Price line */}
        <polyline
          fill="none"
          stroke={isUp ? "#22c55e" : "#ef4444"}
          strokeWidth="2"
          points={data
            .map((d, i) => {
              const x = (i / (data.length - 1)) * 400;
              const y = 120 - ((d.price - minPrice) / range) * 110;
              return `${x},${y}`;
            })
            .join(" ")}
        />

        {/* Gradient fill under line */}
        <polygon
          fill={isUp ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)"}
          points={`0,120 ${data
            .map((d, i) => {
              const x = (i / (data.length - 1)) * 400;
              const y = 120 - ((d.price - minPrice) / range) * 110;
              return `${x},${y}`;
            })
            .join(" ")} 400,120`}
        />
      </svg>

      {/* Time labels */}
      <div className="flex justify-between text-xs text-[var(--muted)] mt-2">
        <span>24h ago</span>
        <span>12h ago</span>
        <span>Now</span>
      </div>
    </div>
  );
}
