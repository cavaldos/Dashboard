import { useEffect, useRef, useState } from 'react';
import '~/style/link-preview-panel.css';

export type LinkPreviewItem = {
  id: string;
  label: string;
  description: string;
  url: string;
  previewMode?: 'iframe' | 'snapshot';
  snapshotUrl?: string;
  snapshotThumbUrl?: string;
};

type LinkPreviewPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  align: 'left' | 'right';
};

type LinkPreviewPanelProps = {
  links: LinkPreviewItem[];
  description?: string;
  hint?: string;
  title?: string;
};

export function LinkPreviewPanel({
  links,
  description = 'Hover a link to open a modal-like website preview.',
  hint = 'Tip: many external sites block iframe. This preview loads a lightweight snapshot first, then upgrades to full-page quality.',
  title = 'Quick Preview',
}: LinkPreviewPanelProps) {
  const [activePreview, setActivePreview] = useState<LinkPreviewItem | null>(null);
  const [previewPosition, setPreviewPosition] = useState<LinkPreviewPosition | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [activeSnapshotSrc, setActiveSnapshotSrc] = useState<string | null>(null);

  const closeTimeoutRef = useRef<number | null>(null);
  const loadRequestIdRef = useRef(0);
  const loadedSnapshotSetRef = useRef(new Set<string>());

  const cancelScheduledClose = () => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const closePreview = () => {
    cancelScheduledClose();
    loadRequestIdRef.current += 1;
    setActivePreview(null);
    setPreviewPosition(null);
    setIsPreviewLoading(false);
    setActiveSnapshotSrc(null);
  };

  const scheduleClose = () => {
    cancelScheduledClose();

    closeTimeoutRef.current = window.setTimeout(() => {
      loadRequestIdRef.current += 1;
      setActivePreview(null);
      setPreviewPosition(null);
      setIsPreviewLoading(false);
      setActiveSnapshotSrc(null);
      closeTimeoutRef.current = null;
    }, 180);
  };

  const openPreview = (link: LinkPreviewItem, anchorNode: HTMLElement) => {
    cancelScheduledClose();

    const anchorRect = anchorNode.getBoundingClientRect();
    const viewportPadding = 12;
    const hoverGap = 14;
    const previewWidth = Math.min(420, Math.max(260, window.innerWidth - viewportPadding * 2));
    const canPlaceRight = anchorRect.right + hoverGap + previewWidth <= window.innerWidth - viewportPadding;
    const left = canPlaceRight
      ? anchorRect.right + hoverGap
      : Math.max(viewportPadding, anchorRect.left - hoverGap - previewWidth);
    const maxHeight = Math.max(280, Math.min(560, window.innerHeight - viewportPadding * 2));
    const top = Math.min(Math.max(viewportPadding, anchorRect.top - 8), window.innerHeight - maxHeight - viewportPadding);

    setActivePreview(link);
    setPreviewPosition({
      top,
      left,
      width: previewWidth,
      maxHeight,
      align: canPlaceRight ? 'right' : 'left',
    });

    if (link.previewMode === 'snapshot' && link.snapshotUrl) {
      const requestId = loadRequestIdRef.current + 1;
      loadRequestIdRef.current = requestId;
      const quickSnapshotSrc = link.snapshotThumbUrl ?? link.snapshotUrl;
      const fullSnapshotSrc = link.snapshotUrl;

      const loadFullSnapshot = () => {
        if (quickSnapshotSrc === fullSnapshotSrc || loadedSnapshotSetRef.current.has(fullSnapshotSrc)) {
          if (loadedSnapshotSetRef.current.has(fullSnapshotSrc) && loadRequestIdRef.current === requestId) {
            setActiveSnapshotSrc(fullSnapshotSrc);
          }

          return;
        }

        const fullImage = new Image();
        fullImage.src = fullSnapshotSrc;
        fullImage.onload = () => {
          loadedSnapshotSetRef.current.add(fullSnapshotSrc);

          if (loadRequestIdRef.current !== requestId) {
            return;
          }

          setActiveSnapshotSrc(fullSnapshotSrc);
        };
      };

      setActiveSnapshotSrc(quickSnapshotSrc);

      if (loadedSnapshotSetRef.current.has(quickSnapshotSrc)) {
        setIsPreviewLoading(false);
        loadFullSnapshot();
      } else {
        setIsPreviewLoading(true);

        const quickImage = new Image();
        quickImage.src = quickSnapshotSrc;
        quickImage.onload = () => {
          loadedSnapshotSetRef.current.add(quickSnapshotSrc);

          if (loadRequestIdRef.current !== requestId) {
            return;
          }

          setIsPreviewLoading(false);
          loadFullSnapshot();
        };

        quickImage.onerror = () => {
          if (loadRequestIdRef.current !== requestId) {
            return;
          }

          setIsPreviewLoading(false);
          loadFullSnapshot();
        };
      }

      if (loadedSnapshotSetRef.current.has(fullSnapshotSrc)) {
        setActiveSnapshotSrc(fullSnapshotSrc);
        setIsPreviewLoading(false);
      }

      return;
    }

    setActiveSnapshotSrc(null);
    setIsPreviewLoading(true);
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!activePreview) {
      return;
    }

    const dismissPreview = () => {
      cancelScheduledClose();
      loadRequestIdRef.current += 1;
      setActivePreview(null);
      setPreviewPosition(null);
      setIsPreviewLoading(false);
      setActiveSnapshotSrc(null);
    };

    window.addEventListener('resize', dismissPreview);
    window.addEventListener('scroll', dismissPreview, true);

    return () => {
      window.removeEventListener('resize', dismissPreview);
      window.removeEventListener('scroll', dismissPreview, true);
    };
  }, [activePreview]);

  useEffect(() => {
    const snapshotLinks = links.filter((link) => link.previewMode === 'snapshot');

    snapshotLinks.forEach((link) => {
      const quickSnapshotSrc = link.snapshotThumbUrl ?? link.snapshotUrl;

      if (!quickSnapshotSrc || loadedSnapshotSetRef.current.has(quickSnapshotSrc)) {
        return;
      }

      const quickImage = new Image();
      quickImage.src = quickSnapshotSrc;
      quickImage.onload = () => {
        loadedSnapshotSetRef.current.add(quickSnapshotSrc);
      };
    });
  }, [links]);

  return (
    <>
      <div className="link-preview-panel">
        <p className="msg">{description}</p>

        <ul className="link-preview-list">
          {links.map((link) => (
            <li key={link.id} className="link-preview-item">
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="link-preview-link"
                onMouseEnter={(event) => openPreview(link, event.currentTarget)}
                onMouseLeave={scheduleClose}
                onFocus={(event) => openPreview(link, event.currentTarget)}
                onBlur={scheduleClose}
              >
                {link.label}
              </a>
              <span className="link-preview-meta">{link.description}</span>
            </li>
          ))}
        </ul>

        <p className="dim">{hint}</p>
      </div>

      {activePreview && previewPosition && (
        <aside
          className={`link-preview-popover link-preview-popover-${previewPosition.align}`}
          style={{
            top: `${previewPosition.top}px`,
            left: `${previewPosition.left}px`,
            width: `${previewPosition.width}px`,
            maxHeight: `${previewPosition.maxHeight}px`,
          }}
          onMouseEnter={cancelScheduledClose}
          onMouseLeave={scheduleClose}
          role="dialog"
          aria-label={`Quick preview for ${activePreview.label}`}
        >
          <header className="link-preview-head">
            <div className="link-preview-head-copy">
              <p className="link-preview-kicker">{title}</p>
              <p className="link-preview-title">{activePreview.label}</p>
            </div>

            <div className="link-preview-head-actions">
              <a href={activePreview.url} target="_blank" rel="noreferrer" className="link-preview-open-link">
                Open
              </a>
              <button type="button" className="link-preview-close" onClick={closePreview} aria-label="Close preview">
                x
              </button>
            </div>
          </header>

          <div className="link-preview-frame-shell">
            {isPreviewLoading && <div className="link-preview-loading">Loading website preview...</div>}

            {activePreview.previewMode === 'snapshot' && activePreview.snapshotUrl ? (
              <div className="link-preview-snapshot-wrap" tabIndex={0}>
                <img
                  src={activeSnapshotSrc ?? activePreview.snapshotThumbUrl ?? activePreview.snapshotUrl}
                  alt={`Snapshot preview of ${activePreview.label}`}
                  className="link-preview-snapshot"
                  loading="eager"
                  fetchPriority="high"
                  onLoad={(event) => {
                    loadedSnapshotSetRef.current.add(event.currentTarget.currentSrc);
                    setIsPreviewLoading(false);
                  }}
                  onError={() => setIsPreviewLoading(false)}
                />
              </div>
            ) : (
              <iframe
                src={activePreview.url}
                title={`Website preview: ${activePreview.label}`}
                className="link-preview-frame"
                loading="lazy"
                referrerPolicy="no-referrer"
                onLoad={() => setIsPreviewLoading(false)}
                onError={() => setIsPreviewLoading(false)}
              />
            )}
          </div>
        </aside>
      )}
    </>
  );
}
