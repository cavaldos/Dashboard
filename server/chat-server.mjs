import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';

import { WebSocketServer, WebSocket } from 'ws';

const CHAT_PORT = Number(process.env.CHAT_PORT ?? 8787);
const CHAT_HOST = process.env.CHAT_HOST ?? '0.0.0.0';
const CHAT_PATH = process.env.CHAT_PATH ?? '/ws/chat';

const peersBySocket = new Map();

const normalizeIp = (value) => {
  if (!value || typeof value !== 'string') {
    return 'unknown';
  }

  const trimmed = value.trim();

  if (trimmed.startsWith('::ffff:')) {
    return trimmed.slice(7);
  }

  if (trimmed === '::1') {
    return '127.0.0.1';
  }

  return trimmed;
};

const getRequestIp = (request) => {
  const forwardedFor = request.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.trim().length > 0) {
    const firstIp = forwardedFor.split(',')[0]?.trim();

    if (firstIp) {
      return normalizeIp(firstIp);
    }
  }

  return normalizeIp(request.socket.remoteAddress ?? 'unknown');
};

const serializePeer = (peer) => {
  return {
    id: peer.id,
    ip: peer.ip,
    connectedAt: peer.connectedAt,
  };
};

const sendJson = (socket, payload) => {
  if (socket.readyState !== WebSocket.OPEN) {
    return;
  }

  socket.send(JSON.stringify(payload));
};

const broadcastPresence = () => {
  const peers = [...peersBySocket.values()].map(serializePeer);
  const payload = {
    type: 'presence',
    peers,
  };

  for (const socket of peersBySocket.keys()) {
    sendJson(socket, payload);
  }
};

const server = createServer((request, response) => {
  if (request.url === '/health') {
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ ok: true, clients: peersBySocket.size, path: CHAT_PATH }));
    return;
  }

  response.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify({ ok: false, error: 'not_found' }));
});

const socketServer = new WebSocketServer({ server, path: CHAT_PATH });

socketServer.on('connection', (socket, request) => {
  const peer = {
    id: randomUUID(),
    ip: getRequestIp(request),
    connectedAt: Date.now(),
  };

  peersBySocket.set(socket, peer);

  sendJson(socket, {
    type: 'welcome',
    self: serializePeer(peer),
  });

  broadcastPresence();

  socket.on('message', (rawPayload) => {
    let payload;

    try {
      payload = JSON.parse(rawPayload.toString('utf8'));
    } catch {
      sendJson(socket, { type: 'chat:error', message: 'Invalid JSON payload.' });
      return;
    }

    if (!payload || typeof payload !== 'object' || payload.type !== 'chat:send') {
      return;
    }

    const toPeerId = typeof payload.toPeerId === 'string' ? payload.toPeerId.trim() : '';
    const content = typeof payload.content === 'string' ? payload.content.trim() : '';

    if (!toPeerId || !content) {
      sendJson(socket, { type: 'chat:error', message: 'Missing target peer or message content.' });
      return;
    }

    if (content.length > 1000) {
      sendJson(socket, { type: 'chat:error', message: 'Message too long (max 1000 chars).' });
      return;
    }

    const sender = peersBySocket.get(socket);

    if (!sender) {
      sendJson(socket, { type: 'chat:error', message: 'Unknown sender session.' });
      return;
    }

    const targetEntry = [...peersBySocket.entries()].find(([, candidatePeer]) => candidatePeer.id === toPeerId);

    if (!targetEntry) {
      sendJson(socket, { type: 'chat:error', message: 'Target peer is offline.' });
      return;
    }

    const [targetSocket, targetPeer] = targetEntry;

    if (targetSocket.readyState !== WebSocket.OPEN) {
      sendJson(socket, { type: 'chat:error', message: 'Target peer is not reachable.' });
      return;
    }

    sendJson(targetSocket, {
      type: 'chat:receive',
      message: {
        id: randomUUID(),
        fromPeerId: sender.id,
        fromIp: sender.ip,
        toPeerId: targetPeer.id,
        content,
        timestamp: Date.now(),
      },
    });
  });

  socket.on('close', () => {
    peersBySocket.delete(socket);
    broadcastPresence();
  });

  socket.on('error', () => {
    peersBySocket.delete(socket);
    broadcastPresence();
  });
});

server.listen(CHAT_PORT, CHAT_HOST, () => {
  console.log(`[chat-server] websocket listening on ws://${CHAT_HOST}:${CHAT_PORT}${CHAT_PATH}`);
});
