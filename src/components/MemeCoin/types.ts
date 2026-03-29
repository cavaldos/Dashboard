export type MemeCoinSortDirection = 'asc' | 'desc';

export type MemeCoinChain = 'sol' | 'eth' | 'bsc' | 'base' | 'tron';

export type MemeCoinTokenClassification = 'almostBonded' | 'migrated' | 'unclassified';

export type MemeCoinToken = {
  id: string;
  chain: MemeCoinChain;
  mint: string;
  name: string;
  symbol: string;
  imageUri: string | null;
  tokenUrl: string;
  complete: boolean;
  classification: MemeCoinTokenClassification;
  sourceLaunchpad: string | null;
  sourceLaunchpadPlatform: string | null;
  marketCapUsd: number;
  volumeUsd: number;
  floatScore: number;
  txCount: number;
  holders: number;
  views: number;
  postAgeMinutes: number | null;
  sameTicker: number;
  bundlePercent: number;
  freshPercent: number;
  realPercent: number;
  athMarketCapUsd: number | null;
  athDrawdownPercent: number | null;
  athAgeMinutes: number | null;
  replies: number;
  createdAt: number;
  lastTradeAt: number;
};
