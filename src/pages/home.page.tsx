import { useEffect, useMemo, useState, type CSSProperties, type DragEvent } from 'react';
import { AlertStrip } from '~/components/UI/AlertStrip';
import { Badge } from '~/components/UI/Badge';
import { FeatureCard } from '~/components/UI/FeatureCard';
import { LogLineItem } from '~/components/UI/LogLineItem';
import { LogPanel } from '~/components/UI/LogPanel';
import { Section } from '~/components/UI/Section';
import { StatCard } from '~/components/UI/StatCard';
import { TextField } from '~/components/UI/TextField';
import { UiButton } from '~/components/UI/UiButton';
import { WorldActivityMap as WorldActivityMapNew } from '~/components/UI/map/WorldActivityMap';
import { WorldActivityMap as WorldActivityMapLegacy } from '~/components/UI/map/WorldActivityMapLegacy';
import { cn } from '~/lib/utils';
import { THEME_CONFIG, THEME_STORAGE_KEY, applyTheme, normalizeTheme, themeKeys, type ThemeKey } from '~/config/theme-config';

type MonitorPanelTone = 'green' | 'yellow' | 'blue' | 'red';

type MonitorPanel = {
  id: string;
  title: string;
  status: string;
  tone: MonitorPanelTone;
  items: string[];
};

type GridPresetKey = '3x3' | '3x4' | '4x4';

const GRID_PRESETS: Record<GridPresetKey, { label: string; cols: number; rows: number }> = {
  '3x3': { label: '3 x 3', cols: 3, rows: 3 },
  '3x4': { label: '3 x 4', cols: 3, rows: 4 },
  '4x4': { label: '4 x 4', cols: 4, rows: 4 },
};

const monitorPanels: MonitorPanel[] = [
  {
    id: 'technology',
    title: 'Technology',
    status: 'Live',
    tone: 'green',
    items: [
      'Self-propagating malware poisons open source software and wipes Iran-based machines.',
      'Scanner package compromise spreads through CI pipelines in enterprise teams.',
      'Open-source browser sandbox bypass published with working proof of concept.',
      'Cloud provider launches instant failover orchestration for critical workloads.',
      'Inference cost drops 18 percent quarter-over-quarter as optimization improves.',
      'Edge GPU startup announces low-latency model serving stack for realtime apps.',
    ],
  },
  {
    id: 'startups',
    title: 'Startups & VC',
    status: 'Live',
    tone: 'green',
    items: [
      'Spanish VC firm launches a 100 million euro biotech creation fund.',
      'Legal AI startup Harvey crosses $1B valuation in latest funding round.',
      'Seed activity rises in climate and infrastructure software segments.',
      'Developer tooling startup sees strong growth after open-core pricing change.',
      'Fintech startup secures multi-region license expansion for SMB accounts.',
      'Robotics spinout begins warehouse pilot with two logistics operators.',
    ],
  },
  {
    id: 'vc-insights',
    title: 'VC Insights',
    status: 'Live',
    tone: 'blue',
    items: [
      'Funds rotate into resilient SaaS and compliance infrastructure businesses.',
      'Late-stage rounds prioritize profitability over growth-at-all-costs.',
      'Cross-border M&A rebounds in cybersecurity and identity management.',
      'Board governance pressure increases for AI governance and model audits.',
      'Valuation discipline remains strict outside category leaders.',
      'Secondaries market opens liquidity options for early employees.',
    ],
  },
  {
    id: 'global-news',
    title: 'Global Startup News',
    status: 'Live',
    tone: 'green',
    items: [
      'EU startups secure growth funding in biotech and clean materials.',
      'APAC B2B software market accelerates in logistics automation.',
      'LATAM payment rails improve settlement speed for cross-border commerce.',
      'Govtech founders partner with agencies for digital identity pilots.',
      'Healthcare AI expands clinical summarization to three new regions.',
      'Industrial AI firms raise rounds tied to manufacturing efficiency KPIs.',
    ],
  },
  {
    id: 'unicorn-tracker',
    title: 'Unicorn Tracker',
    status: 'Live',
    tone: 'blue',
    items: [
      'Enterprise AI assistant provider nears unicorn milestone after Series C.',
      'Cyber startup enters secondary markets with strong retention metrics.',
      'Cloud data platform surpasses $100M ARR with low churn trajectory.',
      'Healthtech scale-up expands payer integrations across North America.',
      'Autonomy software vendor opens strategic partnerships in EU and Japan.',
      'Risk analytics startup reports record quarter in regulated verticals.',
    ],
  },
  {
    id: 'cybersecurity',
    title: 'Cybersecurity',
    status: 'Live',
    tone: 'yellow',
    items: [
      'Critical flaw in AI workflow platform is under active exploitation.',
      'Automotive cyber threats grow as connected fleets expand rapidly.',
      'Banking trojan campaign broadens through sideloaded mobile apps.',
      'CERT warns of botnet traffic targeting branch office gateways.',
      'Enterprise SSO misconfig exposes internal administration endpoints.',
      'Patch SLA for internet-facing systems tightened to 72 hours.',
    ],
  },
  {
    id: 'ai-policy',
    title: 'AI Policy',
    status: 'Live',
    tone: 'red',
    items: [
      'Federal AI safety framework adds mandatory incident notification windows.',
      'Model auditing rules proposed for high-impact decision systems.',
      'Cross-border compute export controls tightened in strategic sectors.',
      'Public procurement policy now mandates model cards and risk disclosures.',
      'Data residency proposal enters comment period with enterprise impact.',
      'Updated licensing guidance clarifies open model compliance boundaries.',
    ],
  },
  {
    id: 'layoffs',
    title: 'Layoffs Tracker',
    status: 'Alert',
    tone: 'red',
    items: [
      'SaaS security vendor trims 9 percent workforce after restructuring.',
      'Payments platform consolidates teams in two international offices.',
      'Marketplaces reduce hiring plans as ad demand softens.',
      'Semiconductor supplier adjusts headcount amid inventory normalization.',
      'Cloud support functions merged after internal tooling migration.',
      'Consumer app startup pauses expansion and freezes new hiring.',
    ],
  },
  {
    id: 'markets',
    title: 'Markets',
    status: 'Watchlist',
    tone: 'blue',
    items: [
      'Berkshire: $474.20 (-0.23%)',
      'Costco: $982.47 (+0.29%)',
      'NVIDIA: $910.32 (+1.14%)',
      'Bitcoin: $66,545 (-4.14%)',
      'Ethereum: $3,088 (-2.91%)',
      'Gold: $2,178 (+0.42%)',
      'US10Y: 4.31% (+0.03)',
      'Brent: $81.43 (+0.54%)',
    ],
  },
  {
    id: 'crypto',
    title: 'Crypto',
    status: 'Live',
    tone: 'yellow',
    items: [
      'Spot ETF flow softens while options volume rises.',
      'Layer-2 fees decline after sequencer throughput improvements.',
      'Exchange reserves fall as self-custody trends accelerate.',
      'Staking yields compress in major proof-of-stake networks.',
      'Stablecoin velocity increases in cross-border settlement corridors.',
      'On-chain activity migrates toward lower-cost execution venues.',
    ],
  },
  {
    id: 'semiconductors',
    title: 'Semiconductors',
    status: 'Alert',
    tone: 'red',
    items: [
      'Supply chain lead times remain elevated for advanced packaging nodes.',
      'Foundry capex guidance revised as demand mix shifts.',
      'Memory pricing stabilizes after consecutive quarterly declines.',
      'Automotive chip backlog narrows in key manufacturing regions.',
      'Regional incentives trigger expansion of local fabs.',
      'Export rules create delays for selected high-performance accelerators.',
    ],
  },
  {
    id: 'cloud-infra',
    title: 'Cloud & Infra',
    status: 'Watch',
    tone: 'red',
    items: [
      'Regional outage postmortem highlights DNS and control plane coupling.',
      'Provider introduces lower-latency storage class for realtime analytics.',
      'Kubernetes fleet upgrades reduce scheduling tail latency.',
      'Serverless runtime adds cold-start mitigation in hot regions.',
      'Managed database tier revises backup retention and recovery windows.',
      'Enterprise teams adopt multi-cloud failover for critical services.',
    ],
  },
  {
    id: 'developer-community',
    title: 'Developer Community',
    status: 'Live',
    tone: 'green',
    items: [
      'Rust SDK hardening guide trends across developer forums.',
      'Open-source maintainers discuss funding and sustainability models.',
      'Framework release introduces new compiler optimizations for bundles.',
      'CLI ecosystem expands with telemetry-safe analytics tooling.',
      'Frontend teams share patterns for robust data fetching boundaries.',
      'Testing libraries add faster browser runner integrations.',
    ],
  },
  {
    id: 'macro',
    title: 'Macro Signals',
    status: 'Live',
    tone: 'blue',
    items: [
      'Inflation prints moderate while services pricing remains sticky.',
      'Manufacturing PMIs diverge between export and domestic segments.',
      'Labor market cools gradually with stable participation rates.',
      'Shipping indices recover after weather-related disruptions.',
      'Energy spreads widen as inventory drawdowns continue.',
      'FX volatility rises ahead of central bank commentary.',
    ],
  },
  {
    id: 'energy',
    title: 'Energy',
    status: 'Watch',
    tone: 'yellow',
    items: [
      'Grid operators prepare for peak summer demand risk.',
      'LNG spot rates fluctuate on regional storage updates.',
      'Renewable curtailment falls after transmission balancing changes.',
      'Refinery maintenance cycles tighten diesel supply outlook.',
      'Hydro reservoir levels improve in key generation corridors.',
      'Battery storage deployments accelerate in utility-scale projects.',
    ],
  },
  {
    id: 'supply-chain',
    title: 'Supply Chain',
    status: 'Live',
    tone: 'blue',
    items: [
      'Port congestion eases after route normalization across major lanes.',
      'Air freight demand rebounds in high-value electronics segments.',
      'Warehouse vacancy rates tighten in major logistics hubs.',
      'Cold-chain bottlenecks persist for pharmaceutical distribution.',
      'Freight tender rejection rates rise with seasonal demand.',
      'Nearshoring strategy expands supplier diversification programs.',
    ],
  },
];

const panelToneClassMap: Record<MonitorPanelTone, string> = {
  green: 'is-green',
  yellow: 'is-yellow',
  blue: 'is-blue',
  red: 'is-red',
};

const cardCornerClass = 'absolute h-2.5 w-2.5 border-[var(--accent)]';

const HomePage = () => {
  const [activeTheme, setActiveTheme] = useState<ThemeKey>(() => {
    if (typeof window === 'undefined') {
      return THEME_CONFIG.defaultTheme;
    }

    return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
  });

  useEffect(() => {
    applyTheme(activeTheme);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, activeTheme);
    }
  }, [activeTheme]);

  const switchTheme = () => {
    const currentIndex = themeKeys.indexOf(activeTheme);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % themeKeys.length : 0;
    setActiveTheme(themeKeys[nextIndex]);
  };

  const featureCards = [
    {
      title: 'Scalable',
      body: 'Engineered for scale, processing tens of thousands of orders and cancels per second with millisecond latency.',
      status: 'ACTIVE',
      badge: 'v2.4',
      badgeTone: 'blue' as const,
    },
    {
      title: 'Efficient',
      body: 'Infrastructure for matching orders and proving correctness is optimized for low costs, enabling zero fees for retail traders.',
      status: 'ACTIVE',
      badge: 'LIVE',
      badgeTone: 'green' as const,
    },
    {
      title: 'Verifiable',
      body: 'Strictly follows a publicly predefined rule set. Matching and liquidations are proven cryptographically.',
      status: 'ACTIVE',
      badge: 'ZK-PROOF',
      badgeTone: 'dim' as const,
    },
    {
      title: 'Secure',
      body: 'Uses Ethereum as the base layer for proofs and state changes. Users deposit and withdraw securely through Ethereum.',
      status: 'ACTIVE',
      badge: 'ETH L2',
      badgeTone: 'blue' as const,
    },
  ];

  const statCards = [
    {
      label: 'Total Orders / sec',
      value: '42,891',
      sub: '↑ 12.4% from last cycle',
      progress: 72,
      tone: 'blue' as const,
    },
    {
      label: 'Latency (avg)',
      value: '0.8ms',
      sub: 'Target: < 2ms',
      progress: 40,
      tone: 'green' as const,
    },
    {
      label: 'Error Rate',
      value: '0.02%',
      sub: '↓ 0.01% improvement',
      progress: 2,
      tone: 'red' as const,
    },
    {
      label: 'Uptime',
      value: '99.97%',
      sub: '30-day rolling',
      progress: 99.97,
      tone: 'yellow' as const,
    },
  ];

  const logLines = [
    {
      timestamp: '08:41:03.221',
      level: 'OK' as const,
      message: 'Block #19284710 finalized - 2847 txns committed',
    },
    {
      timestamp: '08:41:04.008',
      level: 'OK' as const,
      message: 'Proof generated in 142ms - submitted to L1',
    },
    {
      timestamp: '08:41:05.441',
      level: 'WARN' as const,
      message: 'Mempool depth approaching threshold (87%)',
    },
    {
      timestamp: '08:41:06.112',
      level: 'OK' as const,
      message: 'Liquidation engine: 3 positions resolved',
    },
    {
      timestamp: '08:41:07.899',
      level: 'ERR' as const,
      message: 'RPC timeout - fallback relay activated',
    },
    {
      timestamp: '08:41:08.003',
      level: 'OK' as const,
      message: 'Relay reconnected - resuming normal ops',
    },
  ];

  const [gridPresetKey, setGridPresetKey] = useState<GridPresetKey>('3x4');
  const [panelOrder, setPanelOrder] = useState<string[]>(() => monitorPanels.map((panel) => panel.id));
  const [draggedPanelId, setDraggedPanelId] = useState<string | null>(null);
  const [dragOverPanelId, setDragOverPanelId] = useState<string | null>(null);

  const gridPreset = GRID_PRESETS[gridPresetKey];
  const gridCapacity = gridPreset.cols * gridPreset.rows;

  const panelById = useMemo(
    () => Object.fromEntries(monitorPanels.map((panel) => [panel.id, panel])) as Record<string, MonitorPanel>,
    [],
  );

  const visiblePanels = panelOrder.slice(0, gridCapacity).map((panelId) => panelById[panelId]).filter(Boolean);

  const wmGridStyle = {
    '--wm-columns': String(gridPreset.cols),
    '--wm-rows': String(gridPreset.rows),
  } as CSSProperties;

  const movePanel = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) {
      return;
    }

    setPanelOrder((previousOrder) => {
      const sourceIndex = previousOrder.indexOf(sourceId);
      const targetIndex = previousOrder.indexOf(targetId);

      if (sourceIndex < 0 || targetIndex < 0) {
        return previousOrder;
      }

      const nextOrder = [...previousOrder];
      const [movedId] = nextOrder.splice(sourceIndex, 1);
      nextOrder.splice(targetIndex, 0, movedId);
      return nextOrder;
    });
  };

  const handlePanelDragStart = (panelId: string) => (event: DragEvent<HTMLElement>) => {
    setDraggedPanelId(panelId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', panelId);
  };

  const handlePanelDragOver = (panelId: string) => (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    if (dragOverPanelId !== panelId) {
      setDragOverPanelId(panelId);
    }
  };

  const handlePanelDrop = (targetPanelId: string) => (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    const sourcePanelId = draggedPanelId ?? event.dataTransfer.getData('text/plain');

    if (sourcePanelId) {
      movePanel(sourcePanelId, targetPanelId);
    }

    setDraggedPanelId(null);
    setDragOverPanelId(null);
  };

  const clearDragState = () => {
    setDraggedPanelId(null);
    setDragOverPanelId(null);
  };

  return (
    <main className="ui-shell">
      <div className="ui-container">
        <div className="theme-toolbar">
          <span className="theme-label">Theme</span>
          <div className="theme-pills" role="group" aria-label="Theme selector">
            {themeKeys.map((themeKey) => (
              <button
                key={themeKey}
                type="button"
                onClick={() => setActiveTheme(themeKey)}
                className={cn('theme-pill', activeTheme === themeKey && 'is-active')}
              >
                {THEME_CONFIG.themes[themeKey].label}
              </button>
            ))}
          </div>
          <button type="button" className="theme-cycle-btn" onClick={switchTheme}>
            Switch Theme
          </button>
        </div>

        <Section label="// feature cards">
          <div className="grid-4">
            {featureCards.map((item) => (
              <FeatureCard
                key={item.title}
                title={item.title}
                body={item.body}
                status={item.status}
                badge={item.badge}
                badgeTone={item.badgeTone}
              />
            ))}
          </div>
        </Section>

        <Section label="// stat cards">
          <div className="grid-4">
            {statCards.map((item) => (
              <StatCard
                key={item.label}
                label={item.label}
                value={item.value}
                sub={item.sub}
                progress={item.progress}
                tone={item.tone}
              />
            ))}
          </div>
        </Section>

        <Section label="// global signal map (new)">
          <WorldActivityMapNew />
        </Section>

        <Section label="// global signal map (legacy)">
          <WorldActivityMapLegacy />
        </Section>

        <Section label="// world monitor grid">
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
                  className={cn(
                    'wm-panel card relative cursor-default border border-[var(--border)] bg-[var(--bg-card)] transition-colors duration-200 hover:border-[var(--border-bright)] hover:bg-[var(--bg-card-hover)]',
                    draggedPanelId === panel.id && 'is-dragging',
                    dragOverPanelId === panel.id && draggedPanelId !== panel.id && 'is-drop-target',
                  )}
                  draggable
                  onDragStart={handlePanelDragStart(panel.id)}
                  onDragOver={handlePanelDragOver(panel.id)}
                  onDrop={handlePanelDrop(panel.id)}
                  onDragEnd={clearDragState}
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

        <Section label="// terminal log + buttons">
          <div className="grid-2">
            <LogPanel title="System Log" tags={[{ label: 'LIVE' }, { label: '127 entries', dim: true }]}>
              <div className="log-body">
                {logLines.map((line) => (
                  <LogLineItem
                    key={`${line.timestamp}-${line.level}`}
                    timestamp={line.timestamp}
                    level={line.level}
                    message={line.message}
                  />
                ))}
              </div>
            </LogPanel>

            <div className="control-column">
              <LogPanel title="Actions" padded>
                <div className="btn-group">
                  <UiButton tone="primary">Initialize</UiButton>
                  <UiButton tone="ghost">Configure</UiButton>
                  <UiButton tone="danger">Halt System</UiButton>
                </div>
              </LogPanel>

              <div className="alerts-stack">
                <AlertStrip tone="info" icon="INFO" message="System sync complete - all nodes aligned" />
                <AlertStrip tone="success" icon="OK" message="Block #19284710 finalized and committed to chain" />
                <AlertStrip
                  tone="warning"
                  icon="WARN"
                  message="Mempool depth approaching configured threshold"
                />
                <AlertStrip tone="error" icon="ERR" message="RPC timeout on primary relay - failover active" />
              </div>

              <LogPanel title="Order Entry" padded>
                <form className="form-stack">
                  <TextField label="Wallet Address" placeholder="0x0000...0000" />
                  <TextField label="Order Size (USD)" placeholder="10000.00" />
                  <UiButton tone="primary" type="submit">
                    Submit Order
                  </UiButton>
                </form>
              </LogPanel>
            </div>
          </div>
        </Section>

        <Section label="// data table">
          <LogPanel title="Recent Transactions" tags={[{ label: 'LIVE' }]}>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tx Hash</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Block</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="accent">0xf3a1...9b2c</td>
                    <td>BUY</td>
                    <td className="positive">+$24,500.00</td>
                    <td>
                      <Badge tone="green">CONFIRMED</Badge>
                    </td>
                    <td>#19284710</td>
                    <td className="dim">08:41:03</td>
                  </tr>
                  <tr>
                    <td className="accent">0xa2b8...1d7f</td>
                    <td>SELL</td>
                    <td className="negative">-$8,200.00</td>
                    <td>
                      <Badge tone="green">CONFIRMED</Badge>
                    </td>
                    <td>#19284709</td>
                    <td className="dim">08:40:58</td>
                  </tr>
                  <tr>
                    <td className="accent">0xc9d4...5e0a</td>
                    <td>LIQUIDATE</td>
                    <td className="warning">$1,042.88</td>
                    <td>
                      <Badge tone="dim">PENDING</Badge>
                    </td>
                    <td>#19284711</td>
                    <td className="dim">08:41:07</td>
                  </tr>
                  <tr>
                    <td className="accent">0xbb12...3c9e</td>
                    <td>BUY</td>
                    <td className="positive">+$61,000.00</td>
                    <td>
                      <Badge tone="red">FAILED</Badge>
                    </td>
                    <td>#19284708</td>
                    <td className="dim">08:40:51</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </LogPanel>
        </Section>
      </div>
    </main>
  );
};

export default HomePage;
