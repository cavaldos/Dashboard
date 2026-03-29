import { useState } from 'react';

import { cn } from '~/lib/utils';

import { formatAgeFromNow, formatCompactNumber, formatSignedPercent, formatUsdCompact, shortMint } from './format';
import type { MemeCoinToken } from './types';

type MemeCoinTokenItemProps = {
  token: MemeCoinToken;
  now: number;
  onOpenChart?: (token: MemeCoinToken) => void;
};

const ChartIcon = () => {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="mcf-chart-icon" aria-hidden="true">
      <path d="M3 16.25H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 12.5V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 8.25H8.5V11.25H6Z" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.2" />
      <path d="M10 15V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 6.5H12.5V10.75H10Z" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.2" />
      <path d="M14 13.5V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 9.25H16.5V12.25H14Z" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
};

const TokenAvatar = ({ imageUri, symbol }: { imageUri: string | null; symbol: string }) => {
  const [hasError, setHasError] = useState(!imageUri);

  if (hasError || !imageUri) {
    return (
      <span className="mcf-avatar-fallback" aria-hidden="true">
        {symbol.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={imageUri}
      alt={`${symbol} logo`}
      loading="lazy"
      className="mcf-avatar-image"
      onError={() => setHasError(true)}
    />
  );
};

const resolveAthDrawdown = (token: MemeCoinToken) => {
  if (token.athDrawdownPercent !== null) {
    return token.athDrawdownPercent;
  }

  if (token.athMarketCapUsd === null || token.athMarketCapUsd <= 0) {
    return null;
  }

  return ((token.marketCapUsd - token.athMarketCapUsd) / token.athMarketCapUsd) * 100;
};

const SOURCE_LABELS: Record<string, string> = {
  'pump.fun': 'Pump.fun',
  pump_agent: 'Pump Agent',
  letsbonk: 'LetsBonk',
  anoncoin: 'Anoncoin',
  meteora_virtual_curve: 'Meteora Curve',
  pool_meteora: 'Meteora Pool',
  pool_pump_amm: 'Pump AMM',
};

const humanizeSource = (source: string) => {
  return source
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => (part.length <= 3 ? part.toUpperCase() : `${part[0].toUpperCase()}${part.slice(1)}`))
    .join(' ');
};

const formatTokenSource = (token: MemeCoinToken) => {
  const source = token.sourceLaunchpadPlatform ?? token.sourceLaunchpad;
  const prefix = token.classification === 'migrated' ? 'Migrated' : 'Launchpad';

  if (!source) {
    return prefix;
  }

  const normalized = source.trim().toLowerCase();
  const label = SOURCE_LABELS[normalized] ?? humanizeSource(source);
  return `${prefix} ${label}`;
};

export const MemeCoinTokenItem = ({ token, now, onOpenChart }: MemeCoinTokenItemProps) => {
  const athDrawdown = resolveAthDrawdown(token);
  const sourceLabel = formatTokenSource(token);

  return (
    <article className="mcf-item">
      <div className="mcf-item-shell">
        <a href={token.tokenUrl} target="_blank" rel="noreferrer" className="mcf-item-link">
          <div className="mcf-avatar-wrap">
            <TokenAvatar imageUri={token.imageUri} symbol={token.symbol} />
          </div>

          <div className="mcf-item-main">
            <div className="mcf-item-headline">
              <h3 className="mcf-item-symbol">{token.symbol}</h3>
              <span className="mcf-item-name">{token.name}</span>
              <span className="mcf-item-meta">{formatAgeFromNow(token.createdAt, now)}</span>
              <span className="mcf-item-meta">{shortMint(token.mint, 4, 4)}</span>
              <span className="mcf-item-meta">x {formatCompactNumber(token.replies)}</span>
            </div>

            <div className="mcf-item-stats">
              <span className="mcf-item-stat">
                <span className="mcf-item-stat-key">MC</span>
                <strong className="mcf-item-stat-value">{formatUsdCompact(token.marketCapUsd)}</strong>
              </span>
              <span className="mcf-item-stat">
                <span className="mcf-item-stat-key">V</span>
                <strong className="mcf-item-stat-value">{formatUsdCompact(token.volumeUsd)}</strong>
              </span>
              <span className="mcf-item-stat">
                <span className="mcf-item-stat-key">F</span>
                <strong className="mcf-item-stat-value">{token.floatScore.toFixed(1)}</strong>
              </span>
              <span className="mcf-item-stat">
                <span className="mcf-item-stat-key">TX</span>
                <strong className="mcf-item-stat-value">{formatCompactNumber(token.txCount)}</strong>
              </span>
              <span className="mcf-item-stat">
                <span className="mcf-item-stat-key">Holders</span>
                <strong className="mcf-item-stat-value">{formatCompactNumber(token.holders)}</strong>
              </span>
              <span className="mcf-item-stat">
                <span className="mcf-item-stat-key">Views</span>
                <strong className="mcf-item-stat-value">{formatCompactNumber(token.views)}</strong>
              </span>
              {token.postAgeMinutes !== null ? (
                <span className="mcf-item-stat">
                  <span className="mcf-item-stat-key">Post</span>
                  <strong className="mcf-item-stat-value">{token.postAgeMinutes}m</strong>
                </span>
              ) : null}
              <span className="mcf-item-stat">
                <span className="mcf-item-stat-key">SameTkr</span>
                <strong className="mcf-item-stat-value">{token.sameTicker}</strong>
              </span>
            </div>

            <div className="mcf-item-foot">
              <span className={cn('mcf-pill', token.classification === 'migrated' ? 'is-migrated' : 'is-launchpad')}>{sourceLabel}</span>
              <span className="mcf-pill is-bundle">Bundle {token.bundlePercent}%</span>
              <span className="mcf-pill is-fresh">Fresh {token.freshPercent}%</span>
              <span className="mcf-pill is-real">Real {token.realPercent}%</span>
              <span className="mcf-ath-row">
                <span className="mcf-ath-label">ATH</span>
                <strong className="mcf-ath-value">{formatUsdCompact(token.athMarketCapUsd)}</strong>
                <strong className={cn('mcf-ath-change', athDrawdown !== null && athDrawdown <= 0 ? 'is-negative' : 'is-positive')}>
                  ({formatSignedPercent(athDrawdown)})
                </strong>
                <span className="mcf-ath-age">{token.athAgeMinutes !== null ? `${token.athAgeMinutes}m` : '--'}</span>
              </span>
            </div>
          </div>
        </a>

        {onOpenChart ? (
          <div className="mcf-item-actions">
            <button
              type="button"
              className="mcf-chart-trigger"
              onClick={() => onOpenChart(token)}
              aria-label={`Open ${token.symbol} chart`}
              title={`Open ${token.symbol} chart`}
            >
              <ChartIcon />
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
};
