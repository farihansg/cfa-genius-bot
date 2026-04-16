import MarketTicker from '@/components/MarketTicker';
import PortfolioChart from '@/components/PortfolioChart';
import PortfolioSummary from '@/components/PortfolioSummary';
import HoldingsTable from '@/components/HoldingsTable';
import RecentTrades from '@/components/RecentTrades';
import WatchlistPanel from '@/components/WatchlistPanel';

import StrategyPanel from '@/components/StrategyPanel';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bot, Search, Bell, Settings, TrendingUp, LogOut } from 'lucide-react';

const Index = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <span className="text-base font-bold text-foreground">InveStarAnalyst</span>
            <span className="text-xs text-muted-foreground ml-2">AI Investing</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => navigate('/invest')}
            className="p-2 rounded-lg hover:bg-muted transition-colors flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Invest</span>
          </button>
          <button className="p-2 rounded-lg hover:bg-muted transition-colors">
            <Search className="w-4 h-4 text-muted-foreground" />
          </button>
          <button className="p-2 rounded-lg hover:bg-muted transition-colors relative">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
          </button>
          <button onClick={() => navigate('/settings')} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <Settings className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={signOut} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Sign out">
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary ml-1">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </header>

      <MarketTicker />

      <div className="flex-1 overflow-y-auto pb-6">
        <PortfolioChart />
        <PortfolioSummary />
        <div className="mt-4"><StrategyPanel /></div>
        <div className="mt-4"><HoldingsTable /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-6 mt-4">
          <RecentTrades />
          <WatchlistPanel />
        </div>
      </div>
    </div>
  );
};

export default Index;
