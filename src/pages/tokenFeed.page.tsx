import { useCallback, useEffect, useMemo, useState } from 'react';

import { MemeCoinTokenBoard, TokenChartModal } from '~/components/MemeCoin';
import type { MemeCoinSortDirection, MemeCoinToken } from '~/components/MemeCoin/types';
import { fetchTokenFeed, type FetchGmgnTokensParams } from '~/services/gmgn.service';
import '~/style/memecoin-feed.css';

type SortKey = 'marketCap' | 'volume' | 'age' | 'holders' | 'bundlePercent' | 'freshPercent' | 'realPercent' | 'ath' | 'postAge' | 'sameTicker' | 'views' | 'txCount';

const directionOptions = [
  { value: 'desc', label: 'High -> Low' },
  { value: 'asc', label: 'Low -> High' },
];

const sortOptions = [
  { value: 'marketCap', label: 'MCap' },
  { value: 'volume', label: 'Volume' },
  { value: 'age', label: 'Age' },
  { value: 'holders', label: 'Holders' },
  { value: 'bundlePercent', label: 'Bundle%' },
  { value: 'freshPercent', label: 'Fresh%' },
  { value: 'realPercent', label: 'Real%' },
  { value: 'ath', label: 'ATH' },
  { value: 'postAge', label: 'Post Age' },
  { value: 'sameTicker', label: 'Same Ticker' },
  { value: 'views', label: 'Views' },
  { value: 'txCount', label: 'TX' },
];

const sortByDirection = (left: number, right: number, direction: MemeCoinSortDirection) => {
  if (left === right) {
    return 0;
  }

  if (direction === 'asc') {
    return left - right;
  }

  return right - left;
};

const sortValueForToken = (token: MemeCoinToken, key: SortKey): number => {
  switch (key) {
    case 'marketCap':
      return token.marketCapUsd;
    case 'volume':
      return token.volumeUsd;
    case 'age':
      return token.createdAt;
    case 'holders':
      return token.holders;
    case 'bundlePercent':
      return token.bundlePercent;
    case 'freshPercent':
      return token.freshPercent;
    case 'realPercent':
      return token.realPercent;
    case 'ath':
      return token.athMarketCapUsd ?? 0;
    case 'postAge':
      return token.postAgeMinutes ?? 0;
    case 'sameTicker':
      return token.sameTicker;
    case 'views':
      return token.views;
    case 'txCount':
      return token.txCount;
    default:
      return token.marketCapUsd;
  }
};

const matchesTokenSearch = (token: MemeCoinToken, query: string) => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const haystacks = [token.symbol, token.name, token.mint, token.sourceLaunchpad ?? '', token.sourceLaunchpadPlatform ?? ''];
  return haystacks.some((value) => value.toLowerCase().includes(normalizedQuery));
};

// Polling interval in milliseconds (30 seconds)
const POLLING_INTERVAL = 30_000;

// Default fetch params
const DEFAULT_FETCH_PARAMS: FetchGmgnTokensParams = {
  chain: 'sol',
  timeRange: '1h',
  orderBy: 'created_at',
  direction: 'desc',
  limit: 100,
  filters: ['not_honeypot'],
};

const TokenFeedPage = () => {
  const [almostBonded, setAlmostBonded] = useState<MemeCoinToken[]>([]);
  const [migrated, setMigrated] = useState<MemeCoinToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [almostSortKey, setAlmostSortKey] = useState<SortKey>('age');
  const [almostSortDirection, setAlmostSortDirection] = useState<MemeCoinSortDirection>('desc');
  const [migratedSortKey, setMigratedSortKey] = useState<SortKey>('age');
  const [migratedSortDirection, setMigratedSortDirection] = useState<MemeCoinSortDirection>('desc');
  const [almostSearch, setAlmostSearch] = useState('');
  const [migratedSearch, setMigratedSearch] = useState('');
  const [lastPolledAt, setLastPolledAt] = useState<number | null>(null);
  const [lastTrackedCount, setLastTrackedCount] = useState(0);
  const [lastSkippedCount, setLastSkippedCount] = useState(0);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [selectedChartToken, setSelectedChartToken] = useState<MemeCoinToken | null>(null);

  const loadTokens = useCallback(async () => {
    try {
      setError(null);
      const {
        almostBonded: almost,
        migrated: grad,
        unclassifiedCount,
      } = await fetchTokenFeed(DEFAULT_FETCH_PARAMS);

      setAlmostBonded(almost);
      setMigrated(grad);
      setLastTrackedCount(almost.length + grad.length);
      setLastSkippedCount(unclassifiedCount);
      setLastPolledAt(Date.now());
    } catch (err) {
      console.error('Failed to fetch tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load and polling
  useEffect(() => {
    loadTokens();

    const intervalId = window.setInterval(() => {
      loadTokens();
    }, POLLING_INTERVAL);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadTokens]);

  // Clock update for relative times
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setClockNow(Date.now());
    }, 30_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const filteredAlmostBonded = useMemo(() => {
    return almostBonded
      .filter((token) => matchesTokenSearch(token, almostSearch))
      .sort((left, right) => {
        const primary = sortByDirection(
          sortValueForToken(left, almostSortKey),
          sortValueForToken(right, almostSortKey),
          almostSortDirection,
        );

        if (primary !== 0) {
          return primary;
        }

        return right.lastTradeAt - left.lastTradeAt;
      });
  }, [almostBonded, almostSearch, almostSortDirection, almostSortKey]);

  const filteredMigrated = useMemo(() => {
    return migrated
      .filter((token) => matchesTokenSearch(token, migratedSearch))
      .sort((left, right) => {
        const primary = sortByDirection(
          sortValueForToken(left, migratedSortKey),
          sortValueForToken(right, migratedSortKey),
          migratedSortDirection,
        );

        if (primary !== 0) {
          return primary;
        }

        return right.lastTradeAt - left.lastTradeAt;
      });
  }, [migrated, migratedSearch, migratedSortDirection, migratedSortKey]);

  if (isLoading) {
    return (
      <main className="mcf-page-shell">
        <section className="mcf-page-section">
          <div className="mcf-loading">Loading newest GMGN launches...</div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mcf-page-shell">
        <section className="mcf-page-section">
          <div className="mcf-error">
            <p>Error: {error}</p>
            <button onClick={loadTokens} type="button">
              Retry
            </button>
          </div>
        </section>
      </main>
    );
  }

  const lastPollTimeLabel = lastPolledAt ? new Date(lastPolledAt).toLocaleTimeString() : '--:--:--';
  const skippedSuffix = lastSkippedCount > 0 ? ` | ${lastSkippedCount} skipped` : '';

  return (
    <main className="mcf-page-shell">
      <section className="mcf-page-section">
        <p className="mcf-poll-meta">Last poll: {lastTrackedCount} tracked launches at {lastPollTimeLabel}{skippedSuffix}</p>
        <div className="mcf-grid">
          <MemeCoinTokenBoard
            title="Almost Bonded"
            subTag="Still on launchpad"
            tokens={filteredAlmostBonded}
            sortKey={almostSortKey}
            sortDirection={almostSortDirection}
            sortKeyOptions={sortOptions}
            sortDirectionOptions={directionOptions}
            onSortKeyChange={(value) => setAlmostSortKey(value as SortKey)}
            onSortDirectionChange={setAlmostSortDirection}
            searchValue={almostSearch}
            onSearchChange={setAlmostSearch}
            searchPlaceholder="Search symbol, name, mint..."
            now={clockNow}
            onOpenChart={setSelectedChartToken}
          />

          <MemeCoinTokenBoard
            title="Migrated"
            subTag="Already in pool"
            tokens={filteredMigrated}
            sortKey={migratedSortKey}
            sortDirection={migratedSortDirection}
            sortKeyOptions={sortOptions}
            sortDirectionOptions={directionOptions}
            onSortKeyChange={(value) => setMigratedSortKey(value as SortKey)}
            onSortDirectionChange={setMigratedSortDirection}
            searchValue={migratedSearch}
            onSearchChange={setMigratedSearch}
            searchPlaceholder="Search symbol, name, mint..."
            now={clockNow}
            onOpenChart={setSelectedChartToken}
          />
        </div>

        <TokenChartModal token={selectedChartToken} isOpen={selectedChartToken !== null} onClose={() => setSelectedChartToken(null)} />
      </section>
    </main>
  );
};

export default TokenFeedPage;
