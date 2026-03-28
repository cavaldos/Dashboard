import { useCallback, useEffect, useMemo, useState } from 'react';

import { AlertStrip } from '~/components/UI/AlertStrip';
import { Badge } from '~/components/UI/Badge';
import { LogPanel } from '~/components/UI/LogPanel';
import { Section } from '~/components/UI/Section';
import { UiButton } from '~/components/UI/UiButton';
import { cn } from '~/lib/utils';
import {
  ForexService,
  type ForexEconomicEvent,
  type ForexNewsItem,
  type FxPairSnapshot,
  type ImpactLevel,
} from '~/services/forex.service';
import '~/style/forex.css';

type DataStatus = 'loading' | 'live' | 'stale';
type NewsFilter = 'all' | 'financial' | 'geopolitical';

type StatusMeta = {
  status: DataStatus;
  updatedAt: string | null;
};

type AlertTone = 'info' | 'success' | 'warning' | 'error';

const SESSION_WINDOWS = [
  { label: 'Asia', from: 0, to: 7 },
  { label: 'London', from: 7, to: 13 },
  { label: 'New York', from: 13, to: 22 },
  { label: 'Overnight', from: 22, to: 24 },
];

const MAJOR_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD'];

const impactOrder: Record<ImpactLevel | 'Holiday', number> = {
  High: 0,
  Medium: 1,
  Low: 2,
  Holiday: 3,
};

const mapImpactTone = (impact: ImpactLevel | 'Holiday'): AlertTone => {
  if (impact === 'High') {
    return 'error';
  }

  if (impact === 'Medium') {
    return 'warning';
  }

  if (impact === 'Low') {
    return 'info';
  }

  return 'success';
};

const mapImpactBadgeTone = (impact: ImpactLevel | 'Holiday') => {
  if (impact === 'High') {
    return 'red' as const;
  }

  if (impact === 'Medium') {
    return 'blue' as const;
  }

  if (impact === 'Low') {
    return 'dim' as const;
  }

  return 'green' as const;
};

const mapStatusBadgeTone = (status: DataStatus) => {
  if (status === 'live') {
    return 'green' as const;
  }

  if (status === 'stale') {
    return 'red' as const;
  }

  return 'dim' as const;
};

const formatUpdatedTime = (isoTime: string | null): string => {
  if (!isoTime) {
    return '--';
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(isoTime));
};

const formatEventTime = (isoTime: string): string => {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoTime));
};

const formatRelativeTime = (isoTime: string, nowMs: number): string => {
  const elapsedSeconds = Math.round((nowMs - Date.parse(isoTime)) / 1000);
  const absSeconds = Math.abs(elapsedSeconds);

  if (absSeconds < 60) {
    return elapsedSeconds >= 0 ? `${absSeconds}s ago` : `in ${absSeconds}s`;
  }

  const absMinutes = Math.round(absSeconds / 60);
  if (absMinutes < 60) {
    return elapsedSeconds >= 0 ? `${absMinutes}m ago` : `in ${absMinutes}m`;
  }

  const absHours = Math.round(absMinutes / 60);
  if (absHours < 48) {
    return elapsedSeconds >= 0 ? `${absHours}h ago` : `in ${absHours}h`;
  }

  const absDays = Math.round(absHours / 24);
  return elapsedSeconds >= 0 ? `${absDays}d ago` : `in ${absDays}d`;
};

const formatPairRate = (pair: FxPairSnapshot): string => {
  const decimals = pair.quote === 'JPY' ? 2 : 4;
  return pair.rate.toFixed(decimals);
};

const formatMove = (value: number): string => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

const getCurrentSession = (time = new Date()): string => {
  const utcHour = time.getUTCHours();
  const window = SESSION_WINDOWS.find((slot) => utcHour >= slot.from && utcHour < slot.to);
  return window?.label ?? 'Asia';
};

const getPairNarrative = (pair: FxPairSnapshot, topTheme: ForexNewsItem['theme'] | null): string => {
  if (pair.pair.includes('JPY') && topTheme === 'Geopolitics') {
    return 'Safe-haven demand is lifting JPY in risk-off flows.';
  }

  if (pair.pair.includes('CAD') && topTheme === 'Energy') {
    return 'Oil headlines are dominating CAD pricing signals.';
  }

  if ((pair.pair.includes('EUR') || pair.pair.includes('GBP')) && topTheme === 'Policy') {
    return 'Policy divergence versus USD is steering direction.';
  }

  if (topTheme === 'Trade') {
    return 'Trade and tariff expectations are widening dispersion.';
  }

  if (Math.abs(pair.changePct) >= 0.65) {
    return 'Short-term volatility spike; watch headline sensitivity.';
  }

  return 'Price action is range-bound with headline-driven breaks.';
};

const ForexPage = () => {
  const [fxPairs, setFxPairs] = useState<FxPairSnapshot[]>([]);
  const [economicEvents, setEconomicEvents] = useState<ForexEconomicEvent[]>([]);
  const [financialNews, setFinancialNews] = useState<ForexNewsItem[]>([]);
  const [geopoliticalNews, setGeopoliticalNews] = useState<ForexNewsItem[]>([]);
  const [showHighImpactOnly, setShowHighImpactOnly] = useState(false);
  const [newsFilter, setNewsFilter] = useState<NewsFilter>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const [ratesMeta, setRatesMeta] = useState<StatusMeta>({ status: 'loading', updatedAt: null });
  const [calendarMeta, setCalendarMeta] = useState<StatusMeta>({ status: 'loading', updatedAt: null });
  const [newsMeta, setNewsMeta] = useState<StatusMeta>({ status: 'loading', updatedAt: null });

  const refreshRates = useCallback(async () => {
    try {
      const pairs = await ForexService.getFxSnapshot();
      if (pairs.length > 0) {
        setFxPairs(pairs);
      }

      setRatesMeta({ status: 'live', updatedAt: new Date().toISOString() });
    } catch {
      setRatesMeta((previous) => ({ ...previous, status: 'stale' }));
    }
  }, []);

  const refreshCalendar = useCallback(async () => {
    try {
      const events = await ForexService.getEconomicCalendar();
      if (events.length > 0) {
        setEconomicEvents(events);
      }

      setCalendarMeta({ status: 'live', updatedAt: new Date().toISOString() });
    } catch {
      setCalendarMeta((previous) => ({ ...previous, status: 'stale' }));
    }
  }, []);

  const refreshNews = useCallback(async () => {
    const [financialResult, geopoliticalResult] = await Promise.allSettled([
      ForexService.getFinancialNews(10),
      ForexService.getGeopoliticalNews(10),
    ]);

    let successfulResponse = false;

    if (financialResult.status === 'fulfilled' && financialResult.value.length > 0) {
      successfulResponse = true;
      setFinancialNews(financialResult.value);
    }

    if (geopoliticalResult.status === 'fulfilled' && geopoliticalResult.value.length > 0) {
      successfulResponse = true;
      setGeopoliticalNews(geopoliticalResult.value);
    }

    if (successfulResponse) {
      setNewsMeta({ status: 'live', updatedAt: new Date().toISOString() });
      return;
    }

    setNewsMeta((previous) => ({ ...previous, status: 'stale' }));
  }, []);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.allSettled([refreshRates(), refreshCalendar(), refreshNews()]);
    setIsRefreshing(false);
  }, [refreshCalendar, refreshNews, refreshRates]);

  useEffect(() => {
    let isUnmounted = false;

    const bootstrap = async () => {
      if (!isUnmounted) {
        await refreshAll();
      }
    };

    void bootstrap();

    const ratesIntervalId = setInterval(() => {
      void refreshRates();
    }, 60_000);

    const calendarIntervalId = setInterval(() => {
      void refreshCalendar();
    }, 15 * 60_000);

    const newsIntervalId = setInterval(() => {
      void refreshNews();
    }, 5 * 60_000);

    return () => {
      isUnmounted = true;
      clearInterval(ratesIntervalId);
      clearInterval(calendarIntervalId);
      clearInterval(newsIntervalId);
    };
  }, [refreshAll, refreshCalendar, refreshNews, refreshRates]);

  useEffect(() => {
    const clockIntervalId = setInterval(() => {
      setNowMs(Date.now());
    }, 30_000);

    return () => {
      clearInterval(clockIntervalId);
    };
  }, []);

  const combinedNews = useMemo(() => {
    return [...financialNews, ...geopoliticalNews].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  }, [financialNews, geopoliticalNews]);

  const topTheme = useMemo(() => {
    const highImpactNews = combinedNews.filter((item) => item.impact === 'High').slice(0, 12);
    if (highImpactNews.length === 0) {
      return null;
    }

    const countMap = highImpactNews.reduce<Record<string, number>>((accumulator, item) => {
      accumulator[item.theme] = (accumulator[item.theme] ?? 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(countMap).sort((a, b) => b[1] - a[1])[0]?.[0] as ForexNewsItem['theme'];
  }, [combinedNews]);

  const marketPulse = useMemo(() => {
    const averageMove =
      fxPairs.length === 0 ? 0 : fxPairs.reduce((total, pair) => total + Math.abs(pair.changePct), 0) / fxPairs.length;

    const biggestMovePair = [...fxPairs].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))[0] ?? null;
    const next24h = nowMs + 24 * 60 * 60 * 1000;

    const highImpactEvents = economicEvents.filter((event) => {
      const timestamp = Date.parse(event.date);
      return event.impact === 'High' && timestamp >= nowMs && timestamp <= next24h;
    }).length;

    const highImpactNews = combinedNews.filter((item) => item.impact === 'High').slice(0, 8).length;
    const riskScore = Math.min(100, Math.round(averageMove * 35 + highImpactEvents * 14 + highImpactNews * 8));

    let riskRegime = 'Balanced';
    if (riskScore >= 70) {
      riskRegime = 'Risk-Off';
    } else if (riskScore >= 45) {
      riskRegime = 'Transition';
    }

    return {
      averageMove,
      biggestMovePair,
      highImpactEvents,
      highImpactNews,
      riskScore,
      riskRegime,
      session: getCurrentSession(),
    };
  }, [combinedNews, economicEvents, fxPairs, nowMs]);

  const filteredEvents = useMemo(() => {
    const horizon = nowMs + 72 * 60 * 60 * 1000;

    return economicEvents
      .filter((event) => {
        const timestamp = Date.parse(event.date);
        const inWindow = timestamp >= nowMs - 6 * 60 * 60 * 1000 && timestamp <= horizon;
        const impactMatch = !showHighImpactOnly || event.impact === 'High';

        return inWindow && impactMatch;
      })
      .sort((a, b) => {
        const impactCompare = impactOrder[a.impact] - impactOrder[b.impact];
        if (impactCompare !== 0) {
          return impactCompare;
        }

        return Date.parse(a.date) - Date.parse(b.date);
      })
      .slice(0, 16);
  }, [economicEvents, showHighImpactOnly, nowMs]);

  const centralBankWatch = useMemo(() => {
    const centralBankRows = MAJOR_CURRENCIES.map((currency) => {
      const nextPolicyEvent = economicEvents.find((event) => {
        if (event.currency !== currency) {
          return false;
        }

        const title = event.title.toLowerCase();
        return (
          title.includes('fomc') ||
          title.includes('ecb') ||
          title.includes('boe') ||
          title.includes('boj') ||
          title.includes('rba') ||
          title.includes('rbnz') ||
          title.includes('snb') ||
          title.includes('gov') ||
          title.includes('president') ||
          title.includes('member')
        );
      });

      return {
        currency,
        nextPolicyEvent,
      };
    });

    return centralBankRows.filter((row) => row.nextPolicyEvent).slice(0, 6);
  }, [economicEvents]);

  const newsPanels = useMemo(() => {
    const applyFilters = (items: ForexNewsItem[]): ForexNewsItem[] => {
      return items.filter((item) => !showHighImpactOnly || item.impact === 'High').slice(0, 8);
    };

    return {
      financial: applyFilters(financialNews),
      geopolitical: applyFilters(geopoliticalNews),
    };
  }, [financialNews, geopoliticalNews, showHighImpactOnly]);

  const topAlerts = useMemo(() => {
    const alertsFromEvents = filteredEvents.slice(0, 3).map((event) => ({
      id: event.id,
      tone: mapImpactTone(event.impact),
      icon: event.impact === 'Holiday' ? 'INFO' : event.impact,
      message: `${event.currency} ${event.title} at ${formatEventTime(event.date)} (${event.impact})`,
    }));

    const alertsFromNews = combinedNews.slice(0, 3).map((item) => ({
      id: item.id,
      tone: mapImpactTone(item.impact),
      icon: item.impact,
      message: `${item.theme}: ${item.title}`,
    }));

    return [...alertsFromEvents, ...alertsFromNews].slice(0, 4);
  }, [combinedNews, filteredEvents]);

  const impactMatrixRows = useMemo(() => {
    return fxPairs.slice(0, 6).map((pair) => {
      const bias = pair.changePct >= 0.12 ? 'Bullish base' : pair.changePct <= -0.12 ? 'Bullish quote' : 'Neutral';

      return {
        pair: pair.pair,
        move: pair.changePct,
        bias,
        narrative: getPairNarrative(pair, topTheme),
      };
    });
  }, [fxPairs, topTheme]);

  const staleWarnings = useMemo(() => {
    const warnings: string[] = [];
    if (ratesMeta.status === 'stale') {
      warnings.push('Rates feed is stale. Last good snapshot is still shown.');
    }

    if (calendarMeta.status === 'stale') {
      warnings.push('Calendar feed is stale. Upcoming events may be delayed.');
    }

    if (newsMeta.status === 'stale') {
      warnings.push('News feed is stale. Monitor source links for confirmation.');
    }

    return warnings;
  }, [calendarMeta.status, newsMeta.status, ratesMeta.status]);

  return (
    <main className="ui-shell forex-shell">
      <div className="ui-container forex-layout">
        <Section label="// forex command center">
          <div className="forex-hero-grid">
            <article className="forex-hero-card">
              <p className="forex-hero-kicker">Realtime macro monitor</p>
              <h1 className="forex-hero-title">Forex Macro Radar</h1>
              <p className="forex-hero-text">
                Track financial and geopolitical narratives that drive currency repricing across major pairs.
              </p>

              <div className="forex-hero-badges">
                <Badge tone={marketPulse.riskRegime === 'Risk-Off' ? 'red' : marketPulse.riskRegime === 'Transition' ? 'blue' : 'green'}>
                  {marketPulse.riskRegime}
                </Badge>
                <Badge tone="dim">{marketPulse.session} Session</Badge>
                <Badge tone={mapStatusBadgeTone(ratesMeta.status)}>
                  {ratesMeta.status === 'live' ? 'Rates Live' : ratesMeta.status === 'stale' ? 'Rates Stale' : 'Rates Loading'}
                </Badge>
              </div>

              <dl className="forex-hero-metrics">
                <div>
                  <dt>Risk Score</dt>
                  <dd>{marketPulse.riskScore}</dd>
                </div>
                <div>
                  <dt>Avg Move</dt>
                  <dd>{formatMove(marketPulse.averageMove)}</dd>
                </div>
                <div>
                  <dt>High Impact Events (24h)</dt>
                  <dd>{marketPulse.highImpactEvents}</dd>
                </div>
                <div>
                  <dt>High Impact News</dt>
                  <dd>{marketPulse.highImpactNews}</dd>
                </div>
              </dl>

              <div className="forex-hero-refresh">
                <UiButton tone="primary" onClick={() => void refreshAll()} disabled={isRefreshing}>
                  {isRefreshing ? 'Refreshing...' : 'Refresh Live Data'}
                </UiButton>
                <p>
                  Rates {formatUpdatedTime(ratesMeta.updatedAt)} | Calendar {formatUpdatedTime(calendarMeta.updatedAt)} | News{' '}
                  {formatUpdatedTime(newsMeta.updatedAt)}
                </p>
              </div>
            </article>

            <LogPanel
              title="Major pairs pulse"
              tags={[
                { label: marketPulse.biggestMovePair ? `${marketPulse.biggestMovePair.pair} ${formatMove(marketPulse.biggestMovePair.changePct)}` : 'No data' },
                { label: ratesMeta.status.toUpperCase(), dim: ratesMeta.status !== 'live' },
              ]}
            >
              <div className="forex-pair-strip">
                {fxPairs.length === 0 && <p className="forex-empty-state">Waiting for pair data...</p>}
                {fxPairs.map((pair) => (
                  <article key={pair.pair} className="forex-pair-row">
                    <div>
                      <p className="forex-pair-name">{pair.pair}</p>
                      <p className="forex-pair-prev">Prev {formatPairRate({ ...pair, rate: pair.previousRate })}</p>
                    </div>
                    <div className="forex-pair-values">
                      <p>{formatPairRate(pair)}</p>
                      <p className={cn('forex-pair-change', pair.changePct > 0 ? 'is-up' : pair.changePct < 0 ? 'is-down' : 'is-flat')}>
                        {formatMove(pair.changePct)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </LogPanel>
          </div>
        </Section>

        <Section label="// impact alerts">
          <div className="alerts-stack forex-alert-stack">
            {topAlerts.length === 0 && (
              <AlertStrip
                tone="info"
                icon="INFO"
                message="No high-priority alerts yet. Live feeds are loading and will populate automatically."
              />
            )}

            {topAlerts.map((alert) => (
              <AlertStrip key={alert.id} tone={alert.tone} icon={alert.icon} message={alert.message} />
            ))}

            {staleWarnings.map((warning) => (
              <AlertStrip key={warning} tone="warning" icon="STALE" message={warning} />
            ))}
          </div>
        </Section>

        <Section label="// calendar and policy watch">
          <div className="grid-2 forex-board-grid">
            <LogPanel title="Economic calendar" tags={[{ label: '72H WINDOW' }, { label: showHighImpactOnly ? 'HIGH ONLY' : 'ALL IMPACT', dim: true }]}>
              <div className="forex-panel-toolbar">
                <div className="forex-chip-row" role="group" aria-label="Calendar filters">
                  <button
                    type="button"
                    className={cn('forex-chip-btn', !showHighImpactOnly && 'is-active')}
                    onClick={() => setShowHighImpactOnly(false)}
                  >
                    All impact
                  </button>
                  <button
                    type="button"
                    className={cn('forex-chip-btn', showHighImpactOnly && 'is-active')}
                    onClick={() => setShowHighImpactOnly(true)}
                  >
                    High impact only
                  </button>
                </div>
              </div>

              <div className="forex-event-list">
                {filteredEvents.length === 0 && <p className="forex-empty-state">No calendar events match current filter.</p>}
                {filteredEvents.map((event) => (
                  <article key={event.id} className="forex-event-row">
                    <div className="forex-event-head">
                      <Badge tone={mapImpactBadgeTone(event.impact)}>{event.impact}</Badge>
                      <span className="forex-event-currency">{event.currency}</span>
                      <span className="forex-event-time">{formatEventTime(event.date)}</span>
                    </div>
                    <p className="forex-event-title">{event.title}</p>
                    <p className="forex-event-meta">
                      Forecast {event.forecast} | Previous {event.previous}
                    </p>
                  </article>
                ))}
              </div>
            </LogPanel>

            <LogPanel title="Central bank watch" tags={[{ label: 'POLICY' }, { label: topTheme ?? 'Theme: mixed', dim: true }]}>
              <div className="forex-central-grid">
                {centralBankWatch.length === 0 && <p className="forex-empty-state">No policy events detected in current week feed.</p>}
                {centralBankWatch.map((row) => (
                  <article key={row.currency} className="forex-central-card">
                    <div className="forex-central-head">
                      <p>{row.currency}</p>
                      <Badge tone={row.nextPolicyEvent?.impact === 'High' ? 'red' : 'blue'}>{row.nextPolicyEvent?.impact}</Badge>
                    </div>
                    <p className="forex-central-title">{row.nextPolicyEvent?.title}</p>
                    <p className="forex-central-meta">{row.nextPolicyEvent ? formatEventTime(row.nextPolicyEvent.date) : '--'}</p>
                  </article>
                ))}
              </div>
            </LogPanel>
          </div>
        </Section>

        <Section label="// live news flow">
          <div className="forex-news-toolbar" role="group" aria-label="News feed filters">
            <button
              type="button"
              className={cn('forex-news-btn', newsFilter === 'all' && 'is-active')}
              onClick={() => setNewsFilter('all')}
            >
              All feeds
            </button>
            <button
              type="button"
              className={cn('forex-news-btn', newsFilter === 'financial' && 'is-active')}
              onClick={() => setNewsFilter('financial')}
            >
              Financial
            </button>
            <button
              type="button"
              className={cn('forex-news-btn', newsFilter === 'geopolitical' && 'is-active')}
              onClick={() => setNewsFilter('geopolitical')}
            >
              Geopolitical
            </button>
          </div>

          <div className={cn('forex-news-grid', newsFilter === 'all' && 'is-dual')}>
            {newsFilter !== 'geopolitical' && (
              <LogPanel title="Financial headlines" tags={[{ label: 'FX-SENSITIVE' }, { label: newsMeta.status.toUpperCase(), dim: newsMeta.status !== 'live' }]}>
                <div className="forex-news-list">
                  {newsPanels.financial.length === 0 && <p className="forex-empty-state">No financial headlines available.</p>}
                  {newsPanels.financial.map((item) => (
                    <article key={item.id} className="forex-news-item">
                      <div className="forex-news-meta">
                        <Badge tone={mapImpactBadgeTone(item.impact)}>{item.impact}</Badge>
                        <span>{item.theme}</span>
                        <span>{formatRelativeTime(item.publishedAt, nowMs)}</span>
                      </div>
                      <a href={item.link} target="_blank" rel="noreferrer" className="forex-news-title">
                        {item.title}
                      </a>
                      <p className="forex-news-summary">{item.summary}</p>
                      <p className="forex-news-source">{item.source}</p>
                    </article>
                  ))}
                </div>
              </LogPanel>
            )}

            {newsFilter !== 'financial' && (
              <LogPanel title="Geopolitical headlines" tags={[{ label: 'GLOBAL RISK' }, { label: newsMeta.status.toUpperCase(), dim: newsMeta.status !== 'live' }]}>
                <div className="forex-news-list">
                  {newsPanels.geopolitical.length === 0 && <p className="forex-empty-state">No geopolitical headlines available.</p>}
                  {newsPanels.geopolitical.map((item) => (
                    <article key={item.id} className="forex-news-item">
                      <div className="forex-news-meta">
                        <Badge tone={mapImpactBadgeTone(item.impact)}>{item.impact}</Badge>
                        <span>{item.theme}</span>
                        <span>{formatRelativeTime(item.publishedAt, nowMs)}</span>
                      </div>
                      <a href={item.link} target="_blank" rel="noreferrer" className="forex-news-title">
                        {item.title}
                      </a>
                      <p className="forex-news-summary">{item.summary}</p>
                      <p className="forex-news-source">{item.source}</p>
                    </article>
                  ))}
                </div>
              </LogPanel>
            )}
          </div>
        </Section>

        <Section label="// fx impact matrix">
          <LogPanel title="Pair narrative matrix" tags={[{ label: 'LIVE' }, { label: topTheme ? `Top theme: ${topTheme}` : 'Top theme: n/a', dim: true }]}> 
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Pair</th>
                    <th>Move</th>
                    <th>Bias</th>
                    <th>Narrative</th>
                  </tr>
                </thead>
                <tbody>
                  {impactMatrixRows.map((row) => (
                    <tr key={row.pair}>
                      <td className="accent">{row.pair}</td>
                      <td className={cn(row.move > 0 ? 'positive' : row.move < 0 ? 'negative' : 'dim')}>{formatMove(row.move)}</td>
                      <td>{row.bias}</td>
                      <td>{row.narrative}</td>
                    </tr>
                  ))}
                  {impactMatrixRows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="forex-table-empty">
                        No pair matrix yet. Rates feed is still initializing.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </LogPanel>
        </Section>
      </div>
    </main>
  );
};

export default ForexPage;
