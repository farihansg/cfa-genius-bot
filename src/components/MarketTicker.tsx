import { tickerData } from '@/lib/mockData';

const MarketTicker = () => {
  const items = [...tickerData, ...tickerData]; // duplicate for seamless scroll

  return (
    <div className="bg-muted/50 border-b border-border overflow-hidden h-7 flex items-center">
      <div className="flex ticker-scroll whitespace-nowrap">
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-4 text-xs">
            <span className="text-muted-foreground font-medium">{item.symbol}</span>
            <span className="text-foreground">{item.price.toLocaleString()}</span>
            <span className={item.change >= 0 ? 'text-gain' : 'text-loss'}>
              {item.change >= 0 ? '▲' : '▼'} {Math.abs(item.change).toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default MarketTicker;
