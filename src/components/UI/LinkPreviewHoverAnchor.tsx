import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { LinkPreviewItem } from '~/components/UI/LinkPreviewPanel';
import '~/style/link-preview-panel.css';

type LinkPreviewPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  align: 'left' | 'right';
};

type LinkPreviewHoverAnchorProps = {
  link: LinkPreviewItem;
  className?: string;
  children: ReactNode;
  delayMs?: number;
  ariaLabel?: string;
};

export function LinkPreviewHoverAnchor({
  link,
  className,
  children,
  delayMs = 2000,
  ariaLabel,
}: LinkPreviewHoverAnchorProps) {
  const [previewPosition, setPreviewPosition] = useState<LinkPreviewPosition | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [activeSnapshotSrc, setActiveSnapshotSrc] = useState<string | null>(null);

  const closeTimeoutRef = useRef<number | null>(null);
  const openTimeoutRef = useRef<number | null>(null);
  const loadRequestIdRef = useRef(0);
  const loadedSnapshotSetRef = useRef(new Set<string>());

  const isOpen = previewPosition !== null;

  const cancelScheduledOpen = () => {
    if (openTimeoutRef.current !== null) {
      window.clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
  };

  const cancelScheduledClose = () => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const closePreview = () => {
    cancelScheduledOpen();
    cancelScheduledClose();
    loadRequestIdRef.current += 1;
    setPreviewPosition(null);
    setIsPreviewLoading(false);
    setActiveSnapshotSrc(null);
  };

  const scheduleClose = () => {
    cancelScheduledClose();

    closeTimeoutRef.current = window.setTimeout(() => {
      closePreview();
    }, 180);
  };

  const openPreview = (anchorNode: HTMLElement) => {
    cancelScheduledOpen();
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

  const scheduleOpen = (anchorNode: HTMLElement) => {
    cancelScheduledOpen();
    cancelScheduledClose();

    openTimeoutRef.current = window.setTimeout(() => {
      openPreview(anchorNode);
    }, delayMs);
  };

  useEffect(() => {
    if (link.previewMode !== 'snapshot') {
      return;
    }

    const quickSnapshotSrc = link.snapshotThumbUrl ?? link.snapshotUrl;
    if (!quickSnapshotSrc || loadedSnapshotSetRef.current.has(quickSnapshotSrc)) {
      return;
    }

    const quickImage = new Image();
    quickImage.src = quickSnapshotSrc;
    quickImage.onload = () => {
      loadedSnapshotSetRef.current.add(quickSnapshotSrc);
    };
  }, [link.previewMode, link.snapshotThumbUrl, link.snapshotUrl]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const dismissPreview = () => {
      cancelScheduledOpen();
      cancelScheduledClose();
      loadRequestIdRef.current += 1;
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
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }

      if (openTimeoutRef.current !== null) {
        window.clearTimeout(openTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <a
        href={link.url}
        target="_blank"
        rel="noreferrer"
        className={className}
        aria-label={ariaLabel}
        onMouseEnter={(event) => scheduleOpen(event.currentTarget)}
        onMouseLeave={() => {
          cancelScheduledOpen();
          if (isOpen) {
            scheduleClose();
          }
        }}
        onFocus={(event) => scheduleOpen(event.currentTarget)}
        onBlur={() => {
          cancelScheduledOpen();
          if (isOpen) {
            scheduleClose();
          }
        }}
      >
        {children}
      </a>

      {previewPosition && (
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
          aria-label={`Quick preview for ${link.label}`}
        >
          <header className="link-preview-head">
            <div className="link-preview-head-copy">
              <p className="link-preview-kicker">Quick Preview</p>
              <p className="link-preview-title">{link.label}</p>
            </div>

            <div className="link-preview-head-actions">
              <a href={link.url} target="_blank" rel="noreferrer" className="link-preview-open-link">
                Open
              </a>
              <button type="button" className="link-preview-close" onClick={closePreview} aria-label="Close preview">
                x
              </button>
            </div>
          </header>

          <div className="link-preview-frame-shell">
            {isPreviewLoading && <div className="link-preview-loading">Loading website preview...</div>}

            {link.previewMode === 'snapshot' && link.snapshotUrl ? (
              <div className="link-preview-snapshot-wrap" tabIndex={0}>
                <img
                  src={activeSnapshotSrc ?? link.snapshotThumbUrl ?? link.snapshotUrl}
                  alt={`Snapshot preview of ${link.label}`}
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
                src={link.url}
                title={`Website preview: ${link.label}`}
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
