export interface Holding {
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  change: number;
  changePercent: number;
  sector: string;
  type: 'stock' | 'reit' | 'etf';
}

export interface Trade {
  id: string;
  timestamp: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  shares: number;
  price: number;
  strategy: string;
  status: 'executed' | 'pending' | 'cancelled';
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  signal: 'BUY' | 'SELL' | 'HOLD' | 'WATCH';
}

export const portfolioHoldings: Holding[] = [
  { symbol: 'AAPL', name: 'Apple Inc', shares: 150, avgCost: 172.50, currentPrice: 198.11, change: 3.24, changePercent: 1.66, sector: 'Technology', type: 'stock' },
  { symbol: 'MSFT', name: 'Microsoft Corp', shares: 85, avgCost: 380.00, currentPrice: 442.57, change: -1.83, changePercent: -0.41, sector: 'Technology', type: 'stock' },
  { symbol: 'NVDA', name: 'NVIDIA Corp', shares: 200, avgCost: 95.00, currentPrice: 131.29, change: 5.67, changePercent: 4.52, sector: 'Technology', type: 'stock' },
  { symbol: 'O', name: 'Realty Income', shares: 300, avgCost: 52.40, currentPrice: 57.82, change: 0.34, changePercent: 0.59, sector: 'Real Estate', type: 'reit' },
  { symbol: 'VNQ', name: 'Vanguard Real Estate ETF', shares: 120, avgCost: 82.10, currentPrice: 86.45, change: -0.22, changePercent: -0.25, sector: 'Real Estate', type: 'etf' },
  { symbol: 'JPM', name: 'JPMorgan Chase', shares: 60, avgCost: 185.00, currentPrice: 212.34, change: 1.45, changePercent: 0.69, sector: 'Financials', type: 'stock' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', shares: 100, avgCost: 155.20, currentPrice: 152.87, change: -0.95, changePercent: -0.62, sector: 'Healthcare', type: 'stock' },
  { symbol: 'SCHD', name: 'Schwab US Div Equity ETF', shares: 250, avgCost: 74.30, currentPrice: 79.16, change: 0.28, changePercent: 0.35, sector: 'Diversified', type: 'etf' },
];

export const recentTrades: Trade[] = [
  { id: '1', timestamp: '2026-04-13 09:31:22', symbol: 'NVDA', action: 'BUY', shares: 50, price: 128.45, strategy: 'Growth Momentum', status: 'executed' },
  { id: '2', timestamp: '2026-04-13 09:45:11', symbol: 'O', action: 'BUY', shares: 100, price: 57.20, strategy: 'Dividend Income', status: 'executed' },
  { id: '3', timestamp: '2026-04-12 15:58:03', symbol: 'TSLA', action: 'SELL', shares: 30, price: 245.80, strategy: 'Day Trade Exit', status: 'executed' },
  { id: '4', timestamp: '2026-04-12 14:22:45', symbol: 'AMD', action: 'BUY', shares: 75, price: 164.30, strategy: 'Value Dip Buy', status: 'executed' },
  { id: '5', timestamp: '2026-04-13 10:15:00', symbol: 'SPY', action: 'BUY', shares: 20, price: 528.90, strategy: 'Day Trade Entry', status: 'pending' },
];

export const watchlist: WatchlistItem[] = [
  { symbol: 'TSLA', name: 'Tesla Inc', price: 248.42, change: 8.31, changePercent: 3.46, volume: '82.3M', signal: 'WATCH' },
  { symbol: 'AMD', name: 'Adv Micro Devices', price: 168.94, change: 4.64, changePercent: 2.82, volume: '45.1M', signal: 'BUY' },
  { symbol: 'AMZN', name: 'Amazon.com', price: 192.75, change: -1.23, changePercent: -0.63, volume: '38.7M', signal: 'HOLD' },
  { symbol: 'SPG', name: 'Simon Property Grp', price: 156.80, change: 1.12, changePercent: 0.72, volume: '2.1M', signal: 'BUY' },
  { symbol: 'PLTR', name: 'Palantir Tech', price: 24.56, change: 0.89, changePercent: 3.76, volume: '67.8M', signal: 'WATCH' },
  { symbol: 'META', name: 'Meta Platforms', price: 512.30, change: -3.45, changePercent: -0.67, volume: '15.2M', signal: 'HOLD' },
];

export const tickerData = [
  { symbol: 'SPY', price: 528.90, change: 1.24 },
  { symbol: 'QQQ', price: 454.12, change: 1.87 },
  { symbol: 'DIA', price: 398.45, change: 0.43 },
  { symbol: 'IWM', price: 205.67, change: -0.32 },
  { symbol: 'VTI', price: 265.34, change: 0.98 },
  { symbol: 'BTC', price: 71245, change: 2.15 },
  { symbol: 'GLD', price: 214.56, change: 0.12 },
  { symbol: '10Y', price: 4.32, change: -0.05 },
  { symbol: 'VIX', price: 14.23, change: -3.45 },
  { symbol: 'DXY', price: 104.12, change: -0.18 },
];

export function getPortfolioStats() {
  const totalValue = portfolioHoldings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0);
  const totalCost = portfolioHoldings.reduce((sum, h) => sum + h.shares * h.avgCost, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPercent = (totalGain / totalCost) * 100;
  const dayChange = portfolioHoldings.reduce((sum, h) => sum + h.shares * h.change, 0);
  const dayChangePercent = (dayChange / totalValue) * 100;

  return {
    totalValue,
    totalCost,
    totalGain,
    totalGainPercent,
    dayChange,
    dayChangePercent,
    cashBalance: 24_567.82,
    buyingPower: 49_135.64,
  };
}
