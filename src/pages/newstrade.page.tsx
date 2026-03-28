import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { cn } from '~/lib/utils';
import { ForexService, type ForexEconomicEvent } from '~/services/forex.service';
import '~/style/newstrade.css';

type DeskFilterKey = 'all' | 'geopolitical' | 'macro' | 'markets' | 'energy';
type CardSpan = 'normal' | 'wide' | 'tall';
type TagTone = 'alert' | 'conflict' | 'macro' | 'policy' | 'energy' | 'fresh';
type CalendarProvider = 'investing' | 'forexfactory';
type CalendarTabKey = 'upcoming' | 'live' | 'past';
type CalendarImpact = 'high' | 'medium' | 'low' | 'holiday';

type NewsTag = {
  label: string;
  tone: TagTone;
};

type FeedItem = {
  source: string;
  headline: string;
  age: string;
  tags: NewsTag[];
};

type MonitorCard = {
  id: string;
  title: string;
  deck: string;
  status: string;
  desks: Exclude<DeskFilterKey, 'all'>[];
  span?: CardSpan;
  items: FeedItem[];
};

type CalendarEventSeed = {
  id: string;
  offsetMinutes: number;
  currency: string;
  country: string;
  event: string;
  impact: CalendarImpact;
  actual: string;
  forecast: string;
  previous: string;
  source: string;
  sourceUrl: string;
};

type CalendarEvent = Omit<CalendarEventSeed, 'offsetMinutes'> & {
  timeUtc: string;
  status: CalendarTabKey;
};

const FILTERS: Array<{ key: DeskFilterKey; label: string }> = [
  { key: 'all', label: 'Global' },
  { key: 'geopolitical', label: 'Geopolitics' },
  { key: 'macro', label: 'Macro' },
  { key: 'markets', label: 'Markets' },
  { key: 'energy', label: 'Energy' },
];

const TAG_TONE_CLASS_MAP: Record<TagTone, string> = {
  alert: 'is-alert',
  conflict: 'is-conflict',
  macro: 'is-macro',
  policy: 'is-policy',
  energy: 'is-energy',
  fresh: 'is-fresh',
};

const CALENDAR_TAB_LABELS: Record<CalendarTabKey, string> = {
  upcoming: 'Upcoming',
  live: 'Live',
  past: 'Past',
};

const CALENDAR_TAB_ORDER: CalendarTabKey[] = ['past', 'live', 'upcoming'];

const CALENDAR_PROVIDER_LABELS: Record<CalendarProvider, string> = {
  investing: 'Investing',
  forexfactory: 'ForexFactory',
};

const CALENDAR_PROVIDER_ORDER: CalendarProvider[] = ['investing', 'forexfactory'];

const CALENDAR_IMPACT_CLASS_MAP: Record<CalendarImpact, string> = {
  high: 'is-high',
  medium: 'is-medium',
  low: 'is-low',
  holiday: 'is-holiday',
};

const CALENDAR_IMPACT_LABELS: Record<CalendarImpact, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  holiday: 'Holiday',
};

const SOURCE_URL_MAP: Record<string, string> = {
  Reuters: 'https://www.reuters.com/world/',
  Bloomberg: 'https://www.bloomberg.com/markets',
  'Financial Times': 'https://www.ft.com/world',
  'Military Times': 'https://www.militarytimes.com/',
  AP: 'https://apnews.com/hub/world-news',
  'Al Jazeera': 'https://www.aljazeera.com/news/',
  CNBC: 'https://www.cnbc.com/world/',
  WSJ: 'https://www.wsj.com/world',
  Nikkei: 'https://asia.nikkei.com/',
  'EU Council': 'https://www.consilium.europa.eu/en/press/press-releases/',
  'US Treasury': 'https://home.treasury.gov/news/press-releases',
  'Middle East': 'https://www.reuters.com/world/middle-east/',
  'Eastern Europe': 'https://www.reuters.com/world/europe/',
  'East Asia': 'https://www.reuters.com/world/asia-pacific/',
  US: 'https://www.reuters.com/world/us/',
  Eurozone: 'https://www.ecb.europa.eu/press/',
  Japan: 'https://www.reuters.com/world/asia-pacific/',
  WTI: 'https://www.cmegroup.com/markets/energy/crude-oil/light-sweet-crude.html',
  XAUUSD: 'https://www.lbma.org.uk/prices-and-data/precious-metal-prices',
  'TTF Gas': 'https://www.theice.com/products/27996665/Dutch-TTF-Gas-Futures',
  Brazil: 'https://www.bcb.gov.br/en/pressdetail',
  Mexico: 'https://www.banxico.org.mx/publications-and-press/',
  Germany: 'https://www.bundesbank.de/en/press',
  UK: 'https://www.ofgem.gov.uk/energy-data-and-research',
  France: 'https://www.gouvernement.fr/en/news',
  UAE: 'https://www.wam.ae/en',
  Saudi: 'https://www.spa.gov.sa/en',
  Qatar: 'https://www.gco.gov.qa/en/media-centre/',
  China: 'https://english.www.gov.cn/news/',
  Australia: 'https://www.pm.gov.au/media',
  'US Debate': 'https://www.debates.org/',
  'EU Parliament': 'https://www.europarl.europa.eu/news/en',
  'Asia Local Polls': 'https://www.idea.int/news-media',
  Rates: 'https://www.cmegroup.com/markets/interest-rates.html',
  Equities: 'https://www.bloomberg.com/markets/stocks',
  'FX/Oil': 'https://www.investing.com/news/commodities-news',
};

function resolveSourceUrl(source: string): string {
  const mapped = SOURCE_URL_MAP[source];
  if (mapped) {
    return mapped;
  }

  return `https://news.google.com/search?q=${encodeURIComponent(`${source} world economy politics`)}`;
}

const MONITOR_CARDS: MonitorCard[] = [
  {
    id: 'global-flashwire',
    title: 'Global Flashwire',
    deck: 'Cross-source desk',
    status: 'Live',
    desks: ['geopolitical', 'macro', 'markets'],
    span: 'wide',
    items: [
      {
        source: 'Reuters',
        headline: 'G7 ministers coordinate language on maritime security and secondary sanctions.',
        age: '11m ago',
        tags: [
          { label: 'Alert', tone: 'alert' },
          { label: 'Policy', tone: 'policy' },
        ],
      },
      {
        source: 'Bloomberg',
        headline: 'Bond desks reprice a slower cut path after stronger than expected US services data.',
        age: '19m ago',
        tags: [
          { label: 'Macro', tone: 'macro' },
          { label: 'Fresh', tone: 'fresh' },
        ],
      },
      {
        source: 'Financial Times',
        headline: 'European leaders seek emergency gas storage pact ahead of winter procurement window.',
        age: '34m ago',
        tags: [
          { label: 'Energy', tone: 'energy' },
          { label: 'Policy', tone: 'policy' },
        ],
      },
    ],
  },
  {
    id: 'theater-risk-board',
    title: 'Active Theater Risk',
    deck: 'Country monitor',
    status: 'Updated',
    desks: ['geopolitical', 'markets'],
    items: [
      {
        source: 'Middle East',
        headline: 'Shipping insurance premiums jump as escort corridors are re-evaluated.',
        age: '22m ago',
        tags: [{ label: 'Conflict', tone: 'conflict' }],
      },
      {
        source: 'Eastern Europe',
        headline: 'Cross-border power grid strikes raise outage risk into next settlement session.',
        age: '48m ago',
        tags: [{ label: 'Alert', tone: 'alert' }],
      },
      {
        source: 'East Asia',
        headline: 'Defense ministry comments cool immediate tension but patrol tempo stays elevated.',
        age: '1h ago',
        tags: [{ label: 'Policy', tone: 'policy' }],
      },
    ],
  },
  {
    id: 'macro-calendar',
    title: 'Macro Calendar Pulse',
    deck: 'Economic releases',
    status: '6 events',
    desks: ['macro', 'markets'],
    items: [
      {
        source: 'US',
        headline: 'Core PCE preview indicates sticky services inflation into quarter-end.',
        age: 'in 2h',
        tags: [{ label: 'Macro', tone: 'macro' }],
      },
      {
        source: 'Eurozone',
        headline: 'ECB speakers expected to guide on balance-sheet runoff speed.',
        age: 'in 4h',
        tags: [{ label: 'Policy', tone: 'policy' }],
      },
      {
        source: 'Japan',
        headline: 'BoJ operations watch as JGB volatility presses local banks.',
        age: 'in 7h',
        tags: [{ label: 'Alert', tone: 'alert' }],
      },
    ],
  },
  {
    id: 'conflict-tracker',
    title: 'Conflict Escalation Tracker',
    deck: 'Operational map',
    status: 'Critical',
    desks: ['geopolitical', 'energy'],
    span: 'tall',
    items: [
      {
        source: 'Military Times',
        headline: 'Drone interception activity climbs around strategic refinery corridor.',
        age: '14m ago',
        tags: [
          { label: 'Conflict', tone: 'conflict' },
          { label: 'Alert', tone: 'alert' },
        ],
      },
      {
        source: 'AP',
        headline: 'Emergency summit convened after aid convoys were paused at border crossing.',
        age: '27m ago',
        tags: [{ label: 'Policy', tone: 'policy' }],
      },
      {
        source: 'Al Jazeera',
        headline: 'Regional airspace advisories extended through the weekend.',
        age: '45m ago',
        tags: [
          { label: 'Conflict', tone: 'conflict' },
          { label: 'Fresh', tone: 'fresh' },
        ],
      },
      {
        source: 'CNBC',
        headline: 'Freight operators reroute tankers, adding lead-time pressure to Europe supply chain.',
        age: '1h ago',
        tags: [{ label: 'Energy', tone: 'energy' }],
      },
      {
        source: 'WSJ',
        headline: 'Defense procurement talks accelerate as inventories near red-line thresholds.',
        age: '1h 22m ago',
        tags: [{ label: 'Alert', tone: 'alert' }],
      },
    ],
  },
  {
    id: 'commodities',
    title: 'Commodities Stress Board',
    deck: 'Oil / Gold / Gas',
    status: 'Live',
    desks: ['energy', 'markets'],
    items: [
      {
        source: 'WTI',
        headline: 'Prompt-month spread widens as tanker routing costs stay elevated.',
        age: '9m ago',
        tags: [{ label: 'Energy', tone: 'energy' }],
      },
      {
        source: 'XAUUSD',
        headline: 'Safe-haven bids hold despite stronger dollar intraday rebound.',
        age: '25m ago',
        tags: [{ label: 'Markets', tone: 'macro' }],
      },
      {
        source: 'TTF Gas',
        headline: 'Storage bids increase before maintenance cycle in northern terminals.',
        age: '56m ago',
        tags: [{ label: 'Alert', tone: 'alert' }],
      },
    ],
  },
  {
    id: 'diplomacy',
    title: 'Diplomacy & Sanctions',
    deck: 'Policy channel',
    status: 'Active',
    desks: ['geopolitical', 'macro'],
    items: [
      {
        source: 'EU Council',
        headline: 'Draft sanctions package expands to dual-use logistics technology.',
        age: '32m ago',
        tags: [{ label: 'Policy', tone: 'policy' }],
      },
      {
        source: 'US Treasury',
        headline: 'Licensing carve-outs reviewed for food and medical payment corridors.',
        age: '50m ago',
        tags: [{ label: 'Macro', tone: 'macro' }],
      },
      {
        source: 'Nikkei',
        headline: 'Export control talks signal tighter compliance checks on shipping manifests.',
        age: '1h 9m ago',
        tags: [
          { label: 'Alert', tone: 'alert' },
          { label: 'Policy', tone: 'policy' },
        ],
      },
    ],
  },
  {
    id: 'americas',
    title: 'Americas Desk',
    deck: 'Regional stream',
    status: '3 new',
    desks: ['macro', 'markets'],
    items: [
      {
        source: 'US',
        headline: 'Fiscal package negotiations reopen with infrastructure and defense offsets.',
        age: '36m ago',
        tags: [{ label: 'Policy', tone: 'policy' }],
      },
      {
        source: 'Brazil',
        headline: 'Central bank minutes reinforce cautious easing trajectory.',
        age: '58m ago',
        tags: [{ label: 'Macro', tone: 'macro' }],
      },
      {
        source: 'Mexico',
        headline: 'Auto export corridor faces temporary customs audit bottleneck.',
        age: '1h 6m ago',
        tags: [{ label: 'Alert', tone: 'alert' }],
      },
    ],
  },
  {
    id: 'europe',
    title: 'Europe Desk',
    deck: 'Regional stream',
    status: 'Live',
    desks: ['geopolitical', 'macro'],
    items: [
      {
        source: 'Germany',
        headline: 'Industrial confidence misses estimate for a second month.',
        age: '17m ago',
        tags: [{ label: 'Macro', tone: 'macro' }],
      },
      {
        source: 'UK',
        headline: 'Energy regulator proposes emergency balancing mechanism.',
        age: '43m ago',
        tags: [{ label: 'Energy', tone: 'energy' }],
      },
      {
        source: 'France',
        headline: 'Parliamentary coalition talks enter final session ahead of confidence vote.',
        age: '1h 14m ago',
        tags: [{ label: 'Conflict', tone: 'conflict' }],
      },
    ],
  },
  {
    id: 'middle-east',
    title: 'Middle East Desk',
    deck: 'Regional stream',
    status: '5 new',
    desks: ['geopolitical', 'energy'],
    items: [
      {
        source: 'UAE',
        headline: 'Port authority issues revised traffic schedule to prioritize fuel tankers.',
        age: '21m ago',
        tags: [
          { label: 'Energy', tone: 'energy' },
          { label: 'Fresh', tone: 'fresh' },
        ],
      },
      {
        source: 'Saudi',
        headline: 'Joint statement calls for de-escalation but keeps security posture elevated.',
        age: '46m ago',
        tags: [{ label: 'Policy', tone: 'policy' }],
      },
      {
        source: 'Qatar',
        headline: 'Mediation channel remains open as backdoor talks continue.',
        age: '1h 10m ago',
        tags: [{ label: 'Conflict', tone: 'conflict' }],
      },
    ],
  },
  {
    id: 'asia-pacific',
    title: 'Asia-Pacific Desk',
    deck: 'Regional stream',
    status: 'Live',
    desks: ['geopolitical', 'markets', 'macro'],
    items: [
      {
        source: 'Japan',
        headline: 'Yen intervention chatter increases as volatility spikes near option barrier.',
        age: '13m ago',
        tags: [{ label: 'Alert', tone: 'alert' }],
      },
      {
        source: 'China',
        headline: 'Property support measures target refinancing windows for local developers.',
        age: '39m ago',
        tags: [{ label: 'Macro', tone: 'macro' }],
      },
      {
        source: 'Australia',
        headline: 'Parliament debate on critical minerals policy keeps exporters in focus.',
        age: '1h 2m ago',
        tags: [{ label: 'Policy', tone: 'policy' }],
      },
    ],
  },
  {
    id: 'election-watch',
    title: 'Election & Leadership Watch',
    deck: 'Political cycle',
    status: 'Schedule',
    desks: ['geopolitical', 'markets'],
    span: 'wide',
    items: [
      {
        source: 'US Debate',
        headline: 'Market desks prepare scenario books for fiscal and tariff divergence.',
        age: 'in 1d',
        tags: [{ label: 'Policy', tone: 'policy' }],
      },
      {
        source: 'EU Parliament',
        headline: 'Leadership vote expected to influence green industry subsidy framework.',
        age: 'in 2d',
        tags: [{ label: 'Macro', tone: 'macro' }],
      },
      {
        source: 'Asia Local Polls',
        headline: 'Coalition uncertainty keeps defense and utility names at risk premium.',
        age: 'in 3d',
        tags: [{ label: 'Alert', tone: 'alert' }],
      },
    ],
  },
  {
    id: 'market-implications',
    title: 'AI Market Implications',
    deck: 'Signal synthesis',
    status: 'Watch',
    desks: ['markets', 'macro', 'energy'],
    items: [
      {
        source: 'Rates',
        headline: 'Two-way risk remains high as growth and inflation narratives diverge.',
        age: '8m ago',
        tags: [{ label: 'Macro', tone: 'macro' }],
      },
      {
        source: 'Equities',
        headline: 'Defensive rotation extends while cyclicals lag in high-volatility sessions.',
        age: '28m ago',
        tags: [{ label: 'Fresh', tone: 'fresh' }],
      },
      {
        source: 'FX/Oil',
        headline: 'Dollar strength and oil bid create asymmetric pressure across import-heavy markets.',
        age: '42m ago',
        tags: [
          { label: 'Energy', tone: 'energy' },
          { label: 'Alert', tone: 'alert' },
        ],
      },
    ],
  },
];

const CALENDAR_EVENT_SEEDS: CalendarEventSeed[] = [
  {
    id: 'us-cpi',
    offsetMinutes: -390,
    currency: 'USD',
    country: 'US',
    event: 'Core CPI (MoM)',
    impact: 'high',
    actual: '0.4%',
    forecast: '0.3%',
    previous: '0.3%',
    source: 'BLS',
    sourceUrl: 'https://www.bls.gov/news.release/cpi.htm',
  },
  {
    id: 'eu-industrial-production',
    offsetMinutes: -360,
    currency: 'EUR',
    country: 'EU',
    event: 'Industrial Production (MoM)',
    impact: 'medium',
    actual: '-0.2%',
    forecast: '0.1%',
    previous: '0.5%',
    source: 'Eurostat',
    sourceUrl: 'https://ec.europa.eu/eurostat/web/main/news/euro-indicators',
  },
  {
    id: 'uk-gdp-estimate',
    offsetMinutes: -332,
    currency: 'GBP',
    country: 'UK',
    event: 'GDP Preliminary (QoQ)',
    impact: 'high',
    actual: '0.1%',
    forecast: '0.2%',
    previous: '0.3%',
    source: 'ONS',
    sourceUrl: 'https://www.ons.gov.uk/economy/grossdomesticproductgdp',
  },
  {
    id: 'china-caixin-services-pmi',
    offsetMinutes: -300,
    currency: 'CNY',
    country: 'CN',
    event: 'Caixin Services PMI',
    impact: 'medium',
    actual: '52.4',
    forecast: '52.1',
    previous: '51.8',
    source: 'Caixin',
    sourceUrl: 'https://www.markiteconomics.com/Public/Home/PressRelease',
  },
  {
    id: 'germany-zew-sentiment',
    offsetMinutes: -265,
    currency: 'EUR',
    country: 'DE',
    event: 'ZEW Economic Sentiment',
    impact: 'medium',
    actual: '31.0',
    forecast: '29.6',
    previous: '27.8',
    source: 'ZEW',
    sourceUrl: 'https://www.zew.de/en/press',
  },
  {
    id: 'canada-retail-sales',
    offsetMinutes: -240,
    currency: 'CAD',
    country: 'CA',
    event: 'Retail Sales (MoM)',
    impact: 'medium',
    actual: '',
    forecast: '0.2%',
    previous: '-0.1%',
    source: 'Statistics Canada',
    sourceUrl: 'https://www150.statcan.gc.ca/n1/dai-quo/index-eng.htm',
  },
  {
    id: 'us-ism-services-pmi',
    offsetMinutes: -210,
    currency: 'USD',
    country: 'US',
    event: 'ISM Services PMI',
    impact: 'high',
    actual: '53.0',
    forecast: '52.4',
    previous: '52.7',
    source: 'ISM',
    sourceUrl: 'https://www.ismworld.org/supply-management-news-and-reports/reports/ism-report-on-business/',
  },
  {
    id: 'us-crude-inventories',
    offsetMinutes: -188,
    currency: 'USD',
    country: 'US',
    event: 'EIA Crude Oil Inventories',
    impact: 'high',
    actual: '',
    forecast: '1.6M',
    previous: '2.4M',
    source: 'EIA',
    sourceUrl: 'https://www.eia.gov/petroleum/supply/weekly/',
  },
  {
    id: 'nzd-gdt-price-index',
    offsetMinutes: -170,
    currency: 'NZD',
    country: 'NZ',
    event: 'GDT Price Index',
    impact: 'medium',
    actual: '-0.8%',
    forecast: '-0.1%',
    previous: '1.2%',
    source: 'GDT',
    sourceUrl: 'https://www.globaldairytrade.info/en/product-results/',
  },
  {
    id: 'japan-household-spending',
    offsetMinutes: -148,
    currency: 'JPY',
    country: 'JP',
    event: 'Household Spending (YoY)',
    impact: 'medium',
    actual: '1.7%',
    forecast: '1.1%',
    previous: '0.9%',
    source: 'Statistics Bureau Japan',
    sourceUrl: 'https://www.stat.go.jp/english/data/kakei/index.html',
  },
  {
    id: 'us-existing-home-sales',
    offsetMinutes: -120,
    currency: 'USD',
    country: 'US',
    event: 'Existing Home Sales',
    impact: 'medium',
    actual: '4.02M',
    forecast: '3.96M',
    previous: '3.95M',
    source: 'NAR',
    sourceUrl: 'https://www.nar.realtor/research-and-statistics',
  },
  {
    id: 'eurozone-trade-balance',
    offsetMinutes: -110,
    currency: 'EUR',
    country: 'EU',
    event: 'Trade Balance',
    impact: 'low',
    actual: '17.8B',
    forecast: '16.3B',
    previous: '15.1B',
    source: 'Eurostat',
    sourceUrl: 'https://ec.europa.eu/eurostat/web/main/news/euro-indicators',
  },
  {
    id: 'sweden-cpi',
    offsetMinutes: -95,
    currency: 'SEK',
    country: 'SE',
    event: 'CPI (MoM)',
    impact: 'low',
    actual: '0.2%',
    forecast: '0.1%',
    previous: '0.0%',
    source: 'Statistics Sweden',
    sourceUrl: 'https://www.scb.se/en/finding-statistics/statistics-by-subject-area/prices-and-consumption/',
  },
  {
    id: 'india-wpi-inflation',
    offsetMinutes: -82,
    currency: 'INR',
    country: 'IN',
    event: 'WPI Inflation (YoY)',
    impact: 'medium',
    actual: '2.6%',
    forecast: '2.4%',
    previous: '2.3%',
    source: 'MOSPI',
    sourceUrl: 'https://mospi.gov.in/',
  },
  {
    id: 'norway-gdp-mainland',
    offsetMinutes: -70,
    currency: 'NOK',
    country: 'NO',
    event: 'Mainland GDP (MoM)',
    impact: 'low',
    actual: '0.2%',
    forecast: '0.1%',
    previous: '-0.1%',
    source: 'Statistics Norway',
    sourceUrl: 'https://www.ssb.no/en/nasjonalregnskap-og-konjunkturer',
  },
  {
    id: 'us-api-crude-stocks',
    offsetMinutes: -63,
    currency: 'USD',
    country: 'US',
    event: 'API Weekly Crude Stock',
    impact: 'medium',
    actual: '2.1M',
    forecast: '1.5M',
    previous: '0.9M',
    source: 'API',
    sourceUrl: 'https://www.api.org/products-and-services/statistics',
  },
  {
    id: 'korea-export-price-index',
    offsetMinutes: -50,
    currency: 'KRW',
    country: 'KR',
    event: 'Export Price Index (MoM)',
    impact: 'low',
    actual: '0.4%',
    forecast: '0.3%',
    previous: '0.2%',
    source: 'Bank of Korea',
    sourceUrl: 'https://www.bok.or.kr/eng/bbs/E0000634/list.do?menuNo=400069',
  },
  {
    id: 'japan-boj-speech',
    offsetMinutes: -18,
    currency: 'JPY',
    country: 'JP',
    event: 'BoJ Governor Speech',
    impact: 'high',
    actual: '',
    forecast: '',
    previous: '',
    source: 'Bank of Japan',
    sourceUrl: 'https://www.boj.or.jp/en/announcements/release_2026/index.htm/',
  },
  {
    id: 'uk-boe-member-speech',
    offsetMinutes: -11,
    currency: 'GBP',
    country: 'UK',
    event: 'BoE MPC Member Speech',
    impact: 'medium',
    actual: '',
    forecast: '',
    previous: '',
    source: 'Bank of England',
    sourceUrl: 'https://www.bankofengland.co.uk/news',
  },
  {
    id: 'us-10y-note-auction',
    offsetMinutes: -4,
    currency: 'USD',
    country: 'US',
    event: '10-Year Note Auction',
    impact: 'medium',
    actual: '',
    forecast: '4.06%',
    previous: '4.02%',
    source: 'US Treasury',
    sourceUrl: 'https://home.treasury.gov/resource-center/data-chart-center/quarterly-refunding/auction-schedules',
  },
  {
    id: 'australia-employment',
    offsetMinutes: 14,
    currency: 'AUD',
    country: 'AU',
    event: 'Employment Change',
    impact: 'high',
    actual: '',
    forecast: '18.0K',
    previous: '21.2K',
    source: 'ABS',
    sourceUrl: 'https://www.abs.gov.au/statistics/labour/employment-and-unemployment',
  },
  {
    id: 'swiss-ppi',
    offsetMinutes: 22,
    currency: 'CHF',
    country: 'CH',
    event: 'Producer Price Index (MoM)',
    impact: 'low',
    actual: '',
    forecast: '0.1%',
    previous: '0.2%',
    source: 'FSO',
    sourceUrl: 'https://www.bfs.admin.ch/bfs/en/home/statistics/prices.html',
  },
  {
    id: 'eurozone-cpi-final',
    offsetMinutes: 35,
    currency: 'EUR',
    country: 'EU',
    event: 'CPI Final (YoY)',
    impact: 'high',
    actual: '',
    forecast: '2.5%',
    previous: '2.6%',
    source: 'Eurostat',
    sourceUrl: 'https://ec.europa.eu/eurostat/web/main/news/euro-indicators',
  },
  {
    id: 'us-initial-claims',
    offsetMinutes: 48,
    currency: 'USD',
    country: 'US',
    event: 'Initial Jobless Claims',
    impact: 'medium',
    actual: '',
    forecast: '224K',
    previous: '228K',
    source: 'DOL',
    sourceUrl: 'https://www.dol.gov/ui/data.pdf',
  },
  {
    id: 'us-continuing-claims',
    offsetMinutes: 61,
    currency: 'USD',
    country: 'US',
    event: 'Continuing Jobless Claims',
    impact: 'medium',
    actual: '',
    forecast: '1.89M',
    previous: '1.91M',
    source: 'DOL',
    sourceUrl: 'https://www.dol.gov/ui/data.pdf',
  },
  {
    id: 'canada-cpi',
    offsetMinutes: 74,
    currency: 'CAD',
    country: 'CA',
    event: 'CPI (MoM)',
    impact: 'high',
    actual: '',
    forecast: '0.2%',
    previous: '0.1%',
    source: 'Statistics Canada',
    sourceUrl: 'https://www150.statcan.gc.ca/n1/daily-quotidien/index-eng.htm',
  },
  {
    id: 'rba-minutes',
    offsetMinutes: 88,
    currency: 'AUD',
    country: 'AU',
    event: 'RBA Meeting Minutes',
    impact: 'high',
    actual: '',
    forecast: '',
    previous: '',
    source: 'RBA',
    sourceUrl: 'https://www.rba.gov.au/monetary-policy/rba-board-minutes/',
  },
  {
    id: 'new-zealand-rate-decision',
    offsetMinutes: 102,
    currency: 'NZD',
    country: 'NZ',
    event: 'RBNZ Interest Rate Decision',
    impact: 'high',
    actual: '',
    forecast: '5.50%',
    previous: '5.50%',
    source: 'RBNZ',
    sourceUrl: 'https://www.rbnz.govt.nz/news-and-events',
  },
  {
    id: 'japan-machine-orders',
    offsetMinutes: 116,
    currency: 'JPY',
    country: 'JP',
    event: 'Machine Orders (MoM)',
    impact: 'medium',
    actual: '',
    forecast: '1.2%',
    previous: '0.9%',
    source: 'Cabinet Office Japan',
    sourceUrl: 'https://www.esri.cao.go.jp/en/stat/juchu/juchu-e.html',
  },
  {
    id: 'us-philadelphia-fed-index',
    offsetMinutes: 130,
    currency: 'USD',
    country: 'US',
    event: 'Philadelphia Fed Manufacturing Index',
    impact: 'medium',
    actual: '',
    forecast: '6.2',
    previous: '5.8',
    source: 'Federal Reserve Bank of Philadelphia',
    sourceUrl: 'https://www.philadelphiafed.org/surveys-and-data/regional-economic-analysis',
  },
  {
    id: 'eu-consumer-confidence',
    offsetMinutes: 146,
    currency: 'EUR',
    country: 'EU',
    event: 'Consumer Confidence Flash',
    impact: 'medium',
    actual: '',
    forecast: '-14.8',
    previous: '-15.2',
    source: 'EU Commission',
    sourceUrl: 'https://economy-finance.ec.europa.eu/economic-forecast-and-surveys/business-and-consumer-surveys_en',
  },
  {
    id: 'mexico-retail-sales',
    offsetMinutes: 160,
    currency: 'MXN',
    country: 'MX',
    event: 'Retail Sales (YoY)',
    impact: 'medium',
    actual: '',
    forecast: '3.5%',
    previous: '3.8%',
    source: 'INEGI',
    sourceUrl: 'https://www.inegi.org.mx/temas/ventas/',
  },
  {
    id: 'swiss-trade-balance',
    offsetMinutes: 175,
    currency: 'CHF',
    country: 'CH',
    event: 'Trade Balance',
    impact: 'low',
    actual: '',
    forecast: '5.4B',
    previous: '5.1B',
    source: 'FCA',
    sourceUrl: 'https://www.bazg.admin.ch/bazg/en/home/information-companies/statistics.html',
  },
  {
    id: 'uk-retail-sales',
    offsetMinutes: 191,
    currency: 'GBP',
    country: 'UK',
    event: 'Retail Sales (MoM)',
    impact: 'high',
    actual: '',
    forecast: '0.3%',
    previous: '-0.4%',
    source: 'ONS',
    sourceUrl: 'https://www.ons.gov.uk/businessindustryandtrade/retailindustry',
  },
  {
    id: 'us-durable-goods',
    offsetMinutes: 210,
    currency: 'USD',
    country: 'US',
    event: 'Durable Goods Orders (MoM)',
    impact: 'high',
    actual: '',
    forecast: '0.8%',
    previous: '1.1%',
    source: 'US Census Bureau',
    sourceUrl: 'https://www.census.gov/manufacturing/m3/index.html',
  },
  {
    id: 'us-fed-minutes',
    offsetMinutes: 228,
    currency: 'USD',
    country: 'US',
    event: 'FOMC Meeting Minutes',
    impact: 'high',
    actual: '',
    forecast: '',
    previous: '',
    source: 'Federal Reserve',
    sourceUrl: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',
  },
  {
    id: 'china-loan-prime-rate',
    offsetMinutes: 246,
    currency: 'CNY',
    country: 'CN',
    event: '1Y Loan Prime Rate',
    impact: 'high',
    actual: '',
    forecast: '3.45%',
    previous: '3.45%',
    source: 'PBoC',
    sourceUrl: 'https://www.pbc.gov.cn/en/3688110/index.html',
  },
  {
    id: 'singapore-cpi',
    offsetMinutes: 264,
    currency: 'SGD',
    country: 'SG',
    event: 'CPI (YoY)',
    impact: 'low',
    actual: '',
    forecast: '2.7%',
    previous: '2.8%',
    source: 'SingStat',
    sourceUrl: 'https://www.singstat.gov.sg/find-data/search-by-theme/economy/prices-and-price-indices/latest-data',
  },
  {
    id: 'germany-ifo-business-climate',
    offsetMinutes: 284,
    currency: 'EUR',
    country: 'DE',
    event: 'Ifo Business Climate',
    impact: 'medium',
    actual: '',
    forecast: '89.6',
    previous: '89.2',
    source: 'Ifo Institute',
    sourceUrl: 'https://www.ifo.de/en/facts/2026-03-27/ifo-business-climate-germany-results-march-2026',
  },
  {
    id: 'us-gdp-final',
    offsetMinutes: 305,
    currency: 'USD',
    country: 'US',
    event: 'GDP Final (QoQ)',
    impact: 'high',
    actual: '',
    forecast: '2.2%',
    previous: '2.1%',
    source: 'BEA',
    sourceUrl: 'https://www.bea.gov/news/2026/gross-domestic-product-fourth-quarter-and-year-2025-third-estimate-corporate-profits',
  },
  {
    id: 'us-core-pce',
    offsetMinutes: 326,
    currency: 'USD',
    country: 'US',
    event: 'Core PCE Price Index (MoM)',
    impact: 'high',
    actual: '',
    forecast: '0.3%',
    previous: '0.3%',
    source: 'BEA',
    sourceUrl: 'https://www.bea.gov/data/personal-consumption-expenditures-price-index',
  },
  {
    id: 'japan-national-cpi',
    offsetMinutes: 346,
    currency: 'JPY',
    country: 'JP',
    event: 'National CPI (YoY)',
    impact: 'high',
    actual: '',
    forecast: '2.2%',
    previous: '2.4%',
    source: 'Statistics Bureau Japan',
    sourceUrl: 'https://www.stat.go.jp/english/data/cpi/index.html',
  },
  {
    id: 'opec-monthly-report',
    offsetMinutes: 369,
    currency: 'OIL',
    country: 'INTL',
    event: 'OPEC Monthly Oil Market Report',
    impact: 'high',
    actual: '',
    forecast: '',
    previous: '',
    source: 'OPEC',
    sourceUrl: 'https://www.opec.org/opec_web/en/publications/338.htm',
  },
  {
    id: 'eia-natural-gas-storage',
    offsetMinutes: 392,
    currency: 'USD',
    country: 'US',
    event: 'EIA Natural Gas Storage Change',
    impact: 'medium',
    actual: '',
    forecast: '64B',
    previous: '68B',
    source: 'EIA',
    sourceUrl: 'https://www.eia.gov/naturalgas/storagedashboard/',
  },
  {
    id: 'us-michigan-consumer-sentiment',
    offsetMinutes: 420,
    currency: 'USD',
    country: 'US',
    event: 'Michigan Consumer Sentiment Final',
    impact: 'medium',
    actual: '',
    forecast: '77.1',
    previous: '76.9',
    source: 'University of Michigan',
    sourceUrl: 'https://data.sca.isr.umich.edu/',
  },
  {
    id: 'eurozone-ppi',
    offsetMinutes: 450,
    currency: 'EUR',
    country: 'EU',
    event: 'PPI (MoM)',
    impact: 'low',
    actual: '',
    forecast: '0.2%',
    previous: '0.1%',
    source: 'Eurostat',
    sourceUrl: 'https://ec.europa.eu/eurostat/web/main/news/euro-indicators',
  },
  {
    id: 'fed-chair-speech',
    offsetMinutes: 478,
    currency: 'USD',
    country: 'US',
    event: 'Fed Chair Speech',
    impact: 'high',
    actual: '',
    forecast: '',
    previous: '',
    source: 'Federal Reserve',
    sourceUrl: 'https://www.federalreserve.gov/newsevents/speeches.htm',
  },
];

function formatCalendarTimeLabel(isoTime: string): string {
  return new Date(isoTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function deriveCalendarStatus(eventMs: number, nowMs: number): CalendarTabKey {
  const liveWindowMs = 30 * 60 * 1000;
  if (eventMs > nowMs) {
    return 'upcoming';
  }

  if (nowMs - eventMs <= liveWindowMs) {
    return 'live';
  }

  return 'past';
}

const FOREX_FACTORY_CALENDAR_URL = 'https://www.forexfactory.com/calendar';

function toCalendarImpact(impact: ForexEconomicEvent['impact']): CalendarImpact {
  if (impact === 'High') {
    return 'high';
  }

  if (impact === 'Medium') {
    return 'medium';
  }

  if (impact === 'Low') {
    return 'low';
  }

  return 'holiday';
}

function buildForexFactoryEventUrl(event: ForexEconomicEvent): string {
  const query = encodeURIComponent(`site:forexfactory.com ${event.currency} ${event.title}`);
  return `https://www.google.com/search?q=${query}`;
}

const NewstradePage = () => {
  const [activeFilter, setActiveFilter] = useState<DeskFilterKey>('all');
  const [activeCalendarProvider, setActiveCalendarProvider] = useState<CalendarProvider>('investing');
  const [activeCalendarTab, setActiveCalendarTab] = useState<CalendarTabKey>('past');
  const [query, setQuery] = useState('');
  const [calendarAnchor] = useState(() => new Date());
  const [calendarNowMs, setCalendarNowMs] = useState(() => Date.now());
  const [forexFactoryEvents, setForexFactoryEvents] = useState<ForexEconomicEvent[]>([]);
  const [forexFactoryStatus, setForexFactoryStatus] = useState<'loading' | 'live' | 'stale'>('loading');
  const [forexFactoryUpdatedAt, setForexFactoryUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCalendarNowMs(Date.now());
    }, 30000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const refreshForexFactory = async () => {
      try {
        const events = await ForexService.getEconomicCalendar();
        setForexFactoryEvents(events);
        setForexFactoryStatus('live');
        setForexFactoryUpdatedAt(new Date().toISOString());
      } catch {
        setForexFactoryStatus('stale');
      }
    };

    void refreshForexFactory();

    const refreshTimer = window.setInterval(() => {
      void refreshForexFactory();
    }, 15 * 60 * 1000);

    return () => {
      window.clearInterval(refreshTimer);
    };
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const investingCalendarEvents = useMemo<CalendarEvent[]>(() => {
    return CALENDAR_EVENT_SEEDS.map((event) => {
      const eventMs = calendarAnchor.getTime() + event.offsetMinutes * 60 * 1000;

      return {
        ...event,
        timeUtc: new Date(eventMs).toISOString(),
        status: deriveCalendarStatus(eventMs, calendarNowMs),
      };
    });
  }, [calendarAnchor, calendarNowMs]);

  const forexFactoryCalendarEvents = useMemo<CalendarEvent[]>(() => {
    return forexFactoryEvents.map((event) => {
      const eventMs = Date.parse(event.date);

      return {
        id: event.id,
        currency: event.currency,
        country: event.currency,
        event: event.title,
        impact: toCalendarImpact(event.impact),
        actual: '',
        forecast: event.forecast,
        previous: event.previous,
        source: 'ForexFactory',
        sourceUrl: buildForexFactoryEventUrl(event),
        timeUtc: event.date,
        status: deriveCalendarStatus(eventMs, calendarNowMs),
      };
    });
  }, [calendarNowMs, forexFactoryEvents]);

  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    return activeCalendarProvider === 'investing' ? investingCalendarEvents : forexFactoryCalendarEvents;
  }, [activeCalendarProvider, forexFactoryCalendarEvents, investingCalendarEvents]);

  const calendarFeedStatus = activeCalendarProvider === 'investing' ? 'live' : forexFactoryStatus;
  const calendarFeedUpdatedAt =
    activeCalendarProvider === 'investing' ? new Date(calendarNowMs).toISOString() : forexFactoryUpdatedAt;

  const calendarCounts = useMemo(() => {
    return {
      upcoming: calendarEvents.filter((event) => event.status === 'upcoming').length,
      live: calendarEvents.filter((event) => event.status === 'live').length,
      past: calendarEvents.filter((event) => event.status === 'past').length,
    };
  }, [calendarEvents]);

  const visibleCalendarEvents = useMemo(() => {
    const filtered = calendarEvents.filter((event) => event.status === activeCalendarTab);
    return filtered.sort((a, b) => {
      const aMs = new Date(a.timeUtc).getTime();
      const bMs = new Date(b.timeUtc).getTime();

      if (activeCalendarTab === 'past') {
        return bMs - aMs;
      }

      return aMs - bMs;
    });
  }, [calendarEvents, activeCalendarTab]);

  const visibleCards = useMemo(() => {
    return MONITOR_CARDS.filter((card) => {
      const byFilter = activeFilter === 'all' || card.desks.includes(activeFilter);
      if (!byFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const cardText = `${card.title} ${card.deck} ${card.items
        .map((item) => `${item.source} ${item.headline} ${item.tags.map((tag) => tag.label).join(' ')}`)
        .join(' ')}`.toLowerCase();

      return cardText.includes(normalizedQuery);
    });
  }, [activeFilter, normalizedQuery]);

  const feedStats = useMemo(() => {
    const itemCount = visibleCards.reduce((total, card) => total + card.items.length, 0);
    const alertCount = visibleCards.reduce(
      (total, card) =>
        total + card.items.reduce((inner, item) => inner + Number(item.tags.some((tag) => tag.tone === 'alert' || tag.tone === 'conflict')), 0),
      0,
    );

    return {
      cardCount: visibleCards.length,
      itemCount,
      alertCount,
    };
  }, [visibleCards]);

  const updatedAt = new Date(calendarNowMs).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const calendarFeedUpdatedLabel = calendarFeedUpdatedAt
    ? new Date(calendarFeedUpdatedAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '--';

  return (
    <main className="ui-shell newstrade-shell">
      <div className="ui-container newstrade-container">
        <div className="newstrade-promo">GLOBAL BRIEFING GRID :: Political + Economic + Market Impact Intelligence</div>

        <section className="newstrade-command" aria-label="NewsTrade command center">
          <div className="newstrade-command-head">
            <div>
              <p className="newstrade-kicker">World Monitor Mode</p>
              <h1>NewsTrade Live Board</h1>
            </div>

            <div className="newstrade-kpis">
              <span>{feedStats.cardCount} boards</span>
              <span>{feedStats.itemCount} headlines</span>
              <span>{feedStats.alertCount} alerts</span>
              <span>updated {updatedAt}</span>
            </div>
          </div>

          <div className="newstrade-command-bar">
            <div className="newstrade-filters" role="tablist" aria-label="Desk filters">
              {FILTERS.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  className={cn('newstrade-filter-btn', activeFilter === filter.key && 'is-active')}
                  onClick={() => setActiveFilter(filter.key)}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <label className="newstrade-search" htmlFor="newstrade-query">
              <span>Search</span>
              <input
                id="newstrade-query"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Iran, inflation, OPEC, ECB..."
              />
            </label>
          </div>
        </section>

        <section className="newstrade-calendar" aria-label="Economic calendar tabs">
          <div className="newstrade-calendar-head">
            <div>
              <p className="newstrade-kicker">Dual-source economic calendar</p>
              <h2>Economic Calendar</h2>
            </div>

            <div className="newstrade-calendar-meta">
              <span>{calendarEvents.length} events loaded</span>
              <span>provider: {CALENDAR_PROVIDER_LABELS[activeCalendarProvider]}</span>
              <span>feed: {calendarFeedStatus}</span>
              <span>source update: {calendarFeedUpdatedLabel}</span>
              <span>Current Time: {updatedAt}</span>
              <span>Display Time: remaining</span>
              <span>auto refresh: 30s</span>
              <a
                href={
                  activeCalendarProvider === 'forexfactory'
                    ? FOREX_FACTORY_CALENDAR_URL
                    : 'https://www.investing.com/economic-calendar/'
                }
                target="_blank"
                rel="noreferrer"
                className="newstrade-calendar-hub-link"
              >
                Open {CALENDAR_PROVIDER_LABELS[activeCalendarProvider]}
              </a>
            </div>
          </div>

          <div className="newstrade-calendar-source-tabs" role="tablist" aria-label="Calendar source tabs">
            {CALENDAR_PROVIDER_ORDER.map((providerKey) => (
              <button
                key={providerKey}
                type="button"
                role="tab"
                aria-selected={activeCalendarProvider === providerKey}
                className={cn('newstrade-calendar-tab', activeCalendarProvider === providerKey && 'is-active')}
                onClick={() => setActiveCalendarProvider(providerKey)}
              >
                {CALENDAR_PROVIDER_LABELS[providerKey]}
              </button>
            ))}
          </div>

          <div className="newstrade-calendar-tabs" role="tablist" aria-label="Calendar status filter">
            {CALENDAR_TAB_ORDER.map((tabKey) => (
              <button
                key={tabKey}
                type="button"
                role="tab"
                aria-selected={activeCalendarTab === tabKey}
                className={cn('newstrade-calendar-tab', activeCalendarTab === tabKey && 'is-active')}
                onClick={() => setActiveCalendarTab(tabKey)}
              >
                {CALENDAR_TAB_LABELS[tabKey]}
                <span>{calendarCounts[tabKey]}</span>
              </button>
            ))}
          </div>

          <div className="newstrade-calendar-table-wrap">
            <table className="newstrade-calendar-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Cur.</th>
                  <th>Country</th>
                  <th>Event</th>
                  <th>Imp.</th>
                  <th>Actual</th>
                  <th>Forecast</th>
                  <th>Previous</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {visibleCalendarEvents.map((event) => (
                  <tr key={event.id}>
                    <td>{formatCalendarTimeLabel(event.timeUtc)}</td>
                    <td>{event.currency}</td>
                    <td>{event.country}</td>
                    <td>
                      <a href={event.sourceUrl} target="_blank" rel="noreferrer" className="newstrade-calendar-link">
                        {event.event}
                      </a>
                    </td>
                    <td>
                      <span className={cn('newstrade-impact-pill', CALENDAR_IMPACT_CLASS_MAP[event.impact])}>
                        {CALENDAR_IMPACT_LABELS[event.impact]}
                      </span>
                    </td>
                    <td>{event.actual || '--'}</td>
                    <td>{event.forecast || '--'}</td>
                    <td>{event.previous || '--'}</td>
                    <td>
                      <a href={event.sourceUrl} target="_blank" rel="noreferrer" className="newstrade-calendar-source">
                        {event.source}
                      </a>
                    </td>
                  </tr>
                ))}

                {visibleCalendarEvents.length === 0 && (
                  <tr>
                    <td colSpan={9} className="newstrade-calendar-empty">
                      No events in "{CALENDAR_TAB_LABELS[activeCalendarTab]}" right now.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="newstrade-grid" aria-label="NewsTrade monitor grid">
          {visibleCards.map((card, index) => {
            const staggerStyle = { '--nt-stagger': index } as CSSProperties;

            return (
              <article
                key={card.id}
                className={cn(
                  'newstrade-card',
                  card.span === 'wide' && 'is-wide',
                  card.span === 'tall' && 'is-tall',
                )}
                style={staggerStyle}
              >
                <header className="newstrade-card-head">
                  <div>
                    <p>{card.deck}</p>
                    <h2>{card.title}</h2>
                  </div>
                  <span className="newstrade-live-chip">{card.status}</span>
                </header>

                <div className="newstrade-card-body">
                  {card.items.map((item, rowIndex) => (
                    <article key={`${card.id}-${rowIndex}`} className="newstrade-item">
                      <div className="newstrade-item-topline">
                        <span>{item.source}</span>
                        <time>{item.age}</time>
                      </div>

                      <p>{item.headline}</p>

                      <div className="newstrade-tag-row">
                        {item.tags.map((tag) => (
                          <span key={`${item.source}-${tag.label}`} className={cn('newstrade-tag', TAG_TONE_CLASS_MAP[tag.tone])}>
                            {tag.label}
                          </span>
                        ))}

                        <a
                          href={resolveSourceUrl(item.source)}
                          target="_blank"
                          rel="noreferrer"
                          className="newstrade-tag is-source"
                          aria-label={`Open source link: ${item.source}`}
                        >
                          Source: {item.source}
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
};

export default NewstradePage;
