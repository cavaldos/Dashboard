import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';

import { LogPanel } from '~/components/UI/LogPanel';
import { Section } from '~/components/UI/Section';
import { WorldActivityMap } from '~/components/UI/WorldActivityMap';
import { cn } from '~/lib/utils';

type Peer = {
  id: string;
  ip: string;
  connectedAt: number;
};

type IncomingChatMessage = {
  id: string;
  fromPeerId: string;
  fromIp: string;
  toPeerId: string;
  content: string;
  timestamp: number;
};

type ThreadMessage = {
  id: string;
  direction: 'incoming' | 'outgoing';
  content: string;
  timestamp: number;
  fromIp?: string;
};

const CHAT_DEFAULT_PORT = 8787;
const CHAT_DEFAULT_PATH = '/ws/chat';
const CHAT_RECONNECT_DELAY_MS = 2000;
const CHAT_MAX_MESSAGE_LENGTH = 1000;

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const parsePeer = (value: unknown): Peer | null => {
  if (!isObjectRecord(value)) {
    return null;
  }

  const { id, ip, connectedAt } = value;

  if (typeof id !== 'string' || id.trim().length === 0) {
    return null;
  }

  if (typeof ip !== 'string' || ip.trim().length === 0) {
    return null;
  }

  if (typeof connectedAt !== 'number' || !Number.isFinite(connectedAt)) {
    return null;
  }

  return {
    id: id.trim(),
    ip: ip.trim(),
    connectedAt,
  };
};

const parseIncomingChatMessage = (value: unknown): IncomingChatMessage | null => {
  if (!isObjectRecord(value)) {
    return null;
  }

  const { id, fromPeerId, fromIp, toPeerId, content, timestamp } = value;

  if (typeof id !== 'string' || id.trim().length === 0) {
    return null;
  }

  if (typeof fromPeerId !== 'string' || fromPeerId.trim().length === 0) {
    return null;
  }

  if (typeof fromIp !== 'string' || fromIp.trim().length === 0) {
    return null;
  }

  if (typeof toPeerId !== 'string' || toPeerId.trim().length === 0) {
    return null;
  }

  if (typeof content !== 'string' || content.trim().length === 0) {
    return null;
  }

  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) {
    return null;
  }

  return {
    id: id.trim(),
    fromPeerId: fromPeerId.trim(),
    fromIp: fromIp.trim(),
    toPeerId: toPeerId.trim(),
    content: content.trim(),
    timestamp,
  };
};

const formatIp = (value: string) => {
  if (value.length <= 22) {
    return value;
  }

  return `${value.slice(0, 12)}...${value.slice(-8)}`;
};

const formatClock = (value: number) => {
  return new Date(value).toLocaleTimeString([], {
    hour12: false,
  });
};

const createLocalMessageId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const getDefaultSocketUrl = () => {
  if (typeof window === 'undefined') {
    return `ws://localhost:${CHAT_DEFAULT_PORT}${CHAT_DEFAULT_PATH}`;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const hostname = window.location.hostname || 'localhost';
  return `${protocol}://${hostname}:${CHAT_DEFAULT_PORT}${CHAT_DEFAULT_PATH}`;
};

const ChatPage = () => {
  const socketUrl = useMemo(() => {
    const envSocketUrl = import.meta.env.VITE_CHAT_WS_URL;

    if (typeof envSocketUrl === 'string' && envSocketUrl.trim().length > 0) {
      return envSocketUrl.trim();
    }

    return getDefaultSocketUrl();
  }, []);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const activePeerIdRef = useRef<string | null>(null);
  const selfPeerIdRef = useRef<string | null>(null);
  const shouldReconnectRef = useRef(true);
  const messageTailRef = useRef<HTMLDivElement | null>(null);

  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [socketError, setSocketError] = useState('');
  const [selfPeerId, setSelfPeerId] = useState<string | null>(null);
  const [selfIp, setSelfIp] = useState('Dang nhan dien...');
  const [peers, setPeers] = useState<Peer[]>([]);
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState('');
  const [threadsByPeerId, setThreadsByPeerId] = useState<Record<string, ThreadMessage[]>>({});
  const [unreadByPeerId, setUnreadByPeerId] = useState<Record<string, number>>({});

  const remotePeers = useMemo(() => {
    return peers
      .filter((peer) => peer.id !== selfPeerId)
      .sort((leftPeer, rightPeer) => leftPeer.connectedAt - rightPeer.connectedAt);
  }, [peers, selfPeerId]);

  const activePeerId = useMemo(() => {
    if (selectedPeerId && remotePeers.some((peer) => peer.id === selectedPeerId)) {
      return selectedPeerId;
    }

    return remotePeers[0]?.id ?? null;
  }, [remotePeers, selectedPeerId]);

  const activePeer = useMemo(() => {
    if (!activePeerId) {
      return null;
    }

    return remotePeers.find((peer) => peer.id === activePeerId) ?? null;
  }, [activePeerId, remotePeers]);

  const activeThread = useMemo(() => {
    if (!activePeerId) {
      return [];
    }

    return threadsByPeerId[activePeerId] ?? [];
  }, [activePeerId, threadsByPeerId]);

  useEffect(() => {
    activePeerIdRef.current = activePeerId;
  }, [activePeerId]);

  useEffect(() => {
    selfPeerIdRef.current = selfPeerId;
  }, [selfPeerId]);

  useEffect(() => {
    messageTailRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [activePeerId, activeThread.length]);

  useEffect(() => {
    shouldReconnectRef.current = true;

    const closeActiveSocket = () => {
      const activeSocket = socketRef.current;

      if (activeSocket) {
        activeSocket.close();
      }

      socketRef.current = null;
    };

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const connectSocket = () => {
      clearReconnectTimer();
      closeActiveSocket();
      setConnectionState('connecting');

      const socket = new WebSocket(socketUrl);
      socketRef.current = socket;

      socket.addEventListener('open', () => {
        setConnectionState('connected');
        setSocketError('');
      });

      socket.addEventListener('message', (event) => {
        if (typeof event.data !== 'string') {
          return;
        }

        let payload: unknown;

        try {
          payload = JSON.parse(event.data);
        } catch {
          return;
        }

        if (!isObjectRecord(payload) || typeof payload.type !== 'string') {
          return;
        }

        if (payload.type === 'welcome') {
          const selfPeer = parsePeer(payload.self);

          if (!selfPeer) {
            return;
          }

          setSelfPeerId(selfPeer.id);
          setSelfIp(selfPeer.ip);
          return;
        }

        if (payload.type === 'presence') {
          if (!Array.isArray(payload.peers)) {
            return;
          }

          const nextPeers = payload.peers.map(parsePeer).filter((peer): peer is Peer => peer !== null);
          setPeers(nextPeers);
          setUnreadByPeerId((previous) => {
            const nextPeerIds = new Set(
              nextPeers
                .filter((peer) => peer.id !== selfPeerIdRef.current)
                .map((peer) => peer.id),
            );
            const next: Record<string, number> = {};

            for (const [peerId, unreadCount] of Object.entries(previous)) {
              if (nextPeerIds.has(peerId) && unreadCount > 0) {
                next[peerId] = unreadCount;
              }
            }

            return next;
          });
          return;
        }

        if (payload.type === 'chat:receive') {
          const incomingMessage = parseIncomingChatMessage(payload.message);

          if (!incomingMessage) {
            return;
          }

          setThreadsByPeerId((previous) => {
            const currentThread = previous[incomingMessage.fromPeerId] ?? [];

            return {
              ...previous,
              [incomingMessage.fromPeerId]: [
                ...currentThread,
                {
                  id: incomingMessage.id,
                  direction: 'incoming',
                  content: incomingMessage.content,
                  timestamp: incomingMessage.timestamp,
                  fromIp: incomingMessage.fromIp,
                },
              ],
            };
          });

          if (activePeerIdRef.current !== incomingMessage.fromPeerId) {
            setUnreadByPeerId((previous) => ({
              ...previous,
              [incomingMessage.fromPeerId]: (previous[incomingMessage.fromPeerId] ?? 0) + 1,
            }));
          }

          return;
        }

        if (payload.type === 'chat:error' && typeof payload.message === 'string') {
          setSocketError(payload.message);
        }
      });

      socket.addEventListener('error', () => {
        setSocketError('Socket gap loi. Dang thu ket noi lai...');
      });

      socket.addEventListener('close', () => {
        if (socketRef.current === socket) {
          socketRef.current = null;
        }

        setConnectionState('disconnected');

        if (!shouldReconnectRef.current) {
          return;
        }

        reconnectTimerRef.current = window.setTimeout(() => {
          connectSocket();
        }, CHAT_RECONNECT_DELAY_MS);
      });
    };

    connectSocket();

    return () => {
      shouldReconnectRef.current = false;
      clearReconnectTimer();
      closeActiveSocket();
    };
  }, [socketUrl]);

  const handlePeerSelect = (peerId: string) => {
    setSelectedPeerId(peerId);
    setUnreadByPeerId((previous) => {
      if (!(peerId in previous)) {
        return previous;
      }

      const next = { ...previous };
      delete next[peerId];
      return next;
    });
  };

  const handleSendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!activePeerId) {
      setSocketError('Hay chon IP truoc khi gui tin nhan.');
      return;
    }

    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setSocketError('Socket chua ket noi. Vui long doi ket noi lai.');
      return;
    }

    const content = draftMessage.trim();

    if (!content) {
      return;
    }

    if (content.length > CHAT_MAX_MESSAGE_LENGTH) {
      setSocketError(`Tin nhan qua dai. Toi da ${CHAT_MAX_MESSAGE_LENGTH} ky tu.`);
      return;
    }

    const timestamp = Date.now();
    const localMessageId = createLocalMessageId();

    socket.send(
      JSON.stringify({
        type: 'chat:send',
        toPeerId: activePeerId,
        content,
      }),
    );

    setThreadsByPeerId((previous) => {
      const currentThread = previous[activePeerId] ?? [];

      return {
        ...previous,
        [activePeerId]: [
          ...currentThread,
          {
            id: localMessageId,
            direction: 'outgoing',
            content,
            timestamp,
          },
        ],
      };
    });

    setSocketError('');
    setDraftMessage('');
  };

  return (
    <main className="ui-shell">
      <div className="ui-container">
        <Section label="// trang thai chat">
          <LogPanel title="Trang thai ket noi socket" padded>
            <div className="chat-presence-summary">
              <div>
                <p className="chat-summary-label">Ket noi</p>
                <p className={cn('chat-summary-value', `is-${connectionState}`)}>{connectionState}</p>
              </div>

              <div>
                <p className="chat-summary-label">IP cua ban</p>
                <p className="chat-summary-value">{selfIp}</p>
              </div>

              <div>
                <p className="chat-summary-label">So peer online</p>
                <p className="chat-summary-value">{remotePeers.length}</p>
              </div>

              <div>
                <p className="chat-summary-label">Socket URL</p>
                <p className="chat-summary-url">{socketUrl}</p>
              </div>
            </div>

            {socketError ? <p className="chat-socket-error">{socketError}</p> : null}
          </LogPanel>
        </Section>

        <Section label="// world activity map (tai su dung)">
          <WorldActivityMap />
        </Section>

        <Section label="// click vao ip de chat">
          <div className="chat-layout-grid">
            <LogPanel
              title="Danh sach IP online"
              tags={[
                { label: `${remotePeers.length} peers`, dim: remotePeers.length === 0 },
                { label: connectionState.toUpperCase(), dim: connectionState !== 'connected' },
              ]}
            >
              <div className="chat-peer-list-shell">
                {remotePeers.length === 0 ? (
                  <p className="chat-empty-placeholder">
                    Chua co peer nao online. Hay mo trang nay tren may/trinh duyet khac va giu ca hai ben dang ket noi.
                  </p>
                ) : (
                  <ul className="chat-peer-list">
                    {remotePeers.map((peer) => {
                      const unreadCount = unreadByPeerId[peer.id] ?? 0;

                      return (
                        <li key={peer.id}>
                          <button
                            type="button"
                            className={cn('chat-peer-item', activePeerId === peer.id && 'is-active')}
                            onClick={() => handlePeerSelect(peer.id)}
                          >
                            <span className="chat-peer-main">
                              <strong>{formatIp(peer.ip)}</strong>
                              <span>{new Date(peer.connectedAt).toLocaleString()}</span>
                            </span>

                            {unreadCount > 0 ? <span className="chat-peer-unread">{unreadCount}</span> : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </LogPanel>

            <LogPanel title={activePeer ? `Hoi thoai: ${activePeer.ip}` : 'Hoi thoai'}>
              <div className="chat-thread-shell">
                <div className="chat-thread-messages">
                  {activePeer ? (
                    activeThread.length > 0 ? (
                      activeThread.map((message) => (
                        <article
                          key={message.id}
                          className={cn(
                            'chat-bubble',
                            message.direction === 'outgoing' ? 'is-outgoing' : 'is-incoming',
                          )}
                        >
                          <p>{message.content}</p>
                          <footer>
                            <span>
                              {message.direction === 'incoming' && message.fromIp ? formatIp(message.fromIp) : 'You'}
                            </span>
                            <span>{formatClock(message.timestamp)}</span>
                          </footer>
                        </article>
                      ))
                    ) : (
                      <p className="chat-empty-placeholder">Chua co tin nhan. Hay gui tin dau tien de bat dau chat.</p>
                    )
                  ) : (
                    <p className="chat-empty-placeholder">Hay chon 1 IP ben trai de mo chat truc tiep.</p>
                  )}

                  <div ref={messageTailRef} />
                </div>

                <form className="chat-compose-form" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    placeholder={activePeer ? `Nhan tin toi ${activePeer.ip}` : 'Chon IP de bat dau chat'}
                    maxLength={CHAT_MAX_MESSAGE_LENGTH}
                    disabled={!activePeer || connectionState !== 'connected'}
                    autoComplete="off"
                  />

                  <button type="submit" disabled={!activePeer || connectionState !== 'connected' || !draftMessage.trim()}>
                    Gui
                  </button>
                </form>
              </div>
            </LogPanel>
          </div>
        </Section>
      </div>
    </main>
  );
};

export default ChatPage;
