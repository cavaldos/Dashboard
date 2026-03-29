import { useCallback, useEffect, useMemo, useState, type WheelEvent } from 'react';

import { UiModal } from '~/components/UI/UiModal';
import { fetchGmgnTokenCandles, type GmgnChartCandle, type GmgnChartResolution } from '~/services/gmgn.service';

import { formatCompactNumber, shortMint } from './format';
import type { MemeCoinToken } from './types';

type TokenChartModalProps = {
  token: MemeCoinToken | null;
  isOpen: boolean;
  onClose: () => void;
};

type ChartIntervalKey = '5s' | '1m' | '5m' | '15m' | '1h' | '4h';

const CHART_INTERVALS: Array<{
  key: ChartIntervalKey;
  label: string;
  resolution: GmgnChartResolution;
  lookbackMs: number;
  limit: number;
}> = [
  {
    key: '5s',
    label: '5s',
    resolution: '5s',
    lookbackMs: 20 * 60 * 1000,
    limit: 240,
  },
  {
    key: '1m',
    label: '1m',
    resolution: '1m',
    lookbackMs: 4 * 60 * 60 * 1000,
    limit: 240,
  },
  {
    key: '5m',
    label: '5m',
    resolution: '5m',
    lookbackMs: 24 * 60 * 60 * 1000,
    limit: 288,
  },
  {
    key: '15m',
    label: '15m',
    resolution: '15m',
    lookbackMs: 3 * 24 * 60 * 60 * 1000,
    limit: 288,
  },
  {
    key: '1h',
    label: '1h',
    resolution: '1h',
    lookbackMs: 14 * 24 * 60 * 60 * 1000,
    limit: 336,
  },
  {
    key: '4h',
    label: '4h',
    resolution: '4h',
    lookbackMs: 60 * 24 * 60 * 60 * 1000,
    limit: 360,
  },
];

const CHART_VIEWBOX_WIDTH = 1120;
const CHART_VIEWBOX_HEIGHT = 520;
const CHART_PADDING_TOP = 16;
const CHART_PADDING_LEFT = 16;
const CHART_PADDING_RIGHT = 92;
const CHART_PADDING_BOTTOM = 34;
const CHART_VOLUME_HEIGHT = 88;
const CHART_VOLUME_GAP = 14;
const CHART_GRID_ROWS = 6;
const CHART_GRID_COLUMNS = 7;
const MIN_VISIBLE_CANDLES = 24;
const ZOOM_FACTOR_STEP = 1.3;
const MAX_ZOOM_FACTOR = 16;

const formatAxisUsd = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return '$0';
  }

  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }

  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }

  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }

  if (value >= 1) {
    return `$${value.toFixed(2)}`;
  }

  return `$${value.toFixed(6)}`;
};

const formatSummaryTime = (timestamp: number | null) => {
  if (!timestamp) {
    return '--';
  }

  return new Date(timestamp).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatTimeTick = (timestamp: number, resolution: GmgnChartResolution) => {
  if (resolution === '5s') {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  if (resolution === '4h') {
    return new Date(timestamp).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
  }

  if (resolution === '1h') {
    return new Date(timestamp).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
    });
  }

  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const TokenChartCanvas = ({
  candles,
  resolution,
  canZoomIn,
  canZoomOut,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: {
  candles: GmgnChartCandle[];
  resolution: GmgnChartResolution;
  canZoomIn: boolean;
  canZoomOut: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}) => {
  const chartData = useMemo(() => {
    if (candles.length === 0) {
      return null;
    }

    const plotWidth = CHART_VIEWBOX_WIDTH - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;
    const pricePlotHeight = CHART_VIEWBOX_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM - CHART_VOLUME_HEIGHT - CHART_VOLUME_GAP;
    const pricePlotBottom = CHART_PADDING_TOP + pricePlotHeight;
    const volumeTop = pricePlotBottom + CHART_VOLUME_GAP;

    let minPrice = Number.POSITIVE_INFINITY;
    let maxPrice = Number.NEGATIVE_INFINITY;
    let maxVolume = 0;

    candles.forEach((candle) => {
      minPrice = Math.min(minPrice, candle.low);
      maxPrice = Math.max(maxPrice, candle.high);
      maxVolume = Math.max(maxVolume, candle.volume);
    });

    if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice)) {
      return null;
    }

    const priceRange = maxPrice - minPrice;
    const pricePadding = priceRange > 0 ? priceRange * 0.08 : Math.max(maxPrice * 0.08, 1);
    const normalizedMinPrice = Math.max(0, minPrice - pricePadding);
    const normalizedMaxPrice = maxPrice + pricePadding;
    const normalizedPriceRange = Math.max(normalizedMaxPrice - normalizedMinPrice, 1);
    const stepX = plotWidth / Math.max(candles.length, 1);
    const candleBodyWidth = Math.min(16, Math.max(3, stepX * 0.64));

    const scalePriceY = (price: number) => {
      const ratio = (normalizedMaxPrice - price) / normalizedPriceRange;
      return CHART_PADDING_TOP + ratio * pricePlotHeight;
    };

    const scaleVolumeY = (volume: number) => {
      if (maxVolume <= 0) {
        return volumeTop + CHART_VOLUME_HEIGHT;
      }

      const ratio = volume / maxVolume;
      return volumeTop + CHART_VOLUME_HEIGHT - ratio * CHART_VOLUME_HEIGHT;
    };

    const renderedCandles = candles.map((candle, index) => {
      const wickX = CHART_PADDING_LEFT + stepX * index + stepX / 2;
      const openY = scalePriceY(candle.open);
      const closeY = scalePriceY(candle.close);
      const highY = scalePriceY(candle.high);
      const lowY = scalePriceY(candle.low);
      const bodyY = Math.min(openY, closeY);
      const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));
      const isPositive = candle.close >= candle.open;
      const volumeY = scaleVolumeY(candle.volume);
      const volumeHeight = Math.max(1.5, volumeTop + CHART_VOLUME_HEIGHT - volumeY);

      return {
        key: `${candle.time}-${index}`,
        wickX,
        openY,
        closeY,
        highY,
        lowY,
        bodyY,
        bodyHeight,
        isPositive,
        bodyWidth: candleBodyWidth,
        volumeWidth: Math.max(3, Math.min(6, candleBodyWidth - 1)),
        volumeY,
        volumeHeight,
      };
    });

    const priceTicks = Array.from({ length: CHART_GRID_ROWS }, (_, index) => {
      const ratio = index / (CHART_GRID_ROWS - 1);
      const y = CHART_PADDING_TOP + pricePlotHeight * ratio;
      const value = normalizedMaxPrice - normalizedPriceRange * ratio;
      return {
        key: `price-${index}`,
        y,
        label: formatAxisUsd(value),
      };
    });

    const timeTickIndexes = Array.from({ length: CHART_GRID_COLUMNS }, (_, index) => {
      if (candles.length === 1) {
        return 0;
      }

      return Math.round((candles.length - 1) * (index / (CHART_GRID_COLUMNS - 1)));
    }).filter((value, index, array) => array.indexOf(value) === index);

    const timeTicks = timeTickIndexes.map((index) => {
      const x = CHART_PADDING_LEFT + stepX * index + stepX / 2;
      return {
        key: `time-${index}`,
        x,
        label: formatTimeTick(candles[index].time, resolution),
      };
    });

    const lastCandle = candles[candles.length - 1];
    const lastCloseY = clamp(scalePriceY(lastCandle.close), CHART_PADDING_TOP + 10, pricePlotBottom - 10);
    const lastCloseLabel = formatAxisUsd(lastCandle.close);
    const lastCloseLabelWidth = Math.max(68, lastCloseLabel.length * 7 + 18);

    return {
      plotRight: CHART_VIEWBOX_WIDTH - CHART_PADDING_RIGHT,
      pricePlotBottom,
      volumeTop,
      renderedCandles,
      priceTicks,
      timeTicks,
      lastCloseY,
      lastCloseLabel,
      lastCloseLabelWidth,
    };
  }, [candles, resolution]);

  if (chartData === null) {
    return null;
  }

  const handleWheelZoom = (event: WheelEvent<HTMLDivElement>) => {
    if (event.deltaY === 0) {
      return;
    }

    event.preventDefault();

    if (event.deltaY < 0 && canZoomIn) {
      onZoomIn();
      return;
    }

    if (event.deltaY > 0 && canZoomOut) {
      onZoomOut();
    }
  };

  return (
    <div className="mcf-chart-canvas" onWheel={handleWheelZoom}>
      <div className="mcf-chart-zoom-controls" aria-label="Chart zoom controls">
        <button type="button" className="mcf-chart-zoom-btn" onClick={onZoomOut} disabled={!canZoomOut}>
          -
        </button>
        <button type="button" className="mcf-chart-zoom-btn" onClick={onZoomReset}>
          1:1
        </button>
        <button type="button" className="mcf-chart-zoom-btn" onClick={onZoomIn} disabled={!canZoomIn}>
          +
        </button>
      </div>

      <svg viewBox={`0 0 ${CHART_VIEWBOX_WIDTH} ${CHART_VIEWBOX_HEIGHT}`} className="mcf-chart-svg" aria-label="Token market cap chart" role="img">
        <rect x="0" y="0" width={CHART_VIEWBOX_WIDTH} height={CHART_VIEWBOX_HEIGHT} fill="#0f141c" rx="16" />

        {chartData.priceTicks.map((tick) => (
          <g key={tick.key}>
            <line x1={CHART_PADDING_LEFT} y1={tick.y} x2={chartData.plotRight} y2={tick.y} stroke="rgba(52, 61, 76, 0.88)" strokeWidth="1" />
            <text x={chartData.plotRight + 14} y={tick.y + 4} fill="#8e97a8" fontSize="13" fontFamily="var(--mono)">
              {tick.label}
            </text>
          </g>
        ))}

        {chartData.timeTicks.map((tick) => (
          <g key={tick.key}>
            <line x1={tick.x} y1={CHART_PADDING_TOP} x2={tick.x} y2={chartData.pricePlotBottom + CHART_VOLUME_GAP + CHART_VOLUME_HEIGHT} stroke="rgba(44, 51, 64, 0.52)" strokeWidth="1" />
            <text x={tick.x} y={CHART_VIEWBOX_HEIGHT - 10} fill="#8e97a8" fontSize="13" fontFamily="var(--mono)" textAnchor="middle">
              {tick.label}
            </text>
          </g>
        ))}

        {chartData.renderedCandles.map((candle) => {
          const color = candle.isPositive ? '#4fd46e' : '#ff5c54';

          return (
            <g key={candle.key}>
              <rect x={candle.wickX - candle.volumeWidth / 2} y={candle.volumeY} width={candle.volumeWidth} height={candle.volumeHeight} fill={candle.isPositive ? 'rgba(79, 212, 110, 0.35)' : 'rgba(255, 92, 84, 0.28)'} rx="2" />
              <line x1={candle.wickX} y1={candle.highY} x2={candle.wickX} y2={candle.lowY} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
              <rect x={candle.wickX - candle.bodyWidth / 2} y={candle.bodyY} width={candle.bodyWidth} height={candle.bodyHeight} fill={color} rx="1.5" />
            </g>
          );
        })}

        <line
          x1={CHART_PADDING_LEFT}
          y1={chartData.lastCloseY}
          x2={chartData.plotRight}
          y2={chartData.lastCloseY}
          stroke="#39c16c"
          strokeDasharray="4 4"
          strokeWidth="1.1"
        />
        <rect
          x={CHART_VIEWBOX_WIDTH - chartData.lastCloseLabelWidth - 10}
          y={chartData.lastCloseY - 12}
          width={chartData.lastCloseLabelWidth}
          height="24"
          rx="6"
          fill="#39c16c"
        />
        <text
          x={CHART_VIEWBOX_WIDTH - chartData.lastCloseLabelWidth / 2 - 10}
          y={chartData.lastCloseY + 4}
          fill="#eef7ee"
          fontSize="13"
          fontFamily="var(--mono)"
          fontWeight="700"
          textAnchor="middle"
        >
          {chartData.lastCloseLabel}
        </text>
      </svg>
    </div>
  );
};

export const TokenChartModal = ({ token, isOpen, onClose }: TokenChartModalProps) => {
  const [interval, setInterval] = useState<ChartIntervalKey>('5m');
  const [candles, setCandles] = useState<GmgnChartCandle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomFactor, setZoomFactor] = useState(1);
  const tokenChain = token?.chain ?? null;
  const tokenMint = token?.mint ?? null;

  const handleZoomIn = useCallback(() => {
    setZoomFactor((currentZoomFactor) => clamp(currentZoomFactor * ZOOM_FACTOR_STEP, 1, MAX_ZOOM_FACTOR));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomFactor((currentZoomFactor) => clamp(currentZoomFactor / ZOOM_FACTOR_STEP, 1, MAX_ZOOM_FACTOR));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomFactor(1);
  }, []);

  const activeInterval = useMemo(() => {
    return CHART_INTERVALS.find((option) => option.key === interval) ?? CHART_INTERVALS[1];
  }, [interval]);

  const handleClose = useCallback(() => {
    setCandles([]);
    setError(null);
    setIsLoading(false);
    setZoomFactor(1);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || tokenChain === null || tokenMint === null) {
      return;
    }

    const controller = new AbortController();
    const to = Date.now();
    const from = to - activeInterval.lookbackMs;

    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        setIsLoading(true);
        setError(null);
        setZoomFactor(1);
      }
    });

    fetchGmgnTokenCandles({
      chain: tokenChain,
      address: tokenMint,
      resolution: activeInterval.resolution,
      from,
      to,
      limit: activeInterval.limit,
      metric: 'marketCap',
      signal: controller.signal,
    })
      .then((nextCandles) => {
        if (nextCandles.length === 0) {
          setCandles([]);
          setError('No market cap candles available for this token yet.');
          return;
        }

        setCandles(nextCandles);
      })
      .catch((err) => {
        if (controller.signal.aborted) {
          return;
        }

        setCandles([]);
        setError(err instanceof Error ? err.message : 'Failed to load chart data.');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [activeInterval.limit, activeInterval.lookbackMs, activeInterval.resolution, isOpen, tokenChain, tokenMint]);

  const lastCandle = candles[candles.length - 1] ?? null;
  const minVisibleCandles = candles.length === 0 ? 0 : Math.min(MIN_VISIBLE_CANDLES, candles.length);
  const visibleCandleCount = candles.length === 0
    ? 0
    : clamp(Math.floor(candles.length / zoomFactor), minVisibleCandles, candles.length);
  const visibleCandles = visibleCandleCount > 0 ? candles.slice(-visibleCandleCount) : candles;
  const canZoomIn = candles.length > minVisibleCandles && visibleCandleCount > minVisibleCandles;
  const canZoomOut = visibleCandleCount < candles.length;
  const zoomWindowPercent = candles.length > 0 ? Math.round((visibleCandleCount / candles.length) * 100) : 100;

  return (
    <UiModal
      isOpen={isOpen}
      title={token ? `${token.symbol} - Chart` : 'Token Chart'}
      onClose={handleClose}
      headerClassName="mcf-chart-modal-header"
      titleClassName="mcf-chart-modal-title"
      closeClassName="mcf-chart-modal-close"
      panelClassName="w-full max-w-[1280px]"
      bodyClassName="max-h-[calc(90vh-64px)] overflow-auto p-0"
    >
      {token ? (
        <div className="mcf-chart-modal">
          <div className="mcf-chart-toolbar">
            <div className="mcf-chart-token-meta">
              <div className="mcf-chart-token-row">
                <strong className="mcf-chart-token-symbol">{token.symbol}</strong>
                <span className="mcf-chart-token-name">{token.name}</span>
              </div>
              <div className="mcf-chart-token-row is-subtle">
                <span>{shortMint(token.mint, 6, 6)}</span>
                <span>{token.classification === 'migrated' ? 'Migrated pool' : 'Launchpad'}</span>
                <span>{formatSummaryTime(lastCandle?.time ?? null)}</span>
              </div>
            </div>

            <div className="mcf-chart-actions">
              <div className="mcf-chart-intervals" aria-label="Chart interval">
                {CHART_INTERVALS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={`mcf-chart-interval${option.key === interval ? ' is-active' : ''}`}
                    onClick={() => {
                      setInterval(option.key);
                      setZoomFactor(1);
                    }}
                    aria-pressed={option.key === interval}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <a href={token.tokenUrl} target="_blank" rel="noreferrer" className="mcf-chart-link">
                Open GMGN
              </a>
            </div>
          </div>

          <div className="mcf-chart-summary">
            <span className="mcf-chart-summary-item">
              <span className="mcf-chart-summary-label">Last</span>
              <strong className="mcf-chart-summary-value">{lastCandle ? formatAxisUsd(lastCandle.close) : '--'}</strong>
            </span>
            <span className="mcf-chart-summary-item">
              <span className="mcf-chart-summary-label">High</span>
              <strong className="mcf-chart-summary-value">{lastCandle ? formatAxisUsd(lastCandle.high) : '--'}</strong>
            </span>
            <span className="mcf-chart-summary-item">
              <span className="mcf-chart-summary-label">Low</span>
              <strong className="mcf-chart-summary-value">{lastCandle ? formatAxisUsd(lastCandle.low) : '--'}</strong>
            </span>
            <span className="mcf-chart-summary-item">
              <span className="mcf-chart-summary-label">Volume</span>
              <strong className="mcf-chart-summary-value">{lastCandle ? formatCompactNumber(lastCandle.volume) : '--'}</strong>
            </span>
            <span className="mcf-chart-summary-item">
              <span className="mcf-chart-summary-label">Window</span>
              <strong className="mcf-chart-summary-value">{candles.length > 0 ? `${zoomWindowPercent}%` : '--'}</strong>
            </span>
          </div>

          <div className="mcf-chart-panel">
            {isLoading ? (
              <div className="mcf-chart-state">Loading market cap candles...</div>
            ) : error ? (
              <div className="mcf-chart-state is-error">
                <p>{error}</p>
                <a href={token.tokenUrl} target="_blank" rel="noreferrer" className="mcf-chart-link">
                  Open full chart on GMGN
                </a>
              </div>
            ) : (
              <TokenChartCanvas
                candles={visibleCandles}
                resolution={activeInterval.resolution}
                canZoomIn={canZoomIn}
                canZoomOut={canZoomOut}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onZoomReset={handleZoomReset}
              />
            )}
          </div>
        </div>
      ) : null}
    </UiModal>
  );
};
