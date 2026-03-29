import { cn } from '~/lib/utils';
import '~/style/markets-monitor-panel.css';

export type MarketsMonitorTab = 'stocks' | 'crypto' | 'commodities';

export type MarketsMonitorItem = {
  symbol: string;
  name: string;
  price: string;
  change: string;
  trend?: 'up' | 'down';
};

type MarketsMonitorPanelProps = {
  title?: string;
  liveLabel?: string;
  count?: string | number;
  items: MarketsMonitorItem[];
  activeTab?: MarketsMonitorTab;
  onTabChange?: (tab: MarketsMonitorTab) => void;
  activeSymbol?: string;
  onSymbolSelect?: (symbol: string) => void;
  className?: string;
};

const tabs: Array<{ key: MarketsMonitorTab; label: string }> = [
  { key: 'stocks', label: 'Stocks' },
  { key: 'crypto', label: 'Crypto' },
  { key: 'commodities', label: 'Commodities' },
];

export const MarketsMonitorPanel = ({
  title = 'Markets',
  liveLabel = 'Live',
  count = 7,
  items,
  activeTab = 'stocks',
  onTabChange,
  activeSymbol,
  onSymbolSelect,
  className,
}: MarketsMonitorPanelProps) => {
  return (
    <article className={cn('markets-monitor-panel', className)}>
      <header className="markets-monitor-panel-head">
        <h3>{title}</h3>

        <div className="markets-monitor-panel-head-meta">
          <span className="markets-monitor-panel-live-chip">{liveLabel}</span>
          <span className="markets-monitor-panel-count-chip">{count}</span>
        </div>
      </header>

      <div className="markets-monitor-panel-tabs" role="tablist" aria-label="Market categories">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={cn('markets-monitor-panel-tab', activeTab === tab.key && 'is-active')}
            onClick={() => onTabChange?.(tab.key)}
          >
            <span className={cn('markets-monitor-panel-tab-icon', `is-${tab.key}`)} aria-hidden="true" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="markets-monitor-panel-body">
        <ul className="markets-monitor-panel-list">
          {items.map((item) => {
            const trend = item.trend ?? (item.change.trim().startsWith('-') ? 'down' : 'up');
            const isActive = activeSymbol === item.symbol;

            return (
              <li key={item.symbol} className={cn(isActive && 'is-active')}>
                <button
                  type="button"
                  className="markets-monitor-panel-row"
                  onClick={() => onSymbolSelect?.(item.symbol)}
                  aria-pressed={isActive}
                >
                  <span className="markets-monitor-panel-symbol">{item.symbol}</span>
                  <span className="markets-monitor-panel-name">{item.name}</span>
                  <span className="markets-monitor-panel-price">{item.price}</span>
                  <span className={cn('markets-monitor-panel-change', trend === 'up' ? 'is-up' : 'is-down')}>{item.change}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <footer className="markets-monitor-panel-footer" aria-hidden="true">
        ...
      </footer>
    </article>
  );
};
