import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ComposableMap, Geographies, Geography, Line, Marker, ZoomableGroup } from 'react-simple-maps';

import { cn } from '~/lib/utils';

type Coordinates = [number, number];

type MapNode = {
  id: string;
  label: string;
  region: string;
  coordinates: Coordinates;
  value: number;
};

type MapConnection = {
  id: string;
  from: string;
  to: string;
};

type ResolvedConnection = {
  id: string;
  from: MapNode;
  to: MapNode;
};

type FreeIpApiLookupResponse = {
  ipAddress?: string;
  cityName?: string | null;
  countryName?: string | null;
  latitude?: number;
  longitude?: number;
  asnOrganization?: string | null;
};

type GeolocationDbLookupResponse = {
  IPv4?: string;
  city?: string | null;
  country_name?: string | null;
  latitude?: number;
  longitude?: number;
};

type TrackedIpLocation = {
  ip: string;
  city: string;
  country: string;
  isp: string;
  coordinates: Coordinates;
};

type AirplanesLiveAircraft = {
  hex?: string;
  flight?: string | null;
  r?: string | null;
  lat?: number | null;
  lon?: number | null;
  gs?: number | null;
  track?: number | null;
  seen_pos?: number | null;
  seen?: number | null;
  alt_baro?: number | string | null;
};

type AirplanesLivePointResponse = {
  now?: number;
  ac?: AirplanesLiveAircraft[] | null;
};

type FlightSnapshot = {
  icao24: string;
  callsign: string;
  originCountry: string;
  coordinates: Coordinates;
  velocity: number | null;
  trueTrack: number | null;
  lastContact: number;
};

type FlightTrack = FlightSnapshot & {
  trail: Coordinates[];
};

const WORLD_GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const MAP_NODES: MapNode[] = [
  { id: 'N1', label: 'New York', region: 'North America', coordinates: [-74.006, 40.7128], value: 128000 },
  { id: 'N2', label: 'Mexico City', region: 'North America', coordinates: [-99.1332, 19.4326], value: 74000 },
  { id: 'N3', label: 'Sao Paulo', region: 'South America', coordinates: [-46.6333, -23.5505], value: 61000 },
  { id: 'E1', label: 'London', region: 'Europe', coordinates: [-0.1276, 51.5072], value: 98000 },
  { id: 'E2', label: 'Lagos', region: 'Africa', coordinates: [3.3792, 6.5244], value: 47000 },
  { id: 'M1', label: 'Dubai', region: 'Middle East', coordinates: [55.2708, 25.2048], value: 83000 },
  { id: 'A1', label: 'Mumbai', region: 'Asia', coordinates: [72.8777, 19.076], value: 91000 },
  { id: 'A2', label: 'Singapore', region: 'Asia', coordinates: [103.8198, 1.3521], value: 88000 },
  { id: 'A3', label: 'Tokyo', region: 'Asia', coordinates: [139.6917, 35.6895], value: 112000 },
  { id: 'O1', label: 'Sydney', region: 'Oceania', coordinates: [151.2093, -33.8688], value: 54000 },
  { id: 'V0', label: 'Ho Chi Minh City', region: 'Asia', coordinates: [106.6297, 10.8231], value: 68000 },
];

const COUNTRY_LABELS: MapNode[] = [
  { id: 'USA', label: 'United States', region: 'North America', coordinates: [-95.7129, 37.0902], value: 0 },
  { id: 'BRA', label: 'Brazil', region: 'South America', coordinates: [-51.9253, -14.235], value: 0 },
  { id: 'RUS', label: 'Russia', region: 'Europe', coordinates: [105.3188, 61.524], value: 0 },
  { id: 'CHN', label: 'China', region: 'Asia', coordinates: [104.1954, 35.8617], value: 0 },
  { id: 'AUS', label: 'Australia', region: 'Oceania', coordinates: [133.7751, -25.2744], value: 0 },
  { id: 'IND', label: 'India', region: 'Asia', coordinates: [78.9629, 20.5937], value: 0 },
  { id: 'GBR', label: 'United Kingdom', region: 'Europe', coordinates: [-3.436, 55.3781], value: 0 },
  { id: 'FRA', label: 'France', region: 'Europe', coordinates: [2.2137, 46.2276], value: 0 },
  { id: 'DEU', label: 'Germany', region: 'Europe', coordinates: [10.4515, 51.1657], value: 0 },
  { id: 'ZAF', label: 'South Africa', region: 'Africa', coordinates: [22.9375, -30.5595], value: 0 },
  { id: 'EGY', label: 'Egypt', region: 'Africa', coordinates: [30.8025, 26.8206], value: 0 },
  { id: 'SAU', label: 'Saudi Arabia', region: 'Middle East', coordinates: [45.0792, 23.8859], value: 0 },
  { id: 'IDN', label: 'Indonesia', region: 'Asia', coordinates: [113.9213, -0.7893], value: 0 },
  { id: 'CAN', label: 'Canada', region: 'North America', coordinates: [-106.3468, 56.1304], value: 0 },
  { id: 'MEX', label: 'Mexico', region: 'North America', coordinates: [-102.5528, 23.6345], value: 0 },
  { id: 'VNM', label: 'Vietnam', region: 'Asia', coordinates: [108.2772, 14.0583], value: 0 },
];

const MAP_CONNECTIONS: MapConnection[] = [
  { id: 'c-1', from: 'N1', to: 'E1' },
  { id: 'c-2', from: 'N1', to: 'N2' },
  { id: 'c-3', from: 'N2', to: 'N3' },
  { id: 'c-4', from: 'E1', to: 'M1' },
  { id: 'c-5', from: 'M1', to: 'A1' },
  { id: 'c-6', from: 'A1', to: 'A2' },
  { id: 'c-7', from: 'A2', to: 'A3' },
  { id: 'c-8', from: 'A2', to: 'O1' },
  { id: 'c-9', from: 'E1', to: 'E2' },
  { id: 'c-10', from: 'N3', to: 'E2' },
  { id: 'c-11', from: 'E2', to: 'V0' },
];

const IP_LOOKUP_PROVIDERS = [lookupFromFreeIpApi, lookupFromGeolocationDb] as const;

const AIRPLANES_LIVE_POINT_URL = 'https://api.airplanes.live/v2/point';
const AIRPLANES_LIVE_QUERY_POINTS: Coordinates[] = [
  [-74.006, 40.7128],
  [-118.2437, 34.0522],
  [-46.6333, -23.5505],
  [-0.1276, 51.5072],
  [55.2708, 25.2048],
  [103.8198, 1.3521],
  [139.6917, 35.6895],
  [151.2093, -33.8688],
];
const AIRPLANES_LIVE_QUERY_RADIUS_NM = 250;
const KNOT_TO_METERS_PER_SECOND = 0.514444;
const FLIGHT_POLL_INTERVAL_MS = 60000;
const FLIGHT_RATE_LIMIT_FALLBACK_MS = 120000;
const FLIGHT_MAX_BACKOFF_MS = 10 * 60 * 1000;
const MAX_VISIBLE_FLIGHT_TRACKS = 90;
const MAX_FLIGHT_TRAIL_POINTS = 12;
const FLIGHT_MIN_VELOCITY_MS = 45;
const FLIGHT_TRAIL_EPSILON = 0.02;
const ZOOM_THRESHOLD_FOR_LABELS = 2;

const MAX_IP_LOOKUP_BATCH = 20;

const metricFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1,
});

const isLikelyIpAddress = (value: string) => {
  const ipv4Pattern = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
  const ipv6Pattern = /^[0-9a-fA-F:]+$/;

  return ipv4Pattern.test(value) || (value.includes(':') && ipv6Pattern.test(value));
};

const formatIpLabel = (ip: string) => (ip.length > 14 ? `${ip.slice(0, 6)}...${ip.slice(-4)}` : ip);

const normalizeText = (value: string | null | undefined, fallback: string) => {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : fallback;
};

const fetchLookupPayload = async <T,>(url: string, signal: AbortSignal) => {
  const response = await fetch(url, {
    method: 'GET',
    signal,
    headers: {
      Accept: 'application/json',
    },
  });

  if (response.status === 403) {
    throw new Error('lookup_blocked');
  }

  if (response.status === 429) {
    throw new Error('lookup_rate_limited');
  }

  if (!response.ok) {
    throw new Error('lookup_unavailable');
  }

  return (await response.json()) as T;
};

async function lookupFromFreeIpApi(ip: string, signal: AbortSignal): Promise<TrackedIpLocation | null> {
  const payload = await fetchLookupPayload<FreeIpApiLookupResponse>(
    `https://free.freeipapi.com/api/json/${encodeURIComponent(ip)}`,
    signal,
  );

  if (typeof payload.latitude !== 'number' || !Number.isFinite(payload.latitude)) {
    return null;
  }

  if (typeof payload.longitude !== 'number' || !Number.isFinite(payload.longitude)) {
    return null;
  }

  return {
    ip: normalizeText(payload.ipAddress, ip),
    city: normalizeText(payload.cityName, 'Unknown city'),
    country: normalizeText(payload.countryName, 'Unknown country'),
    isp: normalizeText(payload.asnOrganization, 'Unknown network'),
    coordinates: [payload.longitude, payload.latitude],
  };
}

async function lookupFromGeolocationDb(ip: string, signal: AbortSignal): Promise<TrackedIpLocation | null> {
  const payload = await fetchLookupPayload<GeolocationDbLookupResponse>(
    `https://geolocation-db.com/json/${encodeURIComponent(ip)}&position=true`,
    signal,
  );

  if (typeof payload.latitude !== 'number' || !Number.isFinite(payload.latitude)) {
    return null;
  }

  if (typeof payload.longitude !== 'number' || !Number.isFinite(payload.longitude)) {
    return null;
  }

  return {
    ip: normalizeText(payload.IPv4, ip),
    city: normalizeText(payload.city, 'Unknown city'),
    country: normalizeText(payload.country_name, 'Unknown country'),
    isp: 'Unknown network',
    coordinates: [payload.longitude, payload.latitude],
  };
}

const parseIpInput = (input: string) => {
  const uniqueIps = new Set<string>();

  input
    .split(/[\s,;]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((ip) => uniqueIps.add(ip));

  return [...uniqueIps];
};

const summarizeIpList = (ips: string[]) => {
  if (ips.length <= 3) {
    return ips.join(', ');
  }

  return `${ips.slice(0, 3).join(', ')} +${ips.length - 3} more`;
};

const lookupIpWithFallback = async (ip: string, signal: AbortSignal): Promise<TrackedIpLocation | null> => {
  let blockedAttempts = 0;
  let rateLimitedAttempts = 0;

  for (const lookupProvider of IP_LOOKUP_PROVIDERS) {
    try {
      const resolvedLocation = await lookupProvider(ip, signal);

      if (resolvedLocation) {
        return resolvedLocation;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }

      if (error instanceof Error && error.message === 'lookup_blocked') {
        blockedAttempts += 1;
        continue;
      }

      if (error instanceof Error && error.message === 'lookup_rate_limited') {
        rateLimitedAttempts += 1;
        continue;
      }
    }
  }

  if (rateLimitedAttempts >= IP_LOOKUP_PROVIDERS.length) {
    throw new Error('lookup_rate_limited');
  }

  if (blockedAttempts >= IP_LOOKUP_PROVIDERS.length) {
    throw new Error('lookup_blocked');
  }

  return null;
};

const buildAirplanesLivePointUrl = (coordinates: Coordinates) => {
  const [longitude, latitude] = coordinates;
  return `${AIRPLANES_LIVE_POINT_URL}/${latitude}/${longitude}/${AIRPLANES_LIVE_QUERY_RADIUS_NM}`;
};

const parseAirplanesLiveSnapshots = (payload: AirplanesLivePointResponse): FlightSnapshot[] => {
  if (!Array.isArray(payload.ac)) {
    return [];
  }

  const nowMs = typeof payload.now === 'number' && Number.isFinite(payload.now) ? payload.now : Date.now();
  const fallbackTimestamp = Math.floor(nowMs / 1000);

  const snapshots = payload.ac.reduce<FlightSnapshot[]>((accumulator, aircraft) => {
    const icao24 = typeof aircraft.hex === 'string' ? aircraft.hex.trim().toLowerCase() : '';
    const longitude = typeof aircraft.lon === 'number' && Number.isFinite(aircraft.lon) ? aircraft.lon : null;
    const latitude = typeof aircraft.lat === 'number' && Number.isFinite(aircraft.lat) ? aircraft.lat : null;
    const groundSpeedKnots = typeof aircraft.gs === 'number' && Number.isFinite(aircraft.gs) ? aircraft.gs : null;
    const velocity = groundSpeedKnots === null ? null : groundSpeedKnots * KNOT_TO_METERS_PER_SECOND;
    const trueTrack = typeof aircraft.track === 'number' && Number.isFinite(aircraft.track) ? aircraft.track : null;
    const seenSeconds =
      typeof aircraft.seen_pos === 'number' && Number.isFinite(aircraft.seen_pos)
        ? aircraft.seen_pos
        : typeof aircraft.seen === 'number' && Number.isFinite(aircraft.seen)
          ? aircraft.seen
          : null;
    const lastContact = seenSeconds === null ? fallbackTimestamp : Math.floor((nowMs - Math.max(0, seenSeconds) * 1000) / 1000);
    const onGround = typeof aircraft.alt_baro === 'string' && aircraft.alt_baro.toLowerCase() === 'ground';

    if (!icao24 || longitude === null || latitude === null || onGround) {
      return accumulator;
    }

    if (velocity !== null && velocity < FLIGHT_MIN_VELOCITY_MS) {
      return accumulator;
    }

    const callsign =
      typeof aircraft.flight === 'string' && aircraft.flight.trim().length > 0
        ? aircraft.flight.trim()
        : typeof aircraft.r === 'string' && aircraft.r.trim().length > 0
          ? aircraft.r.trim()
          : icao24.toUpperCase();
    const originCountry = 'Unknown';

    accumulator.push({
      icao24,
      callsign,
      originCountry,
      coordinates: [longitude, latitude],
      velocity,
      trueTrack,
      lastContact,
    });

    return accumulator;
  }, []);

  snapshots.sort((left, right) => (right.velocity ?? 0) - (left.velocity ?? 0));

  return snapshots;
};

const dedupeFlightSnapshots = (snapshots: FlightSnapshot[]) => {
  const snapshotByIcao = new Map<string, FlightSnapshot>();

  for (const snapshot of snapshots) {
    const existingSnapshot = snapshotByIcao.get(snapshot.icao24);

    if (!existingSnapshot) {
      snapshotByIcao.set(snapshot.icao24, snapshot);
      continue;
    }

    if (snapshot.lastContact > existingSnapshot.lastContact) {
      snapshotByIcao.set(snapshot.icao24, snapshot);
      continue;
    }

    if (snapshot.lastContact === existingSnapshot.lastContact && (snapshot.velocity ?? 0) > (existingSnapshot.velocity ?? 0)) {
      snapshotByIcao.set(snapshot.icao24, snapshot);
    }
  }

  return [...snapshotByIcao.values()];
};

const appendTrailPoint = (trail: Coordinates[], nextPoint: Coordinates) => {
  const lastPoint = trail[trail.length - 1];

  if (
    lastPoint &&
    Math.abs(lastPoint[0] - nextPoint[0]) <= FLIGHT_TRAIL_EPSILON &&
    Math.abs(lastPoint[1] - nextPoint[1]) <= FLIGHT_TRAIL_EPSILON
  ) {
    return trail;
  }

  const nextTrail = [...trail, nextPoint];
  return nextTrail.length > MAX_FLIGHT_TRAIL_POINTS
    ? nextTrail.slice(nextTrail.length - MAX_FLIGHT_TRAIL_POINTS)
    : nextTrail;
};

const mergeFlightTracks = (previousTracks: FlightTrack[], snapshots: FlightSnapshot[]) => {
  const snapshotByIcao = new Map(snapshots.map((snapshot) => [snapshot.icao24, snapshot]));
  const nextTracks: FlightTrack[] = [];

  for (const previousTrack of previousTracks) {
    if (nextTracks.length >= MAX_VISIBLE_FLIGHT_TRACKS) {
      break;
    }

    const latestSnapshot = snapshotByIcao.get(previousTrack.icao24);

    if (!latestSnapshot) {
      continue;
    }

    snapshotByIcao.delete(previousTrack.icao24);

    nextTracks.push({
      ...latestSnapshot,
      trail: appendTrailPoint(previousTrack.trail, latestSnapshot.coordinates),
    });
  }

  if (nextTracks.length < MAX_VISIBLE_FLIGHT_TRACKS) {
    const incomingSnapshots = [...snapshotByIcao.values()]
      .sort((left, right) => (right.velocity ?? 0) - (left.velocity ?? 0))
      .slice(0, MAX_VISIBLE_FLIGHT_TRACKS - nextTracks.length);

    for (const snapshot of incomingSnapshots) {
      nextTracks.push({
        ...snapshot,
        trail: [snapshot.coordinates],
      });
    }
  }

  return nextTracks
    .sort((left, right) => (right.velocity ?? 0) - (left.velocity ?? 0))
    .slice(0, MAX_VISIBLE_FLIGHT_TRACKS);
};

const formatFlightSpeed = (velocity: number | null) => {
  if (velocity === null) {
    return 'Speed unavailable';
  }

  return `${Math.round(velocity * 3.6)} km/h`;
};

const formatFlightSpeedCompact = (velocity: number | null) => {
  if (velocity === null) {
    return '--';
  }

  return `${Math.round(velocity * 3.6)} km/h`;
};

const formatSyncClock = (timestamp: number | null) => {
  if (timestamp === null) {
    return '--:--:--';
  }

  return new Date(timestamp).toLocaleTimeString([], { hour12: false });
};

const parseRetryAfterMs = (retryAfterHeader: string | null) => {
  if (!retryAfterHeader) {
    return null;
  }

  const retryAfterSeconds = Number(retryAfterHeader);

  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return Math.round(retryAfterSeconds * 1000);
  }

  const retryTimestamp = Date.parse(retryAfterHeader);

  if (Number.isFinite(retryTimestamp)) {
    const remainingMs = retryTimestamp - Date.now();

    if (remainingMs > 0) {
      return remainingMs;
    }
  }

  return null;
};

const getGeographyName = (geo: unknown) => {
  if (typeof geo !== 'object' || geo === null) {
    return 'Unknown';
  }

  const geography = geo as {
    id?: string | number;
    properties?: Record<string, unknown>;
  };

  const properties = geography.properties;

  if (properties && typeof properties === 'object') {
    const nameCandidates = [
      properties.name,
      properties.NAME,
      properties.admin,
      properties.ADMIN,
      properties.NAME_LONG,
      properties.formal_en,
    ];

    for (const candidate of nameCandidates) {
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate.trim();
      }
    }
  }

  if (geography.id !== undefined && geography.id !== null) {
    return `Country ${String(geography.id)}`;
  }

  return 'Unknown';
};

export const WorldActivityMap = () => {
  const mapShellRef = useRef<HTMLElement | null>(null);
  const mapStageRef = useRef<HTMLDivElement | null>(null);

  const [mapZoomLevel, setMapZoomLevel] = useState(1);

  const [activeNodeId, setActiveNodeId] = useState(MAP_NODES[0]?.id ?? '');

  const [ipInput, setIpInput] = useState('');
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [trackedIpLocations, setTrackedIpLocations] = useState<TrackedIpLocation[]>([]);
  const [activeTrackedIp, setActiveTrackedIp] = useState<string | null>(null);

  const [isFlightsEnabled, setIsFlightsEnabled] = useState(false);
  const [isFlightsSyncing, setIsFlightsSyncing] = useState(false);
  const [flightSyncError, setFlightSyncError] = useState('');
  const [flightTracks, setFlightTracks] = useState<FlightTrack[]>([]);
  const [activeFlightIcao, setActiveFlightIcao] = useState<string | null>(null);
  const [lastFlightSyncAt, setLastFlightSyncAt] = useState<number | null>(null);
  const [hoveredCountryName, setHoveredCountryName] = useState('');

  const nodeById = useMemo(
    () => Object.fromEntries(MAP_NODES.map((node) => [node.id, node])) as Record<string, MapNode>,
    [],
  );

  const resolvedConnections = useMemo(
    () =>
      MAP_CONNECTIONS.reduce<ResolvedConnection[]>((accumulator, edge) => {
        const fromNode = nodeById[edge.from];
        const toNode = nodeById[edge.to];

        if (fromNode && toNode) {
          accumulator.push({ id: edge.id, from: fromNode, to: toNode });
        }

        return accumulator;
      }, []),
    [nodeById],
  );

  const activeNode = nodeById[activeNodeId] ?? MAP_NODES[0];
  const activeTrackedIpLocation = trackedIpLocations.find((location) => location.ip === activeTrackedIp) ?? trackedIpLocations[0] ?? null;
  const activeFlightTrack = flightTracks.find((flightTrack) => flightTrack.icao24 === activeFlightIcao) ?? flightTracks[0] ?? null;
  const markerScale = useMemo(() => 1 / Math.max(mapZoomLevel, 0.1), [mapZoomLevel]);
  const shouldShowCountryLabels = mapZoomLevel < ZOOM_THRESHOLD_FOR_LABELS;

  const totalSignals = useMemo(() => MAP_NODES.reduce((sum, node) => sum + node.value, 0), []);
  const topNodes = useMemo(() => [...MAP_NODES].sort((a, b) => b.value - a.value), []);

  useEffect(() => {
    if (trackedIpLocations.length === 0) {
      if (activeTrackedIp !== null) {
        setActiveTrackedIp(null);
      }

      return;
    }

    if (!activeTrackedIp || !trackedIpLocations.some((location) => location.ip === activeTrackedIp)) {
      setActiveTrackedIp(trackedIpLocations[0].ip);
    }
  }, [activeTrackedIp, trackedIpLocations]);

  useEffect(() => {
    if (flightTracks.length === 0) {
      if (activeFlightIcao !== null) {
        setActiveFlightIcao(null);
      }

      return;
    }

    if (!activeFlightIcao || !flightTracks.some((flightTrack) => flightTrack.icao24 === activeFlightIcao)) {
      setActiveFlightIcao(flightTracks[0].icao24);
    }
  }, [activeFlightIcao, flightTracks]);

  useEffect(() => {
    if (!isFlightsEnabled) {
      setFlightTracks([]);
      setActiveFlightIcao(null);
      setFlightSyncError('');
      setIsFlightsSyncing(false);
      setLastFlightSyncAt(null);
      return;
    }

    let isMounted = true;
    let isRequestInFlight = false;
    let retryDelayMs = FLIGHT_POLL_INTERVAL_MS;
    let syncTimeoutId: number | null = null;
    const activeControllers = new Set<AbortController>();

    const scheduleNextSync = (delayMs: number) => {
      if (!isMounted) {
        return;
      }

      if (syncTimeoutId !== null) {
        window.clearTimeout(syncTimeoutId);
      }

      syncTimeoutId = window.setTimeout(() => {
        void syncFlights();
      }, delayMs);
    };

    const syncFlights = async () => {
      if (isRequestInFlight || !isMounted) {
        return;
      }

      isRequestInFlight = true;
      const controller = new AbortController();
      activeControllers.add(controller);

      if (isMounted) {
        setIsFlightsSyncing(true);
      }

      let retryAfterMs: number | null = null;

      try {
        const feedResponses = await Promise.allSettled(
          AIRPLANES_LIVE_QUERY_POINTS.map(async (coordinates) => {
            const response = await fetch(buildAirplanesLivePointUrl(coordinates), {
              method: 'GET',
              signal: controller.signal,
              headers: {
                Accept: 'application/json',
              },
            });

            return response;
          }),
        );

        const snapshots: FlightSnapshot[] = [];
        const unavailableStatuses = new Set<number>();
        let hasSuccessfulResponse = false;
        let hasRateLimit = false;

        for (const feedResult of feedResponses) {
          if (feedResult.status === 'rejected') {
            if (feedResult.reason instanceof DOMException && feedResult.reason.name === 'AbortError') {
              throw feedResult.reason;
            }

            continue;
          }

          const feedResponse = feedResult.value;

          if (feedResponse.status === 429) {
            hasRateLimit = true;
            const endpointRetryAfterMs = parseRetryAfterMs(feedResponse.headers.get('Retry-After'));
            retryAfterMs = Math.max(retryAfterMs ?? 0, endpointRetryAfterMs ?? FLIGHT_RATE_LIMIT_FALLBACK_MS);
            continue;
          }

          if (!feedResponse.ok) {
            unavailableStatuses.add(feedResponse.status);
            continue;
          }

          const payload = (await feedResponse.json()) as AirplanesLivePointResponse;
          snapshots.push(...parseAirplanesLiveSnapshots(payload));
          hasSuccessfulResponse = true;
        }

        if (!hasSuccessfulResponse) {
          if (hasRateLimit) {
            retryDelayMs = Math.min(
              Math.max(retryAfterMs ?? FLIGHT_RATE_LIMIT_FALLBACK_MS, FLIGHT_POLL_INTERVAL_MS),
              FLIGHT_MAX_BACKOFF_MS,
            );
            throw new Error(`airplanes.live rate-limited. Retrying in ${Math.ceil(retryDelayMs / 1000)}s.`);
          }

          if (unavailableStatuses.size > 0) {
            retryDelayMs = Math.min(retryDelayMs * 2, FLIGHT_MAX_BACKOFF_MS);
            throw new Error(`airplanes.live unavailable (${[...unavailableStatuses][0]}).`);
          }

          retryDelayMs = Math.min(retryDelayMs * 2, FLIGHT_MAX_BACKOFF_MS);
          throw new Error('airplanes.live unavailable.');
        }

        if (!isMounted) {
          return;
        }

        setFlightTracks((previousTracks) => mergeFlightTracks(previousTracks, dedupeFlightSnapshots(snapshots)));
        setFlightSyncError('');
        setLastFlightSyncAt(Date.now());
        retryDelayMs = FLIGHT_POLL_INTERVAL_MS;
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        if (retryAfterMs !== null) {
          setFlightSyncError(`airplanes.live rate-limited. Retrying in ${Math.ceil(retryDelayMs / 1000)}s.`);
        } else {
          setFlightSyncError(error instanceof Error ? error.message : 'Failed to sync flight data.');
        }
      } finally {
        activeControllers.delete(controller);
        isRequestInFlight = false;

        if (isMounted) {
          setIsFlightsSyncing(false);
          scheduleNextSync(retryDelayMs);
        }
      }
    };

    void syncFlights();

    return () => {
      isMounted = false;

      if (syncTimeoutId !== null) {
        window.clearTimeout(syncTimeoutId);
      }

      activeControllers.forEach((controller) => controller.abort());
    };
  }, [isFlightsEnabled]);

  useEffect(() => {
    const mapShell = mapShellRef.current;
    const mapStage = mapStageRef.current;

    if (!mapShell) {
      return;
    }

    const findScrollableAncestor = (element: HTMLElement) => {
      let current: HTMLElement | null = element;

      while (current && mapShell.contains(current)) {
        const styles = window.getComputedStyle(current);
        const overflowY = styles.overflowY;
        const isScrollableY =
          (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
          current.scrollHeight - current.clientHeight > 1;

        if (isScrollableY) {
          return current;
        }

        if (current === mapShell) {
          break;
        }

        current = current.parentElement;
      }

      return null;
    };

    const handleShellWheelCapture = (event: WheelEvent) => {
      const target = event.target;

      if (!(target instanceof HTMLElement) || !mapShell.contains(target)) {
        return;
      }

      if (mapStage && mapStage.contains(target)) {
        if (event.cancelable) {
          event.preventDefault();
        }

        return;
      }

      const scrollableAncestor = findScrollableAncestor(target);

      if (!scrollableAncestor) {
        if (event.cancelable) {
          event.preventDefault();
        }

        return;
      }

      const deltaY = event.deltaY;

      if (Math.abs(deltaY) < 0.01) {
        return;
      }

      const maxScrollTop = scrollableAncestor.scrollHeight - scrollableAncestor.clientHeight;
      const atTop = scrollableAncestor.scrollTop <= 1;
      const atBottom = scrollableAncestor.scrollTop >= maxScrollTop - 1;

      if ((deltaY > 0 && atBottom) || (deltaY < 0 && atTop)) {
        if (event.cancelable) {
          event.preventDefault();
        }
      }
    };

    mapShell.addEventListener('wheel', handleShellWheelCapture, {
      passive: false,
      capture: true,
    });

    return () => {
      mapShell.removeEventListener('wheel', handleShellWheelCapture, true);
    };
  }, []);

  const handleLookupSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const rawInput = ipInput.trim();

    if (!rawInput) {
      setLookupError('Enter at least one IP address to locate on the map.');
      return;
    }

    const ipBatch = parseIpInput(rawInput);

    if (ipBatch.length === 0) {
      setLookupError('No valid IP values found. Separate IPs with commas or spaces.');
      return;
    }

    if (ipBatch.length > MAX_IP_LOOKUP_BATCH) {
      setLookupError(`Maximum ${MAX_IP_LOOKUP_BATCH} IPs per lookup.`);
      return;
    }

    const invalidIps = ipBatch.filter((ip) => !isLikelyIpAddress(ip));

    if (invalidIps.length > 0) {
      setLookupError(`Invalid IP format: ${summarizeIpList(invalidIps)}.`);
      return;
    }

    setLookupError('');
    setIsLookupLoading(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 9000);
    const resolvedLocations: TrackedIpLocation[] = [];
    const rateLimitedIps: string[] = [];
    const blockedIps: string[] = [];
    const unresolvedIps: string[] = [];

    try {
      for (const ip of ipBatch) {
        try {
          const resolvedLocation = await lookupIpWithFallback(ip, controller.signal);

          if (resolvedLocation) {
            resolvedLocations.push(resolvedLocation);
            continue;
          }

          unresolvedIps.push(ip);
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            throw error;
          }

          if (error instanceof Error && error.message === 'lookup_blocked') {
            blockedIps.push(ip);
            continue;
          }

          if (error instanceof Error && error.message === 'lookup_rate_limited') {
            rateLimitedIps.push(ip);
            continue;
          }

          unresolvedIps.push(ip);
        }
      }

      setTrackedIpLocations(resolvedLocations);
      setActiveTrackedIp(resolvedLocations[0]?.ip ?? null);

      if (resolvedLocations.length === ipBatch.length) {
        setLookupError('');
        return;
      }

      if (resolvedLocations.length > 0) {
        setLookupError(
          `Added ${resolvedLocations.length}/${ipBatch.length} IPs. Unresolved: ${summarizeIpList([
            ...rateLimitedIps,
            ...blockedIps,
            ...unresolvedIps,
          ])}.`,
        );
        return;
      }

      if (rateLimitedIps.length > 0) {
        throw new Error('Lookup rate-limited. Please wait and try again.');
      }

      if (blockedIps.length > 0) {
        throw new Error('Lookup blocked by provider. Please try again later.');
      }

      throw new Error('Unable to resolve these IP addresses right now.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setLookupError('Lookup timed out. Please try again.');
      } else {
        setLookupError(error instanceof Error ? error.message : 'Lookup failed.');
      }

      setTrackedIpLocations([]);
      setActiveTrackedIp(null);
    } finally {
      window.clearTimeout(timeoutId);
      setIsLookupLoading(false);
    }
  };

  const clearTrackedIpLocation = () => {
    setTrackedIpLocations([]);
    setActiveTrackedIp(null);
    setLookupError('');
    setIpInput('');
  };

  const handleMapMove = (position: { zoom: number }) => {
    if (!Number.isFinite(position.zoom)) {
      return;
    }

    setMapZoomLevel(position.zoom);
  };

  if (!activeNode) {
    return null;
  }

  return (
    <article className="world-map-shell" ref={mapShellRef}>
      <header className="world-map-topbar">
        <div>
          <h3>Simple Map</h3>
          <p>Live 2D overlay of node traffic and event density.</p>
        </div>

        <div className="world-map-controls">
          <div className="world-map-kpis" aria-label="Map metrics">
            <span>{MAP_NODES.length} nodes</span>
            <span>{resolvedConnections.length} links</span>
            <span>{metricFormatter.format(totalSignals)} traffic</span>
            <span>{isFlightsEnabled ? `${flightTracks.length} flights` : 'flights off'}</span>
          </div>

          <form className="world-map-lookup-form" onSubmit={handleLookupSubmit}>
            <input
              type="text"
              value={ipInput}
              onChange={(event) => setIpInput(event.target.value)}
              placeholder="Enter IP list (e.g. 161.35.157.41,113.173.148.29)"
              aria-label="IP address list lookup"
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" disabled={isLookupLoading}>
              {isLookupLoading ? 'Locating...' : 'Locate IPs'}
            </button>
            {trackedIpLocations.length > 0 ? (
              <button type="button" className="is-ghost" onClick={clearTrackedIpLocation}>
                Clear
              </button>
            ) : null}
          </form>

          <button
            type="button"
            className={cn('world-map-flight-toggle', isFlightsEnabled && 'is-active')}
            onClick={() => setIsFlightsEnabled((enabled) => !enabled)}
          >
            {isFlightsEnabled ? 'Hide Flights' : 'Show Flights'}
          </button>
        </div>
      </header>

      <div className="world-map-surface">
        <div className="world-map-stage" ref={mapStageRef}>
          <div className={cn('world-map-country-chip', hoveredCountryName && 'is-active')} aria-live="polite">
            {hoveredCountryName || 'Hover a country'}
          </div>

          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: 135, center: [8, 16] }}
            className="world-map-svg"
          >
            <ZoomableGroup minZoom={1} maxZoom={12} onMove={handleMapMove} onMoveEnd={handleMapMove}>
              <Geographies geography={WORLD_GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const geographyName = getGeographyName(geo);

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onMouseEnter={() => setHoveredCountryName(geographyName)}
                        onMouseLeave={() => setHoveredCountryName('')}
                        onFocus={() => setHoveredCountryName(geographyName)}
                        onBlur={() => setHoveredCountryName('')}
                        style={{
                          default: {
                            fill: '#20252d',
                            stroke: 'rgba(221, 228, 236, 0.34)',
                            strokeWidth: 0.45,
                            outline: 'none',
                          },
                          hover: {
                            fill: '#262d38',
                            stroke: 'rgba(244, 247, 250, 0.6)',
                            strokeWidth: 0.6,
                            outline: 'none',
                          },
                          pressed: {
                            fill: '#2a3039',
                            stroke: 'rgba(244, 247, 250, 0.64)',
                            strokeWidth: 0.6,
                            outline: 'none',
                          },
                        }}
                      >
                        <title>{shouldShowCountryLabels ? `${geographyName}` : geographyName}</title>
                      </Geography>
                    );
                  })
                }
              </Geographies>

              {resolvedConnections.map((edge) => {
                const isActive = edge.from.id === activeNode.id || edge.to.id === activeNode.id;

                return (
                  <Line
                    key={edge.id}
                    from={edge.from.coordinates}
                    to={edge.to.coordinates}
                    className={cn('world-map-link', isActive && 'is-active')}
                  />
                );
              })}

              {isFlightsEnabled
                ? flightTracks.map((flightTrack) =>
                  flightTrack.trail.slice(1).map((point, index) => {
                    const previousPoint = flightTrack.trail[index];

                    if (!previousPoint) {
                      return null;
                    }

                    return (
                      <Line
                        key={`${flightTrack.icao24}-trail-${index}`}
                        from={previousPoint}
                        to={point}
                        className={cn(
                          'world-map-flight-trail',
                          flightTrack.icao24 === activeFlightTrack?.icao24 && 'is-active',
                        )}
                      />
                    );
                  }),
                )
                : null}

              {isFlightsEnabled
                ? flightTracks.map((flightTrack) => {
                  const isActiveFlight = flightTrack.icao24 === activeFlightTrack?.icao24;

                  return (
                    <Marker key={`flight-${flightTrack.icao24}`} coordinates={flightTrack.coordinates}>
                      <g
                        className={cn('world-map-flight-node', isActiveFlight && 'is-active')}
                        transform={`scale(${markerScale})`}
                        role="button"
                        tabIndex={0}
                        onClick={() => setActiveFlightIcao(flightTrack.icao24)}
                        onMouseEnter={() => setActiveFlightIcao(flightTrack.icao24)}
                        onFocus={() => setActiveFlightIcao(flightTrack.icao24)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setActiveFlightIcao(flightTrack.icao24);
                          }
                        }}
                      >
                        <circle className="world-map-flight-halo" r={isActiveFlight ? 5.8 : 4.6} />
                        <path
                          className="world-map-flight-body"
                          transform={`rotate(${flightTrack.trueTrack ?? 0})`}
                          d="M0,-4.2 L2.8,3.2 L0,1.8 L-2.8,3.2 Z"
                        />
                        <title>{`${flightTrack.callsign}: ${formatFlightSpeed(flightTrack.velocity)}`}</title>
                      </g>
                    </Marker>
                  );
                })
                : null}

              {MAP_NODES.map((node) => {
                const isActive = node.id === activeNode.id;

                return (
                  <Marker key={node.id} coordinates={node.coordinates}>
                    <g
                      className={cn('world-map-node', isActive && 'is-active')}
                      transform={`scale(${markerScale})`}
                      role="button"
                      tabIndex={0}
                      onClick={() => setActiveNodeId(node.id)}
                      onMouseEnter={() => setActiveNodeId(node.id)}
                      onFocus={() => setActiveNodeId(node.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setActiveNodeId(node.id);
                        }
                      }}
                    >
                      <circle className="world-map-pulse pulse-1" r={isActive ? 8 : 6} />
                      <circle className="world-map-pulse pulse-2" r={isActive ? 8 : 6} />
                      <circle className="world-map-pulse pulse-3" r={isActive ? 8 : 6} />
                      <circle className="world-map-ring" r={isActive ? 7 : 6} />
                      <circle className="world-map-dot" r={isActive ? 3.4 : 3} />
                      <text className="world-map-label" y={isActive ? -11 : -10}>
                        {node.id}
                      </text>
                      <title>{`${node.label}: ${metricFormatter.format(node.value)}`}</title>
                    </g>
                  </Marker>
                );
              })}

              {shouldShowCountryLabels &&
                COUNTRY_LABELS.map((country) => (
                  <Marker key={country.id} coordinates={country.coordinates}>
                    <g
                      className="world-map-country-label-marker"
                      transform={`scale(${0.8 / Math.max(mapZoomLevel, 0.5)})`}
                      style={{ pointerEvents: 'none' }}
                    >
                      <text
                        className="world-map-country-label-text"
                        style={{
                          fontSize: 4,
                          fill: 'rgba(255, 255, 255, 0.45)',
                          textAnchor: 'middle',
                          dominantBaseline: 'middle',
                        }}
                      >
                        {country.label}
                      </text>
                    </g>
                  </Marker>
                ))}

              {trackedIpLocations.map((trackedIpLocation) => {
                const isActiveTrackedIp = trackedIpLocation.ip === activeTrackedIpLocation?.ip;

                return (
                  <Marker key={trackedIpLocation.ip} coordinates={trackedIpLocation.coordinates}>
                    <g
                      className={cn('world-map-ip-node', isActiveTrackedIp && 'is-active')}
                      transform={`scale(${markerScale})`}
                      role="button"
                      tabIndex={0}
                      onClick={() => setActiveTrackedIp(trackedIpLocation.ip)}
                      onMouseEnter={() => setActiveTrackedIp(trackedIpLocation.ip)}
                      onFocus={() => setActiveTrackedIp(trackedIpLocation.ip)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setActiveTrackedIp(trackedIpLocation.ip);
                        }
                      }}
                    >
                      <circle className="world-map-ip-pulse" r={isActiveTrackedIp ? 9 : 7} />
                      <circle className="world-map-ip-ring" r={isActiveTrackedIp ? 7 : 6} />
                      <circle className="world-map-ip-dot" r={isActiveTrackedIp ? 3.6 : 3} />
                      <text className="world-map-ip-label" y={isActiveTrackedIp ? -12 : -10}>
                        {formatIpLabel(trackedIpLocation.ip)}
                      </text>
                      <title>{`${trackedIpLocation.ip} - ${trackedIpLocation.city}, ${trackedIpLocation.country}`}</title>
                    </g>
                  </Marker>
                );
              })}
            </ZoomableGroup>
          </ComposableMap>
        </div>

        <aside className="world-map-sidebar" aria-live="polite">
          <div className="world-map-focus-card">
            <p className="world-map-focus-label">Focused Node</p>
            <h4>{activeNode.label}</h4>
            <p className="world-map-focus-region">{activeNode.region}</p>
            <p className="world-map-focus-value">{metricFormatter.format(activeNode.value)}</p>
          </div>

          <div className="world-map-flight-card">
            <div className="world-map-ip-card-head">
              <p className="world-map-focus-label">Live Flights</p>
              <span className="world-map-ip-count">{isFlightsEnabled ? (isFlightsSyncing ? 'syncing' : 'live') : 'paused'}</span>
            </div>

            <p className="world-map-flight-meta">
              {isFlightsEnabled
                ? `airplanes.live feed - ${flightTracks.length} aircraft - updated ${formatSyncClock(lastFlightSyncAt)}`
                : 'Flight overlay is paused.'}
            </p>

            {activeFlightTrack ? (
              <>
                <h4>{activeFlightTrack.callsign}</h4>
                <p className="world-map-focus-region">{activeFlightTrack.originCountry}</p>
                <p className="world-map-ip-meta">
                  {formatFlightSpeed(activeFlightTrack.velocity)}{' '}
                  {activeFlightTrack.trueTrack !== null ? `- HDG ${Math.round(activeFlightTrack.trueTrack)}°` : '- HDG unavailable'}
                </p>
              </>
            ) : isFlightsEnabled && !flightSyncError ? (
              <p className="world-map-ip-placeholder">No airborne flights in the current feed.</p>
            ) : null}

            {flightSyncError ? <p className="world-map-ip-error">{flightSyncError}</p> : null}

            {isFlightsEnabled && flightTracks.length > 0 ? (
              <ul className="world-map-flight-list">
                {flightTracks.slice(0, 10).map((flightTrack) => (
                  <li key={`flight-list-${flightTrack.icao24}`}>
                    <button
                      type="button"
                      className={cn('world-map-flight-item', flightTrack.icao24 === activeFlightTrack?.icao24 && 'is-active')}
                      onClick={() => setActiveFlightIcao(flightTrack.icao24)}
                      onMouseEnter={() => setActiveFlightIcao(flightTrack.icao24)}
                      onFocus={() => setActiveFlightIcao(flightTrack.icao24)}
                    >
                      <span>{flightTrack.callsign}</span>
                      <strong>{formatFlightSpeedCompact(flightTrack.velocity)}</strong>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="world-map-ip-card">
            <div className="world-map-ip-card-head">
              <p className="world-map-focus-label">IP Lookup</p>
              <span className="world-map-ip-count">{trackedIpLocations.length} tracked</span>
            </div>

            {activeTrackedIpLocation ? (
              <>
                <h4>{activeTrackedIpLocation.ip}</h4>
                <p className="world-map-focus-region">{`${activeTrackedIpLocation.city}, ${activeTrackedIpLocation.country}`}</p>
                <p className="world-map-ip-meta">{activeTrackedIpLocation.isp}</p>
              </>
            ) : !lookupError ? (
              <p className="world-map-ip-placeholder">No IP selected. Enter one or many IPs above to add markers.</p>
            ) : null}

            {lookupError ? <p className="world-map-ip-error">{lookupError}</p> : null}

            {trackedIpLocations.length > 0 ? (
              <ul className="world-map-ip-list">
                {trackedIpLocations.map((location) => (
                  <li key={`tracked-${location.ip}`}>
                    <button
                      type="button"
                      className={cn('world-map-ip-item', location.ip === activeTrackedIpLocation?.ip && 'is-active')}
                      onClick={() => setActiveTrackedIp(location.ip)}
                    >
                      <span>{formatIpLabel(location.ip)}</span>
                      <strong>{location.country}</strong>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <ul className="world-map-feed">
            {topNodes.map((node) => (
              <li key={node.id}>
                <button
                  type="button"
                  className={cn('world-map-feed-item', node.id === activeNode.id && 'is-active')}
                  onClick={() => setActiveNodeId(node.id)}
                  onMouseEnter={() => setActiveNodeId(node.id)}
                  onFocus={() => setActiveNodeId(node.id)}
                >
                  <span>{node.label}</span>
                  <strong>{metricFormatter.format(node.value)}</strong>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </article>
  );
};
