import { tickerData } from '@/lib/mockData';

const MarketTicker = () => {
  const items = [...tickerData, ...tickerData];

  return (
    <div className="bg-card/50 border-b border-border overflow-hidden h-9 flex items-center">
      <div className="flex ticker-scroll whitespace-nowrap">
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 px-5 text-xs">
            <span className="font-medium text-foreground">{item.symbol}</span>
            <span className="text-muted-foreground font-mono">
              {typeof item.price === 'number' && item.price > 1000
                ? item.price.toLocaleString()
                : item.price.toFixed(2)}
            </span>
            <span className={`font-medium ${item.change >= 0 ? 'text-gain' : 'text-loss'}`}>
              {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default MarketTicker;
