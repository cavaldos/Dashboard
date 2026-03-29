import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { cn } from '~/lib/utils';

import { MarketsMonitorPanel, type MarketsMonitorItem, type MarketsMonitorTab } from './MarketsMonitorPanel';
import { SentimentGaugeChart, type SentimentGaugeTone } from './SentimentGaugeChart';

type MonitorFrameProps = {
  title: string;
  liveLabel?: string;
  count?: string | number;
  className?: string;
  children: ReactNode;
};

type ScheduleEntry = {
  id: string;
  time: string;
  title: string;
  meta: string;
};

type MailEntry = {
  id: string;
  sender: string;
  subject: string;
  age: string;
  preview: string;
  unread?: boolean;
};

type FinanceLegendItem = {
  label: string;
  percent: string;
  color: string;
  amount: string;
};

type FeedCategory = 'Tech' | 'Finance' | 'World' | 'AI' | 'Science';

type FeedRow = {
  id: string;
  category: FeedCategory;
  source: string;
  title: string;
  age: string;
  tone: 'neutral' | 'hot';
};

type ForecastRow = {
  day: string;
  icon: string;
  current: string;
  high: string;
  low: string;
  summary: string;
  feels: string;
  humidity: string;
  wind: string;
};

type SentimentGaugeItem = {
  id: string;
  title: string;
  value: number;
  label: string;
  tone: SentimentGaugeTone;
};

const scheduleRows: ScheduleEntry[] = [
  {
    id: 'sch-1030',
    time: '10:30',
    title: 'Paper Reading: React - Reasoning + Acting in LLMs',
    meta: 'Join meeting',
  },
  {
    id: 'sch-1300',
    time: '13:00',
    title: '1-on-1 Advisor Meeting - Thesis Progress',
    meta: 'Office 403',
  },
  {
    id: 'sch-1430',
    time: '14:30',
    title: 'ClawSkills Sprint Planning',
    meta: 'Join meeting',
  },
  {
    id: 'sch-1630',
    time: '16:30',
    title: 'TA Office Hours - COMP7404 Machine Learning',
    meta: 'Room 102, Chao Yei Ching Building',
  },
  {
    id: 'sch-2000',
    time: '20:00',
    title: 'NeurIPS 2026 Submission - Final Review Session',
    meta: 'Join meeting',
  },
  {
    id: 'sch-2115',
    time: '21:15',
    title: 'Roadmap Review - Frontend Infrastructure',
    meta: 'Zoom call',
  },
  {
    id: 'sch-2230',
    time: '22:30',
    title: 'Daily Ops Checkpoint - Alert Triage',
    meta: 'Slack huddle',
  },
];

const emailRows: MailEntry[] = [
  {
    id: 'mail-1',
    sender: 'Cursor Team',
    subject: 'Using agents in Cursor',
    age: 'yesterday',
    preview: 'New workflow for multi-step prompts and inline code review.',
    unread: false,
  },
  {
    id: 'mail-2',
    sender: 'Cursor',
    subject: 'Here to help',
    age: 'yesterday',
    preview: 'Need anything else? You can ask for UI polish and diff output.',
    unread: false,
  },
  {
    id: 'mail-3',
    sender: 'Cursor Team',
    subject: 'Your first coding agent request in 2 mins',
    age: '2 days ago',
    preview: 'We prepared examples for troubleshooting and testing pipelines.',
    unread: true,
  },
  {
    id: 'mail-4',
    sender: 'Cursor',
    subject: "Couldn't process payment",
    age: '2 days ago',
    preview: 'Update billing profile to avoid retries on failed invoices.',
    unread: true,
  },
  {
    id: 'mail-5',
    sender: 'GitHub',
    subject: 'Security alerts for your repository',
    age: '3 days ago',
    preview: 'Two dependencies have updates addressing moderate advisories.',
    unread: true,
  },
  {
    id: 'mail-6',
    sender: 'Notion',
    subject: 'Weekly sprint notes shared with you',
    age: '4 days ago',
    preview: 'Planning board now includes action owners for each deliverable.',
    unread: false,
  },
];

const marketRowsByTab: Record<MarketsMonitorTab, MarketsMonitorItem[]> = {
  stocks: [
    { symbol: 'AAPL', name: 'Apple', price: '$260.83', change: '+0.37%', trend: 'up' },
    { symbol: 'AMZN', name: 'Amazon', price: '$214.33', change: '+0.39%', trend: 'up' },
    { symbol: 'GOOGL', name: 'Alphabet', price: '$307.04', change: '-0.22%', trend: 'down' },
    { symbol: 'META', name: 'Meta', price: '$654.07', change: '+1.03%', trend: 'up' },
    { symbol: 'MSFT', name: 'Microsoft', price: '$405.76', change: '-0.89%', trend: 'down' },
    { symbol: 'NVDA', name: 'NVIDIA', price: '$184.77', change: '+1.16%', trend: 'up' },
    { symbol: 'TSLA', name: 'Tesla', price: '$399.24', change: '+0.14%', trend: 'up' },
    { symbol: 'NFLX', name: 'Netflix', price: '$827.15', change: '+0.58%', trend: 'up' },
    { symbol: 'ORCL', name: 'Oracle', price: '$168.42', change: '-0.33%', trend: 'down' },
  ],
  crypto: [
    { symbol: 'BTC', name: 'Bitcoin', price: '$71,402', change: '+1.22%', trend: 'up' },
    { symbol: 'ETH', name: 'Ethereum', price: '$3,812', change: '+0.66%', trend: 'up' },
    { symbol: 'SOL', name: 'Solana', price: '$184.53', change: '-1.11%', trend: 'down' },
    { symbol: 'AVAX', name: 'Avalanche', price: '$42.90', change: '+0.47%', trend: 'up' },
    { symbol: 'DOGE', name: 'Dogecoin', price: '$0.21', change: '-0.35%', trend: 'down' },
    { symbol: 'ARB', name: 'Arbitrum', price: '$1.17', change: '-2.05%', trend: 'down' },
    { symbol: 'NEAR', name: 'Near', price: '$7.76', change: '+1.72%', trend: 'up' },
    { symbol: 'TON', name: 'Toncoin', price: '$6.27', change: '+0.21%', trend: 'up' },
  ],
  commodities: [
    { symbol: 'XAU', name: 'Gold', price: '$2,341', change: '+0.54%', trend: 'up' },
    { symbol: 'XAG', name: 'Silver', price: '$28.93', change: '+0.26%', trend: 'up' },
    { symbol: 'WTI', name: 'Crude Oil', price: '$82.17', change: '-0.42%', trend: 'down' },
    { symbol: 'NG', name: 'Natural Gas', price: '$2.39', change: '+1.07%', trend: 'up' },
    { symbol: 'CU', name: 'Copper', price: '$4.76', change: '-0.11%', trend: 'down' },
    { symbol: 'WHEAT', name: 'Wheat', price: '$6.43', change: '-0.29%', trend: 'down' },
    { symbol: 'COFFEE', name: 'Coffee', price: '$2.24', change: '+0.31%', trend: 'up' },
    { symbol: 'SUGAR', name: 'Sugar', price: '$0.20', change: '+0.09%', trend: 'up' },
  ],
};

const financeLegend: FinanceLegendItem[] = [
  { label: 'Housing', percent: '57.8%', color: '#ff6a6a', amount: '$3,798.20' },
  { label: 'Tech', percent: '32.9%', color: '#7cd4ff', amount: '$2,162.51' },
  { label: 'Food', percent: '4.9%', color: '#9ad877', amount: '$322.07' },
  { label: 'Transport', percent: '3.0%', color: '#ffd57a', amount: '$197.19' },
  { label: 'Entertainment', percent: '1.4%', color: '#c1b7ff', amount: '$92.03' },
];

const newsRows: FeedRow[] = [
  {
    id: 'news-tech-1',
    category: 'Tech',
    source: 'NATURE NEWS',
    title: 'China pledges billion-dollar spending boost for science',
    age: '2 minutes ago',
    tone: 'neutral',
  },
  {
    id: 'news-tech-2',
    category: 'Tech',
    source: 'NATURE NEWS',
    title: "Physics at risk: UK science leader on what's wrong with the latest funding cuts",
    age: '2 minutes ago',
    tone: 'hot',
  },
  {
    id: 'news-tech-3',
    category: 'Tech',
    source: 'WIRED',
    title: 'Maximizing carrier extraction in hybrid back-contact silicon solar cells',
    age: '3 minutes ago',
    tone: 'neutral',
  },
  {
    id: 'news-finance-1',
    category: 'Finance',
    source: 'BLOOMBERG',
    title: 'Treasury yields rise as swap desks trim rate-cut bets into quarter end',
    age: '4 minutes ago',
    tone: 'neutral',
  },
  {
    id: 'news-finance-2',
    category: 'Finance',
    source: 'FT',
    title: 'Funds rotate into quality after earnings guidance cuts in cyclicals',
    age: '6 minutes ago',
    tone: 'hot',
  },
  {
    id: 'news-world-1',
    category: 'World',
    source: 'REUTERS',
    title: 'Maritime corridor talks resume after overnight disruption in the region',
    age: '3 minutes ago',
    tone: 'neutral',
  },
  {
    id: 'news-world-2',
    category: 'World',
    source: 'AP',
    title: 'Aid agencies request temporary ceasefire for cross-border logistics',
    age: '9 minutes ago',
    tone: 'hot',
  },
  {
    id: 'news-ai-1',
    category: 'AI',
    source: 'TECHCRUNCH',
    title: 'Inference optimization stack cuts serving latency by 18 percent',
    age: '5 minutes ago',
    tone: 'neutral',
  },
  {
    id: 'news-ai-2',
    category: 'AI',
    source: 'THE VERGE',
    title: 'Open model licensing update creates fresh compliance pressure',
    age: '11 minutes ago',
    tone: 'hot',
  },
  {
    id: 'news-science-1',
    category: 'Science',
    source: 'SCIENCE',
    title: 'Deep-sea observation network captures unusual volcanic plume activity',
    age: '12 minutes ago',
    tone: 'neutral',
  },
  {
    id: 'news-science-2',
    category: 'Science',
    source: 'NATURE',
    title: 'Fusion materials team reports stronger resilience under neutron stress',
    age: '14 minutes ago',
    tone: 'neutral',
  },
];

const forecastRows: ForecastRow[] = [
  {
    day: 'Thu',
    icon: '☁',
    current: '18°C',
    high: '22°',
    low: '17°',
    summary: 'Partly cloudy - Hong Kong',
    feels: '19',
    humidity: '79',
    wind: '1',
  },
  {
    day: 'Fri',
    icon: '⛅',
    current: '17°C',
    high: '18°',
    low: '16°',
    summary: 'Cloudy intervals - Hong Kong',
    feels: '18',
    humidity: '83',
    wind: '3',
  },
  {
    day: 'Sat',
    icon: '☁',
    current: '19°C',
    high: '20°',
    low: '15°',
    summary: 'Overcast - Hong Kong',
    feels: '20',
    humidity: '74',
    wind: '4',
  },
  {
    day: 'Sun',
    icon: '⛅',
    current: '20°C',
    high: '22°',
    low: '17°',
    summary: 'Sunny breaks - Hong Kong',
    feels: '21',
    humidity: '68',
    wind: '5',
  },
];

const feedTabs: FeedCategory[] = ['Tech', 'Finance', 'World', 'AI', 'Science'];

const sentimentRows: SentimentGaugeItem[] = [
  {
    id: 'sentiment-1',
    title: 'Market Fear',
    value: 9,
    label: 'Extreme Fear',
    tone: 'fear',
  },
  {
    id: 'sentiment-2',
    title: 'Funding Pressure',
    value: 26,
    label: 'Risk-Off',
    tone: 'warning',
  },
  {
    id: 'sentiment-3',
    title: 'Momentum Pulse',
    value: 61,
    label: 'Neutral',
    tone: 'neutral',
  },
  {
    id: 'sentiment-4',
    title: 'Speculative Heat',
    value: 82,
    label: 'Greed',
    tone: 'greed',
  },
];

const formatClock = (timeZone: string, now: number) => {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone,
  }).format(new Date(now));
};

const formatDate = (timeZone: string, now: number) => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone,
  }).format(new Date(now));
};

const MonitorFrame = ({ title, liveLabel = 'LIVE', count, className, children }: MonitorFrameProps) => {
  return (
    <article className={cn('news-monitor-card', className)}>
      <header className="news-monitor-card-head">
        <h3>{title}</h3>

        <div className="news-monitor-card-head-meta">
          <span className="news-monitor-live-chip">{liveLabel}</span>
          {count !== undefined && <span className="news-monitor-count-chip">{count}</span>}
        </div>
      </header>

      <div className="news-monitor-card-body">{children}</div>
    </article>
  );
};

export const ScheduleMonitorCard = () => {
  const [activeEntryId, setActiveEntryId] = useState(scheduleRows[0]?.id ?? '');

  return (
    <MonitorFrame title="Schedule" count={scheduleRows.length}>
      <ul className="news-monitor-schedule-list">
        {scheduleRows.map((row) => {
          const isActive = activeEntryId === row.id;

          return (
            <li key={row.id} className={cn(isActive && 'is-active')}>
              <button type="button" className="news-monitor-schedule-row" onClick={() => setActiveEntryId(row.id)}>
                <time>{row.time}</time>
                <div>
                  <p>{row.title}</p>
                  <span>{row.meta}</span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </MonitorFrame>
  );
};

export const WeatherTimeMonitorCard = () => {
  const [selectedDay, setSelectedDay] = useState(forecastRows[0]?.day ?? '');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const selectedForecast = forecastRows.find((row) => row.day === selectedDay) ?? forecastRows[0];

  return (
    <MonitorFrame title="Weather & Time">
      <div className="news-monitor-weather-clocks">
        <article>
          <span>Hong Kong</span>
          <strong>{formatClock('Asia/Hong_Kong', now)}</strong>
          <small>{formatDate('Asia/Hong_Kong', now)}</small>
        </article>
        <article>
          <span>AOE (UTC-12)</span>
          <strong>{formatClock('Etc/GMT+12', now)}</strong>
          <small>{formatDate('Etc/GMT+12', now)}</small>
        </article>
      </div>

      <div className="news-monitor-weather-temp">
        <p className="news-monitor-weather-icon">{selectedForecast.icon}</p>
        <div>
          <strong>{selectedForecast.current}</strong>
          <p>{selectedForecast.summary}</p>
          <small>
            Feels like {selectedForecast.feels}° · {selectedForecast.humidity}% · {selectedForecast.wind} km/h
          </small>
        </div>
      </div>

      <div className="news-monitor-weather-forecast">
        {forecastRows.map((row) => {
          const isActive = selectedDay === row.day;

          return (
            <button
              type="button"
              key={row.day}
              className={cn('news-monitor-forecast-btn', isActive && 'is-active')}
              onClick={() => setSelectedDay(row.day)}
            >
              <span>{row.day}</span>
              <p>{row.icon}</p>
              <small>
                {row.high} {row.low}
              </small>
            </button>
          );
        })}
      </div>
    </MonitorFrame>
  );
};

export const EmailMonitorCard = () => {
  const [selectedEmailId, setSelectedEmailId] = useState(emailRows[0]?.id ?? '');
  const selectedEmail = emailRows.find((row) => row.id === selectedEmailId) ?? emailRows[0];
  const unreadCount = emailRows.filter((row) => row.unread).length;

  return (
    <MonitorFrame title="Email" count={emailRows.length}>
      <ul className="news-monitor-email-list">
        {emailRows.map((row) => {
          const isActive = selectedEmailId === row.id;

          return (
            <li key={row.id} className={cn(isActive && 'is-active')}>
              <button type="button" className="news-monitor-email-row" onClick={() => setSelectedEmailId(row.id)}>
                <div>
                  <p>{row.subject}</p>
                  <span>{row.sender}</span>
                </div>
                <time>{row.age}</time>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="news-monitor-email-preview">
        <p>
          Preview · {selectedEmail.sender} · {unreadCount} unread
        </p>
        <strong>{selectedEmail.subject}</strong>
        <span>{selectedEmail.preview}</span>
      </div>
    </MonitorFrame>
  );
};

export const DailyFinanceMonitorCard = () => {
  const [activeLegendLabel, setActiveLegendLabel] = useState(financeLegend[0]?.label ?? '');
  const activeLegend = financeLegend.find((row) => row.label === activeLegendLabel) ?? financeLegend[0];

  return (
    <MonitorFrame title="Daily Finance" liveLabel="+">
      <div className="news-monitor-finance-metrics">
        <article>
          <span>Income</span>
          <strong className="is-green">$11,700.00</strong>
        </article>
        <article>
          <span>Expenses</span>
          <strong className="is-red">$6,573.00</strong>
        </article>
        <article>
          <span>Net Balance</span>
          <strong>$5,127.00</strong>
        </article>
      </div>

      <div className="news-monitor-finance-body">
        <div
          className="news-monitor-finance-donut"
          role="img"
          aria-label="Expense breakdown chart"
          style={{ boxShadow: `0 0 0 1px ${activeLegend.color}44, 0 0 20px -14px ${activeLegend.color}` }}
        >
          <div className="news-monitor-finance-donut-core">
            <strong>{activeLegend.amount}</strong>
            <span>{activeLegend.label}</span>
          </div>
        </div>

        <ul className="news-monitor-finance-legend">
          {financeLegend.map((row) => {
            const isActive = activeLegendLabel === row.label;

            return (
              <li key={row.label} className={cn(isActive && 'is-active')}>
                <button type="button" className="news-monitor-finance-legend-row" onClick={() => setActiveLegendLabel(row.label)}>
                  <span>
                    <i style={{ backgroundColor: row.color }} />
                    {row.label}
                  </span>
                  <strong>{row.percent}</strong>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </MonitorFrame>
  );
};

export const NewsFeedMonitorCard = () => {
  const [activeCategory, setActiveCategory] = useState<FeedCategory>('Tech');
  const filteredRows = useMemo(() => newsRows.filter((row) => row.category === activeCategory), [activeCategory]);
  const [activeRowId, setActiveRowId] = useState(filteredRows[0]?.id ?? '');

  useEffect(() => {
    setActiveRowId(filteredRows[0]?.id ?? '');
  }, [filteredRows]);

  const activeRow = filteredRows.find((row) => row.id === activeRowId) ?? filteredRows[0];

  return (
    <MonitorFrame title="News" count={filteredRows.length} className="is-wide">
      <div className="news-monitor-feed-tabs" role="tablist" aria-label="News categories">
        {feedTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={tab === activeCategory}
            className={cn(tab === activeCategory && 'is-active')}
            onClick={() => setActiveCategory(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <ul className="news-monitor-feed-list">
        {filteredRows.map((row) => {
          const isActive = activeRowId === row.id;

          return (
            <li key={row.id} className={cn(isActive && 'is-active')}>
              <button type="button" className="news-monitor-feed-row" onClick={() => setActiveRowId(row.id)}>
                <p>{row.title}</p>
                <div>
                  <span>{row.source}</span>
                  <time>{row.age}</time>
                  {row.tone === 'hot' && <strong>HIGH</strong>}
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {activeRow && (
        <div className="news-monitor-feed-preview">
          <p>{activeRow.source}</p>
          <strong>{activeRow.title}</strong>
        </div>
      )}
    </MonitorFrame>
  );
};

export const SentimentMonitorCard = () => {
  const [activeGaugeId, setActiveGaugeId] = useState(sentimentRows[0]?.id ?? '');

  return (
    <MonitorFrame title="Sentiment" count={sentimentRows.length}>
      <ul className="news-monitor-sentiment-list">
        {sentimentRows.map((row) => {
          const isActive = activeGaugeId === row.id;

          return (
            <li key={row.id} className={cn(isActive && 'is-active')}>
              <button type="button" className="news-monitor-sentiment-item" onClick={() => setActiveGaugeId(row.id)}>
                <div className="news-monitor-sentiment-head">
                  <p>{row.title}</p>
                  <span>{row.label}</span>
                </div>

                <SentimentGaugeChart value={row.value} label={row.label} tone={row.tone} />
              </button>
            </li>
          );
        })}
      </ul>
    </MonitorFrame>
  );
};

export const NewsMonitorShowcase = () => {
  const [activeMarketTab, setActiveMarketTab] = useState<MarketsMonitorTab>('stocks');
  const currentMarketRows = marketRowsByTab[activeMarketTab];
  const [activeMarketSymbol, setActiveMarketSymbol] = useState(currentMarketRows[0]?.symbol ?? '');

  useEffect(() => {
    const nextRows = marketRowsByTab[activeMarketTab];
    setActiveMarketSymbol(nextRows[0]?.symbol ?? '');
  }, [activeMarketTab]);

  return (
    <div className="news-monitor-grid">
      <ScheduleMonitorCard />
      <WeatherTimeMonitorCard />
      <EmailMonitorCard />
      <MarketsMonitorPanel
        items={currentMarketRows}
        count={currentMarketRows.length}
        activeTab={activeMarketTab}
        onTabChange={setActiveMarketTab}
        activeSymbol={activeMarketSymbol}
        onSymbolSelect={setActiveMarketSymbol}
      />
      <DailyFinanceMonitorCard />
      <SentimentMonitorCard />
      <NewsFeedMonitorCard />
    </div>
  );
};
