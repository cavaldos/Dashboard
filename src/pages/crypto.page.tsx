import { useEffect, useState } from 'react';
import { cn } from '~/lib/utils';
import CryptoService, { 
  type Coin, 
  type FearGreedData, 
  type Liquidation,
  type PricePoint,
  type LiquidationStats,
  type GlobalData
} from '~/services/crypto.service';
import { Section } from '~/components/UI/Section';
import { FearGreedChart } from '~/components/UI/FearGreedChart';
import { PriceChart } from '~/components/UI/PriceChart';

const cardCornerClass = 'absolute h-2.5 w-2.5 border-[var(--accent)]';

type MonitorPanelTone = 'green' | 'yellow' | 'blue' | 'red';

const getFearGreedTone = (value: number): MonitorPanelTone => {
  if (value <= 25) return 'red';
  if (value <= 45) return 'yellow';
  if (value <= 55) return 'yellow';
  if (value <= 75) return 'blue';
  return 'green';
};

const getFearGreedLabel = (value: number): string => {
  if (value <= 25) return 'Extreme Fear';
  if (value <= 45) return 'Fear';
  if (value <= 55) return 'Neutral';
  if (value <= 75) return 'Greed';
  return 'Extreme Greed';
};

const formatCurrency = (value: number): string => {
  if (value >= 1000000000) {
    return '$' + (value / 1000000000).toFixed(2) + 'B';
  }
  if (value >= 1000000) {
    return '$' + (value / 1000000).toFixed(2) + 'M';
  }
  if (value >= 1000) {
    return '$' + value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const panelToneClassMap: Record<MonitorPanelTone, string> = {
  green: 'is-green',
  yellow: 'is-yellow',
  blue: 'is-blue',
  red: 'is-red',
};

type GridPresetKey = '3x3' | '3x4' | '4x4';

const GRID_PRESETS: Record<GridPresetKey, { label: string; cols: number; rows: number }> = {
  '3x3': { label: '3 x 3', cols: 3, rows: 3 },
  '3x4': { label: '3 x 4', cols: 3, rows: 4 },
  '4x4': { label: '4 x 4', cols: 4, rows: 4 },
};

type PanelType = {
  id: string;
  title: string;
  status: string;
  tone: MonitorPanelTone;
  hasFgChart?: boolean;
  fgChartData?: { value: number; label: string };
  hasPriceChart?: boolean;
  priceChartData?: PricePoint[];
  items: string[];
};

const CryptoPage = () => {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [fearGreed, setFearGreed] = useState<FearGreedData | null>(null);
  const [liquidations, setLiquidations] = useState<Liquidation[]>([]);
  const [liquidationStats, setLiquidationStats] = useState<LiquidationStats | null>(null);
  const [globalData, setGlobalData] = useState<GlobalData | null>(null);
  const [btcPriceHistory, setBtcPriceHistory] = useState<PricePoint[]>([]);
  const [ethPriceHistory, setEthPriceHistory] = useState<PricePoint[]>([]);
  const [solPriceHistory, setSolPriceHistory] = useState<PricePoint[]>([]);
  const [gridPresetKey, setGridPresetKey] = useState<GridPresetKey>('3x3');

  useEffect(() => {
    const fetchData = async () => {
      const [
        coinsData, 
        fearGreedData, 
        liquidationsData,
        liquidationStatsData,
        globalDataData,
        btcHistory,
        ethHistory,
        solHistory
      ] = await Promise.all([
        CryptoService.getTopCoins(10),
        CryptoService.getFearGreedIndex(),
        CryptoService.getRecentLiquidations(20),
        CryptoService.getLiquidationStats(),
        CryptoService.getGlobalData(),
        CryptoService.getPriceHistory('bitcoin', 7),
        CryptoService.getPriceHistory('ethereum', 7),
        CryptoService.getPriceHistory('solana', 7),
      ]);
      setCoins(coinsData);
      setFearGreed(fearGreedData);
      setLiquidations(liquidationsData);
      setLiquidationStats(liquidationStatsData);
      setGlobalData(globalDataData);
      setBtcPriceHistory(btcHistory);
      setEthPriceHistory(ethHistory);
      setSolPriceHistory(solHistory);
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const gridPreset = GRID_PRESETS[gridPresetKey];

  const fearGreedValue = fearGreed ? parseInt(fearGreed.value.toString()) : 0;
  const fearGreedTone = getFearGreedTone(fearGreedValue);
  const fearGreedLabel = getFearGreedLabel(fearGreedValue);

  const longLiquidations = liquidations.filter((l) => l.side === 'long').length;
  const shortLiquidations = liquidations.filter((l) => l.side === 'short').length;

  const panels: PanelType[] = [
    {
      id: 'fear-greed',
      title: 'Fear & Greed Index',
      status: fearGreedLabel,
      tone: fearGreedTone,
      hasFgChart: true,
      fgChartData: { value: fearGreedValue, label: fearGreedLabel },
      items: [
        `Value: ${fearGreedValue}/100`,
        `Classification: ${fearGreedLabel}`,
        `Long Liquidations: ${liquidationStats?.totalLong ? formatCurrency(liquidationStats.totalLong) : longLiquidations}`,
        `Short Liquidations: ${liquidationStats?.totalShort ? formatCurrency(liquidationStats.totalShort) : shortLiquidations}`,
        `24h Total: ${liquidationStats?.totalValue ? formatCurrency(liquidationStats.totalValue) : formatCurrency(liquidations.reduce((s, l) => s + l.value, 0))}`,
        `Updated: ${fearGreed ? new Date(fearGreed.timestamp * 1000).toLocaleTimeString() : 'N/A'}`,
      ],
    },
    {
      id: 'bitcoin',
      title: 'Bitcoin (BTC)',
      status: coins[0] ? (coins[0].price_change_percentage_24h >= 0 ? '+' : '') + coins[0].price_change_percentage_24h?.toFixed(2) + '%' : 'Loading',
      tone: coins[0] ? (coins[0].price_change_percentage_24h >= 0 ? 'green' : 'red') : 'blue',
      hasPriceChart: true,
      priceChartData: btcPriceHistory,
      items: coins[0] ? [
        `Price: ${formatCurrency(coins[0].current_price)}`,
        `24h: ${coins[0].price_change_percentage_24h >= 0 ? '+' : ''}${coins[0].price_change_percentage_24h?.toFixed(2)}%`,
        `Mkt Cap: ${formatCurrency(coins[0].market_cap)}`,
        `Dominance: ${globalData?.btc_dominance?.toFixed(1) || '-'}%`,
        `Volume 24h: ${globalData?.total_volume ? formatCurrency(globalData.total_volume) : '-'}`,
        `Status: Live`,
      ] : ['Loading...'],
    },
    {
      id: 'ethereum',
      title: 'Ethereum (ETH)',
      status: coins[1] ? (coins[1].price_change_percentage_24h >= 0 ? '+' : '') + coins[1].price_change_percentage_24h?.toFixed(2) + '%' : 'Loading',
      tone: coins[1] ? (coins[1].price_change_percentage_24h >= 0 ? 'green' : 'red') : 'blue',
      hasPriceChart: true,
      priceChartData: ethPriceHistory,
      items: coins[1] ? [
        `Price: ${formatCurrency(coins[1].current_price)}`,
        `24h: ${coins[1].price_change_percentage_24h >= 0 ? '+' : ''}${coins[1].price_change_percentage_24h?.toFixed(2)}%`,
        `Mkt Cap: ${formatCurrency(coins[1].market_cap)}`,
        `Dominance: ${globalData?.eth_dominance?.toFixed(1) || '-'}%`,
        `Rank: #${coins[1].market_cap_rank}`,
        `Status: Live`,
      ] : ['Loading...'],
    },
    {
      id: 'liquidations-24h',
      title: 'Liquidations (24h)',
      status: liquidationStats ? formatCurrency(liquidationStats.totalValue) : 'Loading',
      tone: (liquidationStats?.totalLong || 0) > (liquidationStats?.totalShort || 0) ? 'red' : 'yellow',
      items: liquidationStats ? [
        `Total Long: ${formatCurrency(liquidationStats.totalLong)}`,
        `Total Short: ${formatCurrency(liquidationStats.totalShort)}`,
        `Largest Long: ${formatCurrency(liquidationStats.largestLong)}`,
        `Largest Short: ${formatCurrency(liquidationStats.largestShort)}`,
        `Long/Short Ratio: ${(liquidationStats.totalLong / liquidationStats.totalShort).toFixed(2)}`,
        `Updated: ${new Date(liquidationStats.timestamp).toLocaleTimeString()}`,
      ] : ['Loading...'],
    },
    {
      id: 'solana',
      title: 'Solana (SOL)',
      status: coins[4] ? (coins[4].price_change_percentage_24h >= 0 ? '+' : '') + coins[4].price_change_percentage_24h?.toFixed(2) + '%' : 'Loading',
      tone: coins[4] ? (coins[4].price_change_percentage_24h >= 0 ? 'green' : 'red') : 'blue',
      hasPriceChart: true,
      priceChartData: solPriceHistory,
      items: coins[4] ? [
        `Price: ${formatCurrency(coins[4].current_price)}`,
        `24h: ${coins[4].price_change_percentage_24h >= 0 ? '+' : ''}${coins[4].price_change_percentage_24h?.toFixed(2)}%`,
        `Mkt Cap: ${formatCurrency(coins[4].market_cap)}`,
        `Rank: #${coins[4].market_cap_rank}`,
        `Status: Live`,
        ``,
      ] : ['Loading...'],
    },
    {
      id: 'market-cap',
      title: 'Market Overview',
      status: globalData ? formatCurrency(globalData.total_market_cap) : 'Loading',
      tone: 'green',
      items: globalData ? [
        `Total Mkt Cap: ${formatCurrency(globalData.total_market_cap)}`,
        `24h Volume: ${formatCurrency(globalData.total_volume)}`,
        `BTC Dominance: ${globalData.btc_dominance?.toFixed(1)}%`,
        `ETH Dominance: ${globalData.eth_dominance?.toFixed(1)}%`,
        `Top Gain: ${coins[0]?.symbol.toUpperCase() || '-'} ${coins[0] ? (coins[0].price_change_percentage_24h >= 0 ? '+' : '') + coins[0].price_change_percentage_24h?.toFixed(1) + '%' : '-'}`,
        `Updated: ${new Date().toLocaleTimeString()}`,
      ] : ['Loading...'],
    },
    {
      id: 'recent-liquidations',
      title: 'Recent Liquidations',
      status: `${liquidations.length} events`,
      tone: longLiquidations > shortLiquidations ? 'red' : 'yellow',
      items: liquidations.slice(0, 6).map((liq) => 
        `${liq.symbol} ${liq.side.toUpperCase()} ${formatCurrency(liq.value)}`
      ),
    },
    {
      id: 'top-coins',
      title: 'Top Coins',
      status: 'Live',
      tone: 'blue',
      items: coins.slice(2, 8).map((coin) => 
        `${coin.symbol.toUpperCase()}: ${formatCurrency(coin.current_price)} (${coin.price_change_percentage_24h >= 0 ? '+' : ''}${coin.price_change_percentage_24h?.toFixed(1)}%)`
      ),
    },
  ];

  const gridCapacity = gridPreset.cols * gridPreset.rows;
  const visiblePanels = panels.slice(0, gridCapacity);

  const wmGridStyle = {
    '--wm-columns': String(gridPreset.cols),
    '--wm-rows': String(gridPreset.rows),
  } as React.CSSProperties;

  return (
    <main className="ui-shell">
      <div className="ui-container">
        <Section label="// crypto monitor grid">
          <div className="wm-toolbar" role="group" aria-label="Grid size selector">
            {(Object.keys(GRID_PRESETS) as GridPresetKey[]).map((key) => (
              <button
                key={key}
                type="button"
                className={cn(
                  'relative border border-[var(--border)] bg-[var(--bg-card)] px-7 py-3 font-[var(--mono)] text-[calc(11px+var(--font-size-offset))] uppercase tracking-[0.2em] text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--border-bright)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]',
                  gridPresetKey === key && 'border-[var(--accent-dim)] bg-[var(--accent-glow)] text-[var(--accent)]',
                )}
                onClick={() => setGridPresetKey(key)}
              >
                <span className={`${cardCornerClass} left-[-1px] top-[-1px] border-l border-t`} aria-hidden="true" />
                <span className={`${cardCornerClass} right-[-1px] top-[-1px] border-r border-t`} aria-hidden="true" />
                <span className={`${cardCornerClass} bottom-[-1px] left-[-1px] border-b border-l`} aria-hidden="true" />
                <span className={`${cardCornerClass} bottom-[-1px] right-[-1px] border-b border-r`} aria-hidden="true" />
                {GRID_PRESETS[key].label}
              </button>
            ))}
          </div>

          <div className="wm-grid-shell">
            <div className="wm-grid" style={wmGridStyle}>
              {visiblePanels.map((panel) => (
                <article
                  key={panel.id}
                  className="wm-panel card relative cursor-default border border-[var(--border)] bg-[var(--bg-card)] transition-colors duration-200 hover:border-[var(--border-bright)] hover:bg-[var(--bg-card-hover)]"
                >
                  <span className={`${cardCornerClass} left-[-1px] top-[-1px] border-l border-t`} aria-hidden="true" />
                  <span className={`${cardCornerClass} right-[-1px] top-[-1px] border-r border-t`} aria-hidden="true" />
                  <span className={`${cardCornerClass} bottom-[-1px] left-[-1px] border-b border-l`} aria-hidden="true" />
                  <span className={`${cardCornerClass} bottom-[-1px] right-[-1px] border-b border-r`} aria-hidden="true" />

                  <header className="wm-panel-header">
                    <h3>{panel.title}</h3>
                    <span className={cn('wm-chip', panelToneClassMap[panel.tone])}>{panel.status}</span>
                  </header>

                  <div className="wm-panel-body">
                    {panel.hasFgChart && panel.fgChartData && (
                      <div className="wm-chart-container">
                        <FearGreedChart value={panel.fgChartData.value} label={panel.fgChartData.label} />
                      </div>
                    )}
                    {panel.hasPriceChart && panel.priceChartData && panel.priceChartData.length > 0 && (
                      <div className="wm-chart-container">
                        <PriceChart 
                          data={panel.priceChartData} 
                          color={panel.tone === 'green' ? 'green' : panel.tone === 'red' ? 'red' : 'green'}
                          height={50}
                        />
                      </div>
                    )}
                    {panel.items.map((item, index) => (
                      <div className="wm-item" key={`${panel.id}-${index}`}>
                        {item}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Section>
      </div>
    </main>
  );
};

export default CryptoPage;
