import MarketTicker from '@/components/MarketTicker';
import PortfolioSummary from '@/components/PortfolioSummary';
import HoldingsTable from '@/components/HoldingsTable';
import RecentTrades from '@/components/RecentTrades';
import WatchlistPanel from '@/components/WatchlistPanel';
import ClawbotChat from '@/components/ClawbotChat';
import StrategyPanel from '@/components/StrategyPanel';
import { Bot, Shield, Zap } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <span className="text-sm font-bold text-primary terminal-glow">CLAWBOT</span>
          <span className="text-[10px] text-muted-foreground ml-1">TERMINAL</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-gain" /> AUTO-INVEST</span>
          <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-warning" /> SIM MODE</span>
          <span>{new Date().toLocaleString()}</span>
        </div>
      </header>

      {/* Ticker */}
      <MarketTicker />

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0.5 p-0.5 min-h-0">
        {/* Left: Portfolio */}
        <div className="lg:col-span-2 flex flex-col gap-0.5 min-h-0 overflow-auto">
          <PortfolioSummary />
          <StrategyPanel />
          <HoldingsTable />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5">
            <RecentTrades />
            <WatchlistPanel />
          </div>
        </div>

        {/* Right: Chat */}
        <div className="h-[calc(100vh-5.5rem)] lg:h-auto">
          <ClawbotChat />
        </div>
      </div>
    </div>
  );
};

export default Index;
