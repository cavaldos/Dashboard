import type { MemeCoinToken, MemeCoinTokenClassification } from '~/components/MemeCoin/types';

// GMGN API types
export type GmgnChain = 'sol' | 'eth' | 'bsc' | 'base' | 'tron';
export type GmgnTimeRange = '5m' | '15m' | '1h' | '6h' | '24h';
export type GmgnOrderBy = 'volume' | 'created_at' | 'price_change_percent' | 'smart_money';
export type GmgnDirection = 'asc' | 'desc';

export interface GmgnTokenResponse {
  chain?: GmgnChain;
  address: string;
  symbol: string;
  name: string;
  price?: number;
  price_change_percent?: number;
  volume?: number;
  liquidity?: number;
  market_cap?: number;
  holder_count?: number;
  swaps?: number;
  buys?: number;
  sells?: number;
  creation_timestamp?: number;
  logo?: string;
  open_timestamp?: number;
  launchpad?: string;
  launchpad_platform?: string;
  launchpad_status?: string;
  // Pump.fun specific fields
  is_graduated?: boolean; // true = migrated, false = almost bonded
  progress?: number; // bonding curve progress (0-100)
  ath_market_cap?: number;
  pair?: {
    address?: string;
    dex?: string;
  };
}

export interface GmgnApiResponse {
  code: number;
  msg: string;
  data: {
    rank?: GmgnTokenResponse[];
    tokens?: GmgnTokenResponse[];
    data?: GmgnTokenResponse[];
  } | GmgnTokenResponse[];
}

export interface FetchGmgnTokensParams {
  chain?: GmgnChain;
  timeRange?: GmgnTimeRange;
  orderBy?: GmgnOrderBy;
  direction?: GmgnDirection;
  limit?: number;
  filters?: string[];
}

export type GmgnChartResolution = '5s' | '1m' | '5m' | '15m' | '1h' | '4h';
export type GmgnChartMetric = 'price' | 'marketCap';

export type GmgnChartCandle = {
  time: number;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  amount: number;
};

type GmgnChartCandleResponse = {
  code: number;
  msg?: string;
  message?: string;
  data?: {
    list?: Array<{
      time?: number | string;
      open?: number | string;
      close?: number | string;
      high?: number | string;
      low?: number | string;
      volume?: number | string;
      amount?: number | string;
    }>;
  };
};

type FetchGmgnTokenCandlesParams = {
  chain: GmgnChain;
  address: string;
  resolution: GmgnChartResolution;
  from: number;
  to: number;
  limit?: number;
  metric?: GmgnChartMetric;
  signal?: AbortSignal;
};

// Use proxy in development to avoid CORS issues
const BASE_API = '/api/gmgn/defi/quotation/v1';
const BASE_CHART_API = '/api/gmgn/api/v1';
const ATH_CACHE_STORAGE_KEY = 'gmgn-token-feed-ath-cache';
const ATH_CACHE_MAX_ENTRIES = 1000;
const ATH_CACHE_RETENTION_MS = 24 * 60 * 60 * 1000;

type ObservedAthEntry = {
  marketCapUsd: number;
  observedAt: number;
  updatedAt: number;
};

const observedAthCache = new Map<string, ObservedAthEntry>();
let hasLoadedObservedAthCache = false;

const isBrowser = () => typeof window !== 'undefined';

const loadObservedAthCache = () => {
  if (hasLoadedObservedAthCache || !isBrowser()) {
    return;
  }

  hasLoadedObservedAthCache = true;

  try {
    const raw = window.localStorage.getItem(ATH_CACHE_STORAGE_KEY);

    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw) as Record<string, ObservedAthEntry>;
    const now = Date.now();

    Object.entries(parsed).forEach(([mint, entry]) => {
      if (
        typeof entry?.marketCapUsd === 'number'
        && typeof entry?.observedAt === 'number'
        && typeof entry?.updatedAt === 'number'
        && now - entry.updatedAt <= ATH_CACHE_RETENTION_MS
      ) {
        observedAthCache.set(mint, entry);
      }
    });
  } catch (error) {
    console.warn('Failed to restore ATH cache', error);
  }
};

const persistObservedAthCache = () => {
  if (!isBrowser()) {
    return;
  }

  try {
    const now = Date.now();
    const entries = [...observedAthCache.entries()]
      .filter(([, entry]) => now - entry.updatedAt <= ATH_CACHE_RETENTION_MS)
      .sort((left, right) => right[1].updatedAt - left[1].updatedAt)
      .slice(0, ATH_CACHE_MAX_ENTRIES);

    observedAthCache.clear();

    entries.forEach(([mint, entry]) => {
      observedAthCache.set(mint, entry);
    });

    window.localStorage.setItem(ATH_CACHE_STORAGE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch (error) {
    console.warn('Failed to persist ATH cache', error);
  }
};

const resolveObservedAth = (mint: string, marketCapUsd: number, now: number) => {
  loadObservedAthCache();

  const nextMarketCapUsd = Math.max(0, marketCapUsd);
  const current = observedAthCache.get(mint);

  if (!current || nextMarketCapUsd >= current.marketCapUsd) {
    const nextEntry: ObservedAthEntry = {
      marketCapUsd: nextMarketCapUsd,
      observedAt: now,
      updatedAt: now,
    };

    observedAthCache.set(mint, nextEntry);
    return nextEntry;
  }

  const nextEntry: ObservedAthEntry = {
    ...current,
    updatedAt: now,
  };

  observedAthCache.set(mint, nextEntry);
  return nextEntry;
};

const buildTokenUrl = (token: GmgnTokenResponse) => {
  const chain = token.chain ?? 'sol';
  return `https://gmgn.ai/${chain}/token/${encodeURIComponent(token.address)}`;
};

const parseCandleNumber = (value: number | string | undefined) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

export async function fetchGmgnTokenCandles({
  chain,
  address,
  resolution,
  from,
  to,
  limit = 240,
  metric = 'marketCap',
  signal,
}: FetchGmgnTokenCandlesParams): Promise<GmgnChartCandle[]> {
  const endpoint = metric === 'marketCap' ? 'token_mcap_candles' : 'token_candles';
  const queryParams = new URLSearchParams({
    resolution,
    from: String(from),
    to: String(to),
    limit: String(limit),
  });

  const response = await fetch(`${BASE_CHART_API}/${endpoint}/${chain}/${encodeURIComponent(address)}?${queryParams.toString()}`, {
    method: 'GET',
    signal,
  });

  if (!response.ok) {
    throw new Error(`GMGN chart API error: ${response.status} ${response.statusText}`);
  }

  const payload: GmgnChartCandleResponse = await response.json();

  if (payload.code !== 0) {
    throw new Error(payload.message ?? payload.msg ?? 'Failed to load chart data');
  }

  return (payload.data?.list ?? [])
    .map((candle) => ({
      time: parseCandleNumber(candle.time),
      open: parseCandleNumber(candle.open),
      close: parseCandleNumber(candle.close),
      high: parseCandleNumber(candle.high),
      low: parseCandleNumber(candle.low),
      volume: parseCandleNumber(candle.volume),
      amount: parseCandleNumber(candle.amount),
    }))
    .filter((candle) => candle.time > 0)
    .sort((left, right) => left.time - right.time);
}

export function classifyGmgnToken(token: GmgnTokenResponse): MemeCoinTokenClassification {
  const launchpad = token.launchpad?.trim().toLowerCase() ?? '';
  const launchpadPlatform = token.launchpad_platform?.trim().toLowerCase() ?? '';

  if (token.is_graduated === true) {
    return 'migrated';
  }

  if (token.is_graduated === false) {
    return 'almostBonded';
  }

  if (launchpadPlatform.startsWith('pool_')) {
    return 'migrated';
  }

  if (launchpad || launchpadPlatform) {
    return 'almostBonded';
  }

  if (token.address.endsWith('pump')) {
    return 'almostBonded';
  }

  return 'unclassified';
}

/**
 * Fetch tokens from GMGN API
 */
export async function fetchGmgnTokens(params: FetchGmgnTokensParams = {}): Promise<GmgnTokenResponse[]> {
  const {
    chain = 'sol',
    timeRange = '1h',
    orderBy = 'created_at',
    direction = 'desc',
    limit = 100,
    filters = ['not_honeypot'],
  } = params;

  const queryParams = new URLSearchParams();
  queryParams.set('orderby', orderBy);
  queryParams.set('direction', direction);
  queryParams.set('limit', String(limit));

  filters.forEach((filter) => {
    queryParams.append('filters[]', filter);
  });

  const url = `${BASE_API}/rank/${chain}/swaps/${timeRange}?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`GMGN API error: ${response.status} ${response.statusText}`);
  }

  const payload: GmgnApiResponse = await response.json();

  // Handle different response structures
  const { data } = payload;
  if (Array.isArray(data)) {
    return data;
  }

  if (typeof data === 'object' && data !== null) {
    return data.rank ?? data.tokens ?? data.data ?? [];
  }

  return [];
}

/**
 * Transform GMGN token response to MemeCoinToken format
 */
export function transformGmgnToMemeCoinToken(token: GmgnTokenResponse): MemeCoinToken {
  const now = Date.now();
  const createdAt = token.creation_timestamp ? token.creation_timestamp * 1000 : now;
  const ageMinutes = Math.floor((now - createdAt) / 60_000);
  const classification = classifyGmgnToken(token);
  const observedAth = resolveObservedAth(token.address, token.market_cap ?? 0, now);
  const apiAthMarketCapUsd = token.ath_market_cap ?? null;
  const athMarketCapUsd = Math.max(apiAthMarketCapUsd ?? 0, observedAth.marketCapUsd, token.market_cap ?? 0);
  const athAgeMinutes = apiAthMarketCapUsd !== null && apiAthMarketCapUsd >= observedAth.marketCapUsd
    ? null
    : Math.max(0, Math.floor((now - observedAth.observedAt) / 60_000));

  return {
    id: token.address,
    chain: token.chain ?? 'sol',
    mint: token.address,
    name: token.name || 'Unknown',
    symbol: token.symbol || '???',
    imageUri: token.logo ?? null,
    tokenUrl: buildTokenUrl(token),
    complete: classification === 'migrated',
    classification,
    sourceLaunchpad: token.launchpad ?? null,
    sourceLaunchpadPlatform: token.launchpad_platform ?? null,
    marketCapUsd: token.market_cap ?? 0,
    volumeUsd: token.volume ?? 0,
    floatScore: 0, // Not available from GMGN
    txCount: token.swaps ?? (token.buys ?? 0) + (token.sells ?? 0),
    holders: token.holder_count ?? 0,
    views: 0, // Not available from GMGN
    postAgeMinutes: ageMinutes > 0 ? ageMinutes : null,
    sameTicker: 1, // Not available from GMGN
    bundlePercent: 0, // Not available from GMGN
    freshPercent: 0, // Not available from GMGN
    realPercent: 0, // Not available from GMGN
    athMarketCapUsd,
    athDrawdownPercent: athMarketCapUsd > 0 && token.market_cap
      ? Math.round(((token.market_cap - athMarketCapUsd) / athMarketCapUsd) * 100)
      : null,
    athAgeMinutes,
    replies: 0, // Not available from GMGN
    createdAt,
    lastTradeAt: token.open_timestamp ? token.open_timestamp * 1000 : now,
  };
}

/**
 * Fetch and transform tokens, splitting into almost bonded and migrated
 */
export async function fetchTokenFeed(params: FetchGmgnTokensParams = {}): Promise<{
  almostBonded: MemeCoinToken[];
  migrated: MemeCoinToken[];
  totalFetched: number;
  unclassifiedCount: number;
}> {
  const tokens = await fetchGmgnTokens(params);
  const transformed = tokens.map(transformGmgnToMemeCoinToken);

  persistObservedAthCache();

  const almostBonded = transformed.filter((token) => token.classification === 'almostBonded');
  const migrated = transformed.filter((token) => token.classification === 'migrated');
  const unclassifiedCount = transformed.filter((token) => token.classification === 'unclassified').length;

  return {
    almostBonded,
    migrated,
    totalFetched: transformed.length,
    unclassifiedCount,
  };
}

/**
 * Check if token is from pump.fun (launchpad detection)
 */
export function isPumpFunToken(token: GmgnTokenResponse): boolean {
  const launchpad = token.launchpad?.toLowerCase();
  const launchpadPlatform = token.launchpad_platform?.toLowerCase();

  return launchpad === 'pump'
    || launchpadPlatform === 'pump.fun'
    || launchpadPlatform === 'pump_agent'
    || token.address.endsWith('pump');
}
