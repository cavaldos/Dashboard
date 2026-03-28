import { useEffect, useRef, useState } from 'react';
import '~/style/intro.css';
import { AlertStrip } from '~/components/UI/AlertStrip';
import { Badge } from '~/components/UI/Badge';
import { FeatureCard } from '~/components/UI/FeatureCard';
import { LogLineItem } from '~/components/UI/LogLineItem';
import { LogPanel } from '~/components/UI/LogPanel';
import { Section } from '~/components/UI/Section';
import { StatCard } from '~/components/UI/StatCard';
import { TextField } from '~/components/UI/TextField';
import { UiButton } from '~/components/UI/UiButton';
import { UiModal } from '~/components/UI/UiModal';
import { UiSelect } from '~/components/UI/UiSelect';

const catalog = [
  { id: 'overview', title: 'Overview', items: 'Section + Layout' },
  { id: 'typography', title: 'Typography', items: 'Titles + Body' },
  { id: 'button-badge', title: 'Buttons & Badges', items: '7 samples' },
  { id: 'forms', title: 'Forms', items: 'TextField + Inputs' },
  { id: 'modal', title: 'Modal', items: 'Dialog + Actions' },
  { id: 'alerts', title: 'Alerts', items: '4 tones' },
  { id: 'cards', title: 'Cards', items: 'Feature + Stat' },
  { id: 'logs', title: 'Logs', items: 'Panel + LogLine' },
  { id: 'table', title: 'Tables', items: 'Data grid demo' },
  { id: 'composition', title: 'Composition', items: 'Combined UI' },
];

type ToastTone = 'success' | 'error' | 'info' | 'warning';
type ToastPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

type DemoToast = {
  id: number;
  tone: ToastTone;
  title: string;
  message: string;
};

type TableCategory = 'Action' | 'Layout' | 'Feedback' | 'Form' | 'Data';

type DemoTableRow = {
  component: string;
  category: TableCategory;
  status: string;
  statusTone: 'blue' | 'green' | 'red' | 'dim';
  usage: string;
  owner: string;
};

type TableSortKey = 'component-asc' | 'component-desc' | 'usage-desc' | 'usage-asc' | 'owner-asc';

const toastTemplates: Record<ToastTone, { title: string; message: string }> = {
  success: {
    title: 'Success',
    message: 'Your changes are saved successfully.',
  },
  error: {
    title: 'Error',
    message: 'Something failed while saving changes.',
  },
  info: {
    title: 'Info',
    message: 'A new update is available for your account.',
  },
  warning: {
    title: 'Warning',
    message: 'Your session expires soon. Please review.',
  },
};

const toastPositionOptions: Array<{ value: ToastPosition; label: string }> = [
  { value: 'top-left', label: 'Top left' },
  { value: 'top-right', label: 'Top right' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'bottom-right', label: 'Bottom right' },
];

const variantOptions = [
  { value: 'primary', label: 'Primary' },
  { value: 'ghost', label: 'Ghost' },
  { value: 'danger', label: 'Danger' },
];

const tableRows: DemoTableRow[] = [
  { component: 'UiButton', category: 'Action', status: 'Stable', statusTone: 'green', usage: '42 files', owner: 'Frontend' },
  { component: 'LogPanel', category: 'Layout', status: 'Core', statusTone: 'blue', usage: '18 files', owner: 'Platform' },
  { component: 'AlertStrip', category: 'Feedback', status: 'Review', statusTone: 'dim', usage: '6 files', owner: 'Frontend' },
  { component: 'TextField', category: 'Form', status: 'Stable', statusTone: 'green', usage: '22 files', owner: 'Frontend' },
  { component: 'UiSelect', category: 'Form', status: 'Core', statusTone: 'blue', usage: '4 files', owner: 'Frontend' },
  { component: 'Badge', category: 'Data', status: 'Stable', statusTone: 'green', usage: '27 files', owner: 'Platform' },
];

const tableCategoryOptions = [
  { value: 'all', label: 'All categories' },
  { value: 'Action', label: 'Action' },
  { value: 'Layout', label: 'Layout' },
  { value: 'Feedback', label: 'Feedback' },
  { value: 'Form', label: 'Form' },
  { value: 'Data', label: 'Data' },
];

const tableSortOptions: Array<{ value: TableSortKey; label: string }> = [
  { value: 'component-asc', label: 'Name A-Z' },
  { value: 'component-desc', label: 'Name Z-A' },
  { value: 'usage-desc', label: 'Usage high-low' },
  { value: 'usage-asc', label: 'Usage low-high' },
  { value: 'owner-asc', label: 'Owner A-Z' },
];

const IntroPage = () => {
  const [toastPosition, setToastPosition] = useState<ToastPosition>('top-right');
  const [variant, setVariant] = useState('primary');
  const [tableSearch, setTableSearch] = useState('');
  const [tableCategory, setTableCategory] = useState('all');
  const [tableSort, setTableSort] = useState<TableSortKey>('component-asc');
  const [toasts, setToasts] = useState<DemoToast[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const timeoutIds = useRef<number[]>([]);

  const normalizedSearch = tableSearch.trim().toLowerCase();
  const filteredTableRows = tableRows.filter((row) => {
    const byCategory = tableCategory === 'all' || row.category === tableCategory;
    const searchTarget = `${row.component} ${row.category} ${row.status} ${row.owner}`.toLowerCase();
    const bySearch = !normalizedSearch || searchTarget.includes(normalizedSearch);

    return byCategory && bySearch;
  });

  const sortedTableRows = [...filteredTableRows].sort((a, b) => {
    if (tableSort === 'component-asc') {
      return a.component.localeCompare(b.component);
    }

    if (tableSort === 'component-desc') {
      return b.component.localeCompare(a.component);
    }

    if (tableSort === 'owner-asc') {
      return a.owner.localeCompare(b.owner);
    }

    const usageA = Number.parseInt(a.usage, 10);
    const usageB = Number.parseInt(b.usage, 10);

    if (tableSort === 'usage-asc') {
      return usageA - usageB;
    }

    return usageB - usageA;
  });

  const removeToast = (toastId: number) => {
    setToasts((prev) => prev.filter((item) => item.id !== toastId));
  };

  const showToast = (tone: ToastTone) => {
    const template = toastTemplates[tone];
    const id = Date.now() + Math.floor(Math.random() * 10000);

    setToasts((prev) => [...prev, { id, tone, title: template.title, message: template.message }]);

    const timeoutId = window.setTimeout(() => {
      removeToast(id);
      timeoutIds.current = timeoutIds.current.filter((item) => item !== timeoutId);
    }, 3500);

    timeoutIds.current.push(timeoutId);
  };

  const clearToasts = () => {
    timeoutIds.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutIds.current = [];
    setToasts([]);
  };

  useEffect(() => {
    return () => {
      timeoutIds.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  return (
    <main className="ui-shell intro-shell">
      <div className="ui-container intro-layout">
        <aside className="intro-sidebar">
          <p className="intro-kicker">component library</p>
          <h1 className="intro-title">Components</h1>
          <p className="intro-subtitle">Interactive index of every reusable UI building block in this project.</p>

          <nav aria-label="Component section navigation">
            <ul className="intro-nav-list">
              {catalog.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="intro-nav-link">
                    <span>{section.title}</span>
                    <span className="intro-nav-meta">{section.items}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="intro-content">
          <div id="overview">
            <Section label="// overview">
              <LogPanel title="UI kit status" padded>
                <p className="msg">
                  This page showcases all project components with examples you can reuse as templates in upcoming screens.
                </p>
                <div className="intro-chip-row">
                  <Badge tone="blue">9 Core Blocks</Badge>
                  <Badge tone="green">Reusable</Badge>
                  <Badge tone="dim">Production Ready</Badge>
                </div>
              </LogPanel>
            </Section>
          </div>

          <div id="typography">
            <Section label="// typography">
              <LogPanel title="Typography and rhythm" padded>
                <div className="typography-stack">
                  <h2 className="intro-h2">Heading level 2</h2>
                  <h3 className="intro-h3">Heading level 3</h3>
                  <p className="msg">
                    Body text uses mono style with compact line-height for dashboard readability and consistent density.
                  </p>
                  <p className="dim">Small muted copy for metadata, helper text, and low-priority annotations.</p>
                </div>
              </LogPanel>
            </Section>
          </div>

          <div id="button-badge">
            <Section label="// buttons and badges">
              <LogPanel title="Actions and status marks" padded>
                <div className="intro-demo-stack">
                  <div className="btn-group">
                    <UiButton tone="primary">Create</UiButton>
                    <UiButton tone="ghost">Preview</UiButton>
                    <UiButton tone="danger">Delete</UiButton>
                    <UiButton tone="primary">Save Draft</UiButton>
                  </div>
                  <div className="btn-group">
                    <Badge tone="blue">NEW</Badge>
                    <Badge tone="green">SUCCESS</Badge>
                    <Badge tone="red">FAILED</Badge>
                    <Badge tone="dim">QUEUED</Badge>
                  </div>
                </div>
              </LogPanel>
            </Section>
          </div>

          <div id="forms">
            <Section label="// forms">
              <LogPanel title="TextField and native controls" padded>
                <form className="form-stack">
                  <TextField label="Component name" placeholder="UiButton" />
                  <TextField label="Use case" placeholder="Primary action in modal footer" />
                  <label className="field">
                    <span>Variant</span>
                    <UiSelect value={variant} options={variantOptions} onChange={setVariant} ariaLabel="Variant options" />
                  </label>
                  <UiButton tone="primary" type="submit">
                    Submit example
                  </UiButton>
                </form>
              </LogPanel>
            </Section>
          </div>

          <div id="alerts">
            <Section label="// alerts">
              <div className="grid-2">
                <LogPanel title="Alert theater" tags={[{ label: 'ANIMATED' }]}>
                  <div className="log-body">
                    <div className="alerts-stack intro-alerts-stack">
                      <div className="intro-alert-item intro-alert-delay-1">
                        <AlertStrip tone="info" icon="INFO" message="Sync engine started in background mode" />
                      </div>
                      <div className="intro-alert-item intro-alert-delay-2">
                        <AlertStrip tone="success" icon="OK" message="Deployment completed across all zones" />
                      </div>
                      <div className="intro-alert-item intro-alert-delay-3">
                        <AlertStrip tone="warning" icon="WARN" message="Queue depth above 75 percent threshold" />
                      </div>
                      <div className="intro-alert-item intro-alert-delay-4">
                        <AlertStrip tone="error" icon="ERR" message="Primary endpoint timed out, using failover" />
                      </div>
                    </div>
                  </div>
                </LogPanel>

                <LogPanel title="Alert patterns" tags={[{ label: 'MIXED' }, { label: 'LIVE', dim: true }]}>
                  <div className="log-body intro-demo-stack">
                    <div className="intro-alert-banner intro-alert-delay-1">
                      <span className="intro-alert-banner-dot" />
                      Incident stream is active and recording
                    </div>
                    <div className="intro-alert-row intro-alert-delay-2">
                      <Badge tone="red">SEV-2</Badge>
                      <span className="msg">Payment relay unhealthy in ap-south</span>
                    </div>
                    <div className="intro-alert-row intro-alert-delay-3">
                      <Badge tone="dim">RETRY</Badge>
                      <span className="msg">Auto-retry in 12s with exponential backoff</span>
                    </div>
                    <div className="btn-group intro-alert-delay-4">
                      <UiButton tone="primary">Acknowledge</UiButton>
                      <UiButton tone="ghost">View logs</UiButton>
                      <UiButton tone="danger">Silence 5m</UiButton>
                    </div>

                    <div className="intro-toast-controls">
                      <div className="field intro-toast-position-field">
                        <span>Toast position</span>
                        <UiSelect
                          value={toastPosition}
                          options={toastPositionOptions}
                          onChange={(value) => setToastPosition(value as ToastPosition)}
                          ariaLabel="Toast position options"
                        />
                      </div>

                      <div className="intro-toast-trigger-row">
                        <button type="button" className="intro-toast-trigger success" onClick={() => showToast('success')}>
                          Show success
                        </button>
                        <button type="button" className="intro-toast-trigger error" onClick={() => showToast('error')}>
                          Show error
                        </button>
                        <button type="button" className="intro-toast-trigger info" onClick={() => showToast('info')}>
                          Show info
                        </button>
                        <button type="button" className="intro-toast-trigger warning" onClick={() => showToast('warning')}>
                          Show warning
                        </button>
                        <button type="button" className="intro-toast-trigger ghost" onClick={clearToasts}>
                          Clear all
                        </button>
                      </div>
                    </div>
                  </div>
                </LogPanel>
              </div>
            </Section>
          </div>

          <div id="modal">
            <Section label="// modal">
              <LogPanel title="Modal dialog" padded>
                <div className="intro-demo-stack">
                  <p className="msg">Use modal for confirmations, quick forms, or actions that require focused attention.</p>
                  <div className="btn-group">
                    <UiButton tone="primary" onClick={() => setIsModalOpen(true)}>
                      Open modal
                    </UiButton>
                  </div>
                </div>
              </LogPanel>
            </Section>
          </div>

          <div id="cards">
            <Section label="// cards">
              <div className="grid-2">
                <FeatureCard
                  title="Reusable"
                  body="Designed to be dropped into pages without custom wrappers."
                  status="ACTIVE"
                  badge="CORE"
                  badgeTone="blue"
                />
                <FeatureCard
                  title="Composable"
                  body="Pairs cleanly with panel, badge, and table primitives."
                  status="ACTIVE"
                  badge="FLEX"
                  badgeTone="green"
                />
              </div>

              <div className="grid-4 intro-gap-top">
                <StatCard label="Coverage" value="91%" sub="components tested" tone="green" progress={91} />
                <StatCard label="Build Time" value="18s" sub="average local build" tone="blue" progress={56} />
                <StatCard label="Warnings" value="2" sub="linting warnings" tone="yellow" progress={20} />
                <StatCard label="Errors" value="0" sub="runtime errors" tone="red" progress={0} />
              </div>
            </Section>
          </div>

          <div id="logs">
            <Section label="// logs">
              <div className="grid-2">
                <LogPanel title="Panel with tags" tags={[{ label: 'LIVE' }, { label: 'INTRO', dim: true }]}>
                  <div className="log-body">
                    <p className="msg">Use this wrapper for tables, forms, and timeline-like sections.</p>
                  </div>
                </LogPanel>

                <LogPanel title="LogLine samples">
                  <div className="log-body">
                    <LogLineItem timestamp="09:12:01.100" level="OK" message="Component registry loaded" />
                    <LogLineItem timestamp="09:12:02.120" level="WARN" message="Legacy prop usage detected" />
                    <LogLineItem timestamp="09:12:03.140" level="ERR" message="Preview service timeout" />
                  </div>
                </LogPanel>
              </div>
            </Section>
          </div>

          <div id="table">
            <Section label="// tables">
              <LogPanel title="Data table demo" tags={[{ label: 'SNAPSHOT' }]}> 
                <div className="intro-table-toolbar">
                  <label className="field intro-table-search-field">
                    <span>Search components</span>
                    <input
                      type="text"
                      value={tableSearch}
                      onChange={(event) => setTableSearch(event.target.value)}
                      placeholder="Search by component, status, owner..."
                    />
                  </label>

                  <label className="field intro-table-filter-field">
                    <span>Category filter</span>
                    <UiSelect value={tableCategory} options={tableCategoryOptions} onChange={setTableCategory} ariaLabel="Table category filter" />
                  </label>

                  <label className="field intro-table-sort-field">
                    <span>Sort by</span>
                    <UiSelect value={tableSort} options={tableSortOptions} onChange={(value) => setTableSort(value as TableSortKey)} ariaLabel="Table sort options" />
                  </label>
                </div>

                <p className="intro-table-result-hint">
                  Showing {sortedTableRows.length} of {tableRows.length} components
                </p>

                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Component</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Usage</th>
                        <th>Owner</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTableRows.map((row) => (
                        <tr key={row.component}>
                          <td className="accent">{row.component}</td>
                          <td>{row.category}</td>
                          <td>
                            <Badge tone={row.statusTone}>{row.status}</Badge>
                          </td>
                          <td>{row.usage}</td>
                          <td className="dim">{row.owner}</td>
                        </tr>
                      ))}
                      {sortedTableRows.length === 0 && (
                        <tr>
                          <td colSpan={5} className="intro-table-empty">
                            No components match your filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </LogPanel>
            </Section>
          </div>

          <div id="composition">
            <Section label="// composition demo">
              <div className="grid-2">
                <FeatureCard
                  title="Page Blueprint"
                  body="Start with Section + LogPanel, then attach actions, alerts, and metrics for complete dashboard modules."
                  status="READY"
                  badge="START"
                  badgeTone="blue"
                />

                <LogPanel title="Quick actions" padded>
                  <div className="intro-demo-stack">
                    <div className="btn-group">
                      <UiButton tone="primary">Generate page</UiButton>
                      <UiButton tone="ghost">Open docs</UiButton>
                    </div>
                    <AlertStrip tone="success" icon="OK" message="Intro page is now a complete showcase" />
                  </div>
                </LogPanel>
              </div>
            </Section>
          </div>
        </div>
      </div>

      <div className={`intro-toast-viewport intro-toast-viewport-${toastPosition}`} aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <article key={toast.id} className={`intro-toast-card intro-toast-card-${toast.tone}`}>
            <div className="intro-toast-icon" aria-hidden="true">
              {toast.tone === 'success' && 'OK'}
              {toast.tone === 'error' && 'ERR'}
              {toast.tone === 'info' && 'INFO'}
              {toast.tone === 'warning' && 'WARN'}
            </div>

            <div className="intro-toast-copy">
              <p className="intro-toast-title">{toast.title}</p>
              <p className="intro-toast-message">{toast.message}</p>
            </div>

            <button type="button" className="intro-toast-close" onClick={() => removeToast(toast.id)} aria-label="Close toast">
              x
            </button>
          </article>
        ))}
      </div>

      <UiModal
        isOpen={isModalOpen}
        title="Create component blueprint"
        onClose={() => setIsModalOpen(false)}
        footer={
          <>
            <UiButton tone="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </UiButton>
            <UiButton tone="primary" onClick={() => setIsModalOpen(false)}>
              Save
            </UiButton>
          </>
        }
      >
        <div className="form-stack">
          <TextField label="Name" placeholder="OrderExecutionPanel" />
          <TextField label="Owner" placeholder="Platform Team" />
          <p className="dim">Press ESC, click outside, or use actions below to close this dialog.</p>
        </div>
      </UiModal>
    </main>
  );
};

export default IntroPage;
