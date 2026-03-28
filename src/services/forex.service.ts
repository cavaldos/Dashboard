export type ImpactLevel = 'High' | 'Medium' | 'Low';
export type NewsCategory = 'financial' | 'geopolitical';

export interface FxPairSnapshot {
  pair: string;
  base: string;
  quote: string;
  rate: number;
  previousRate: number;
  changePct: number;
  direction: 'up' | 'down' | 'flat';
  timestamp: string;
}

export interface ForexEconomicEvent {
  id: string;
  title: string;
  currency: string;
  date: string;
  impact: ImpactLevel | 'Holiday';
  forecast: string;
  previous: string;
}

export interface ForexNewsItem {
  id: string;
  title: string;
  summary: string;
  link: string;
  source: string;
  publishedAt: string;
  impact: ImpactLevel;
  category: NewsCategory;
  theme: 'Policy' | 'Energy' | 'Geopolitics' | 'Growth' | 'Risk sentiment' | 'Trade';
}

type FrankfurterRatesResponse = {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
};

type FairEconomyCalendarItem = {
  title: string;
  country: string;
  date: string;
  impact: string;
  forecast: string;
  previous: string;
};

const FX_SYMBOLS = ['EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD'];
const FX_BASE_URL = 'https://api.frankfurter.app';
const CALENDAR_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';

const FINANCIAL_RSS_FEEDS = [
  'https://feeds.bbci.co.uk/news/business/rss.xml',
  'https://www.cnbc.com/id/100003114/device/rss/rss.html',
];

const GEOPOLITICAL_RSS_FEEDS = [
  'https://www.ft.com/world?format=rss',
  'https://www.cnbc.com/id/100727362/device/rss/rss.html',
  'https://www.cnbc.com/id/100727362/device/rss/rss.html?output=1',
];

const POLICY_KEYWORDS = ['fomc', 'federal reserve', 'ecb', 'boe', 'boj', 'rba', 'rbnz', 'snb', 'boc', 'rate hike', 'rate cut', 'inflation', 'cpi', 'nfp'];
const ENERGY_KEYWORDS = ['oil', 'gas', 'brent', 'wti', 'hormuz', 'energy'];
const GEOPOLITICAL_KEYWORDS = ['war', 'missile', 'strike', 'conflict', 'attack', 'sanction', 'geopolitical'];
const GROWTH_KEYWORDS = ['gdp', 'manufacturing', 'pmi', 'unemployment', 'jobs', 'retail sales', 'consumer'];
const TRADE_KEYWORDS = ['tariff', 'export', 'import', 'shipping', 'trade'];

const HIGH_IMPACT_KEYWORDS = [
  ...POLICY_KEYWORDS,
  ...ENERGY_KEYWORDS,
  ...GEOPOLITICAL_KEYWORDS,
  ...TRADE_KEYWORDS,
];
const MEDIUM_IMPACT_KEYWORDS = [...GROWTH_KEYWORDS, 'forecast', 'outlook', 'markets', 'volatility'];

const FX_PAIR_DEFINITIONS = [
  { pair: 'EUR/USD', base: 'EUR', quote: 'USD', symbol: 'EUR', inverse: true },
  { pair: 'GBP/USD', base: 'GBP', quote: 'USD', symbol: 'GBP', inverse: true },
  { pair: 'USD/JPY', base: 'USD', quote: 'JPY', symbol: 'JPY', inverse: false },
  { pair: 'USD/CHF', base: 'USD', quote: 'CHF', symbol: 'CHF', inverse: false },
  { pair: 'AUD/USD', base: 'AUD', quote: 'USD', symbol: 'AUD', inverse: true },
  { pair: 'USD/CAD', base: 'USD', quote: 'CAD', symbol: 'CAD', inverse: false },
  { pair: 'NZD/USD', base: 'NZD', quote: 'USD', symbol: 'NZD', inverse: true },
];

const RUNTIME_TIMEOUT_MS = 12000;

const buildAllOriginsUrl = (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

const shiftDateByDays = (isoDate: string, deltaDays: number): string => {
  const parsed = new Date(`${isoDate}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + deltaDays);
  return parsed.toISOString().slice(0, 10);
};

const normalizeWhitespace = (text: string): string => text.replace(/\s+/g, ' ').trim();

const stripHtml = (text: string): string => normalizeWhitespace(text.replace(/<[^>]*>/g, ' '));

const withTimeout = async <T>(work: (signal: AbortSignal) => Promise<T>, timeoutMs = RUNTIME_TIMEOUT_MS): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await work(controller.signal);
  } finally {
    clearTimeout(timeoutId);
  }
};

const fetchJson = async <T>(url: string, timeoutMs?: number): Promise<T> => {
  return withTimeout(async (signal) => {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`Request failed (${response.status}) for ${url}`);
    }

    return (await response.json()) as T;
  }, timeoutMs);
};

const fetchText = async (url: string, timeoutMs?: number): Promise<string> => {
  return withTimeout(async (signal) => {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`Request failed (${response.status}) for ${url}`);
    }

    return response.text();
  }, timeoutMs);
};

const fetchFirstSuccessfulText = async (urls: string[]): Promise<string> => {
  let lastError: unknown = null;

  for (const url of urls) {
    try {
      return await fetchText(url);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('No successful response from any endpoint');
};

const classifyImpact = (input: string): ImpactLevel => {
  const normalized = input.toLowerCase();
  if (HIGH_IMPACT_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return 'High';
  }

  if (MEDIUM_IMPACT_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return 'Medium';
  }

  return 'Low';
};

const classifyTheme = (input: string): ForexNewsItem['theme'] => {
  const normalized = input.toLowerCase();
  if (POLICY_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return 'Policy';
  }

  if (ENERGY_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return 'Energy';
  }

  if (GEOPOLITICAL_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return 'Geopolitics';
  }

  if (TRADE_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return 'Trade';
  }

  if (GROWTH_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return 'Growth';
  }

  return 'Risk sentiment';
};

const parseImpactValue = (value: string): ForexEconomicEvent['impact'] => {
  if (value === 'Holiday') {
    return 'Holiday';
  }

  if (value === 'High' || value === 'Medium' || value === 'Low') {
    return value;
  }

  return 'Low';
};

const parseRssFeed = (xmlText: string, category: NewsCategory): ForexNewsItem[] => {
  if (typeof DOMParser === 'undefined') {
    return [];
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

  if (xmlDoc.querySelector('parsererror')) {
    return [];
  }

  const sourceTitle = normalizeWhitespace(xmlDoc.querySelector('channel > title')?.textContent ?? 'Unknown source');
  const itemNodes = Array.from(xmlDoc.querySelectorAll('item'));

  return itemNodes.map((node) => {
    const title = normalizeWhitespace(node.querySelector('title')?.textContent ?? 'Untitled');
    const summary = stripHtml(node.querySelector('description')?.textContent ?? '');
    const link = normalizeWhitespace(node.querySelector('link')?.textContent ?? '#');
    const guid = normalizeWhitespace(node.querySelector('guid')?.textContent ?? '');
    const publishedAtRaw = normalizeWhitespace(node.querySelector('pubDate')?.textContent ?? '');
    const parsedDate = Date.parse(publishedAtRaw);
    const publishedAt = Number.isNaN(parsedDate) ? new Date().toISOString() : new Date(parsedDate).toISOString();
    const combinedText = `${title} ${summary}`;

    return {
      id: guid || link || `${sourceTitle}-${title}`,
      title,
      summary,
      link,
      source: sourceTitle,
      publishedAt,
      impact: classifyImpact(combinedText),
      category,
      theme: classifyTheme(combinedText),
    } satisfies ForexNewsItem;
  });
};

const dedupeNews = (items: ForexNewsItem[]): ForexNewsItem[] => {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.link}|${item.title}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const buildPairRate = (rateFromUsd: number, inverse: boolean): number => {
  if (!Number.isFinite(rateFromUsd) || rateFromUsd <= 0) {
    return 0;
  }

  return inverse ? 1 / rateFromUsd : rateFromUsd;
};

const createFxSnapshot = (
  latest: FrankfurterRatesResponse,
  previous: FrankfurterRatesResponse,
): FxPairSnapshot[] => {
  const timestamp = new Date().toISOString();

  return FX_PAIR_DEFINITIONS.map((definition) => {
    const latestRate = buildPairRate(latest.rates[definition.symbol], definition.inverse);
    const previousRate = buildPairRate(previous.rates[definition.symbol], definition.inverse);
    const changePct = previousRate === 0 ? 0 : ((latestRate - previousRate) / previousRate) * 100;

    let direction: FxPairSnapshot['direction'] = 'flat';
    if (changePct > 0.0001) {
      direction = 'up';
    } else if (changePct < -0.0001) {
      direction = 'down';
    }

    return {
      pair: definition.pair,
      base: definition.base,
      quote: definition.quote,
      rate: latestRate,
      previousRate,
      changePct,
      direction,
      timestamp,
    };
  }).filter((item) => Number.isFinite(item.rate) && item.rate > 0);
};

const toRssRequestUrls = (feedUrl: string): string[] => [buildAllOriginsUrl(feedUrl), feedUrl];

const fetchNewsFromFeeds = async (feeds: string[], category: NewsCategory, limit: number): Promise<ForexNewsItem[]> => {
  const settled = await Promise.allSettled(
    feeds.map(async (feedUrl) => {
      const xml = await fetchFirstSuccessfulText(toRssRequestUrls(feedUrl));
      return parseRssFeed(xml, category);
    }),
  );

  const parsedItems = settled
    .filter((result): result is PromiseFulfilledResult<ForexNewsItem[]> => result.status === 'fulfilled')
    .flatMap((result) => result.value);

  if (parsedItems.length === 0) {
    throw new Error(`Unable to fetch ${category} news`);
  }

  return dedupeNews(parsedItems)
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, limit);
};

export const ForexService = {
  async getFxSnapshot(): Promise<FxPairSnapshot[]> {
    const symbols = FX_SYMBOLS.join(',');
    const latest = await fetchJson<FrankfurterRatesResponse>(`${FX_BASE_URL}/latest?from=USD&to=${symbols}`);
    const previousDate = shiftDateByDays(latest.date, -1);
    const previous = await fetchJson<FrankfurterRatesResponse>(`${FX_BASE_URL}/${previousDate}?from=USD&to=${symbols}`);

    return createFxSnapshot(latest, previous);
  },

  async getEconomicCalendar(): Promise<ForexEconomicEvent[]> {
    const supportedCurrencies = new Set(['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD']);
    const rows = await fetchJson<FairEconomyCalendarItem[]>(CALENDAR_URL);

    return rows
      .filter((row) => supportedCurrencies.has(row.country))
      .map((row) => ({
        id: `${row.country}-${row.title}-${row.date}`,
        title: normalizeWhitespace(row.title),
        currency: row.country,
        date: new Date(row.date).toISOString(),
        impact: parseImpactValue(row.impact),
        forecast: normalizeWhitespace(row.forecast || '-'),
        previous: normalizeWhitespace(row.previous || '-'),
      }))
      .filter((event) => Number.isFinite(Date.parse(event.date)))
      .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  },

  async getFinancialNews(limit = 10): Promise<ForexNewsItem[]> {
    return fetchNewsFromFeeds(FINANCIAL_RSS_FEEDS, 'financial', limit);
  },

  async getGeopoliticalNews(limit = 10): Promise<ForexNewsItem[]> {
    return fetchNewsFromFeeds(GEOPOLITICAL_RSS_FEEDS, 'geopolitical', limit);
  },
};

export default ForexService;
