import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import MapView, {
  Layer,
  Source,
  type LayerProps,
  type MapGeoJSONFeature,
  type MapLayerMouseEvent,
  type MapRef,
  type ViewStateChangeEvent,
} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import { FlightsPlugin } from '~/components/UI/map/plugins/FlightsPlugin';
import { IpPlugin } from '~/components/UI/map/plugins/IpPlugin';
import { NodesPlugin } from '~/components/UI/map/plugins/NodesPlugin';
import type {
  Coordinates,
  FlightTrack,
  FlightSnapshot,
  MapConnection,
  MapLineFeatureCollection,
  MapNode,
  ResolvedConnection,
  TrackedIpLocation,
  WorldActivityMapPlugin,
} from '~/components/UI/map/types';
import { cn } from '~/lib/utils';

export type { WorldActivityMapPlugin } from '~/components/UI/map/types';

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

type IpifyLookupResponse = {
  ip?: string;
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


const DETAILED_DARK_MAP_STYLE_URL = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const COUNTRY_BORDERS_GEOJSON_URL =
  'https://cdn.jsdelivr.net/gh/datasets/geo-countries@master/data/countries.geojson';
const COUNTRY_HITBOX_LAYER_ID = 'world-map-country-hitbox';

const MAP_HOVER_LAYER_CANDIDATES = [
  'boundary_country_outline',
  'boundary_country_inner',
  'boundary_state',
  'boundary_county',
  'place_country_1',
  'place_country_2',
  'place_state',
  'place_city_r6',
  'place_town',
] as const;

const MAP_LABEL_SIZE_OVERRIDES = [
  {
    layerId: 'place_continent',
    textSize: ['interpolate', ['linear'], ['zoom'], 0, 7.92, 2, 9, 4, 10.08],
  },
  {
    layerId: 'place_country_1',
    textSize: ['interpolate', ['linear'], ['zoom'], 0, 5.76, 3, 6.75, 6, 8.1, 9, 9.09],
  },
  {
    layerId: 'place_country_2',
    textSize: ['interpolate', ['linear'], ['zoom'], 0, 5.04, 3, 6.03, 6, 7.02, 9, 8.19],
  },
  {
    layerId: 'place_state',
    textSize: ['interpolate', ['linear'], ['zoom'], 3, 5.04, 5, 6.03, 8, 7.2],
  },
] as const;

const COUNTRY_HITBOX_LAYER: LayerProps = {
  id: COUNTRY_HITBOX_LAYER_ID,
  type: 'fill',
  paint: {
    'fill-color': 'rgba(255, 255, 255, 0)',
    'fill-opacity': 0,
  },
};

const COUNTRY_HOVER_FILL_LAYER_BASE: LayerProps = {
  id: 'world-map-country-hover-fill',
  type: 'fill',
  paint: {
    'fill-color': 'rgba(255, 148, 88, 0.05)',
    'fill-outline-color': 'rgba(255, 182, 134, 0.96)',
    'fill-opacity': 0.1,
  },
};

const COUNTRY_HOVER_LINE_LAYER_BASE: LayerProps = {
  id: 'world-map-country-hover-line',
  type: 'line',
  paint: {
    'line-color': 'rgba(255, 198, 154, 0.94)',
    'line-width': 1.15,
    'line-opacity': 0.98,
  },
  layout: {
    'line-cap': 'round',
    'line-join': 'round',
  },
};

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
  { id: 'V1', label: 'Hanoi', region: 'Asia', coordinates: [105.8342, 21.0278], value: 62000 },
  { id: 'V2', label: 'Beijing', region: 'Asia', coordinates: [116.4074, 39.9042], value: 105000 },
  { id: 'V3', label: 'Washington D.C.', region: 'North America', coordinates: [-77.0369, 38.9072], value: 72000 },
  { id: 'V4', label: 'Paris', region: 'Europe', coordinates: [2.3522, 48.8566], value: 89000 },
  { id: 'V5', label: 'Moscow', region: 'Europe', coordinates: [37.6173, 55.7558], value: 77000 },
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
  { id: 'c-12', from: 'E2', to: 'V1' },
  { id: 'c-13', from: 'E2', to: 'V2' },
  { id: 'c-14', from: 'E1', to: 'V3' }, 
  { id: 'c-15', from: 'E1', to: 'V4' },
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

const MAP_MIN_ZOOM = 1;
const MAP_MAX_ZOOM = 12;

type WorldActivityMapProps = {
  plugins?: WorldActivityMapPlugin[];
};

const DEFAULT_WORLD_ACTIVITY_MAP_PLUGINS: WorldActivityMapPlugin[] = ['nodes', 'ip', 'flights'];

const CONNECTION_LINE_LAYER: LayerProps = {
  id: 'world-map-connection-line',
  type: 'line',
  filter: ['==', 'isActive', 0],
  paint: {
    'line-color': 'rgba(255, 118, 58, 0.44)',
    'line-width': 1.2,
    'line-opacity': 0.72,
    'line-dasharray': [3, 6],
  },
  layout: {
    'line-cap': 'round',
    'line-join': 'round',
  },
};

const CONNECTION_ACTIVE_LINE_LAYER: LayerProps = {
  id: 'world-map-connection-line-active',
  type: 'line',
  filter: ['==', 'isActive', 1],
  paint: {
    'line-color': 'rgba(255, 138, 76, 0.9)',
    'line-width': 1.5,
    'line-opacity': 0.96,
    'line-dasharray': [3, 6],
  },
  layout: {
    'line-cap': 'round',
    'line-join': 'round',
  },
};

const FLIGHT_TRAIL_LINE_LAYER: LayerProps = {
  id: 'world-map-flight-trail-line',
  type: 'line',
  filter: ['==', 'isActive', 0],
  paint: {
    'line-color': 'rgba(102, 206, 255, 0.34)',
    'line-width': 0.85,
    'line-opacity': 0.66,
  },
  layout: {
    'line-cap': 'round',
    'line-join': 'round',
  },
};

const FLIGHT_TRAIL_ACTIVE_LINE_LAYER: LayerProps = {
  id: 'world-map-flight-trail-line-active',
  type: 'line',
  filter: ['==', 'isActive', 1],
  paint: {
    'line-color': 'rgba(172, 232, 255, 0.88)',
    'line-width': 1.22,
    'line-opacity': 0.95,
  },
  layout: {
    'line-cap': 'round',
    'line-join': 'round',
  },
};

const CONNECTION_LINE_DASH_ANIMATION_SEQUENCE: number[][] = [
  [0, 4, 3],
  [0.5, 4, 2.5],
  [1, 4, 2],
  [1.5, 4, 1.5],
  [2, 4, 1],
  [2.5, 4, 0.5],
  [3, 4, 0],
  [0, 0.5, 3, 3.5],
  [0, 1, 3, 3],
  [0, 1.5, 3, 2.5],
  [0, 2, 3, 2],
  [0, 2.5, 3, 1.5],
  [0, 3, 3, 1],
  [0, 3.5, 3, 0.5],
];

const CONNECTION_LINE_DASH_FRAME_MS = 80;

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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const toRadians = (value: number) => (value * Math.PI) / 180;

const toDegrees = (value: number) => (value * 180) / Math.PI;

const toUnitVector = ([longitude, latitude]: Coordinates) => {
  const longitudeRad = toRadians(longitude);
  const latitudeRad = toRadians(latitude);
  const cosLatitude = Math.cos(latitudeRad);

  return {
    x: cosLatitude * Math.cos(longitudeRad),
    y: cosLatitude * Math.sin(longitudeRad),
    z: Math.sin(latitudeRad),
  };
};

const greatCircleCoordinates = (from: Coordinates, to: Coordinates, segmentCount = 44): Coordinates[] => {
  const start = toUnitVector(from);
  const end = toUnitVector(to);

  const dotProduct = clamp(start.x * end.x + start.y * end.y + start.z * end.z, -1, 1);
  const angularDistance = Math.acos(dotProduct);

  if (!Number.isFinite(angularDistance) || angularDistance < 1e-6) {
    return [from, to];
  }

  const sinAngularDistance = Math.sin(angularDistance);
  const coordinates: Coordinates[] = [];
  let previousLongitude: number | null = null;

  for (let step = 0; step <= segmentCount; step += 1) {
    const ratio = step / segmentCount;
    const interpolationFrom = Math.sin((1 - ratio) * angularDistance) / sinAngularDistance;
    const interpolationTo = Math.sin(ratio * angularDistance) / sinAngularDistance;

    const x = interpolationFrom * start.x + interpolationTo * end.x;
    const y = interpolationFrom * start.y + interpolationTo * end.y;
    const z = interpolationFrom * start.z + interpolationTo * end.z;

    const normalizedLength = Math.hypot(x, y, z) || 1;
    const normalizedX = x / normalizedLength;
    const normalizedY = y / normalizedLength;
    const normalizedZ = z / normalizedLength;

    let longitude = toDegrees(Math.atan2(normalizedY, normalizedX));
    const latitude = toDegrees(Math.atan2(normalizedZ, Math.hypot(normalizedX, normalizedY)));

    if (previousLongitude !== null) {
      while (longitude - previousLongitude > 180) {
        longitude -= 360;
      }

      while (longitude - previousLongitude < -180) {
        longitude += 360;
      }
    }

    coordinates.push([longitude, latitude]);
    previousLongitude = longitude;
  }

  return coordinates;
};

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

const getMapFeatureLabel = (feature: MapGeoJSONFeature | undefined) => {
  if (!feature) {
    return '';
  }

  const properties = feature.properties as Record<string, unknown> | null | undefined;

  if (!properties) {
    return '';
  }

  const nameCandidates = [
    properties.name,
    properties.name_en,
    properties['name:en'],
    properties.name_int,
    properties.admin,
    properties.adm0_name,
    properties.NAME,
    properties.NAME_EN,
    properties.NAME_LONG,
  ];

  for (const candidate of nameCandidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return '';
};

const getCountryFeatureCode = (feature: MapGeoJSONFeature | undefined) => {
  if (!feature) {
    return '';
  }

  const properties = feature.properties as Record<string, unknown> | null | undefined;

  if (!properties) {
    return '';
  }

  const codeCandidates = [
    properties['ISO3166-1-Alpha-3'],
    properties.iso_a3,
    properties.ISO_A3,
    properties.adm0_a3,
    properties.ADMIN,
  ];

  for (const candidate of codeCandidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim().toUpperCase();
    }
  }

  return '';
};

const getDetailScopeLabel = (zoomLevel: number) => {
  if (zoomLevel >= 6) {
    return 'City detail';
  }

  if (zoomLevel >= 4) {
    return 'Province detail';
  }

  return 'Country detail';
};

export const WorldActivityMap = ({ plugins = DEFAULT_WORLD_ACTIVITY_MAP_PLUGINS }: WorldActivityMapProps = {}) => {
  const mapShellRef = useRef<HTMLElement | null>(null);
  const mapStageRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapRef | null>(null);

  const enabledPlugins = useMemo(() => new Set(plugins), [plugins]);
  const isNodePluginEnabled = enabledPlugins.has('nodes');
  const isIpPluginEnabled = enabledPlugins.has('ip');
  const isFlightsPluginEnabled = enabledPlugins.has('flights');

  const [mapZoomLevel, setMapZoomLevel] = useState(1.45);
  const [interactiveLayerIds, setInteractiveLayerIds] = useState<string[]>([]);

  const [activeNodeId, setActiveNodeId] = useState(MAP_NODES[0]?.id ?? '');

  const [ipInput, setIpInput] = useState('');
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [trackedIpLocations, setTrackedIpLocations] = useState<TrackedIpLocation[]>([]);
  const [activeTrackedIp, setActiveTrackedIp] = useState<string | null>(null);
  const [selfIpLocation, setSelfIpLocation] = useState<TrackedIpLocation | null>(null);
  const [isSelfIpResolving, setIsSelfIpResolving] = useState(true);

  const [isFlightsEnabled, setIsFlightsEnabled] = useState(true);
  const [isFlightsSyncing, setIsFlightsSyncing] = useState(false);
  const [flightSyncError, setFlightSyncError] = useState('');
  const [flightTracks, setFlightTracks] = useState<FlightTrack[]>([]);
  const [activeFlightIcao, setActiveFlightIcao] = useState<string | null>(null);
  const [lastFlightSyncAt, setLastFlightSyncAt] = useState<number | null>(null);
  const [hoveredCountryName, setHoveredCountryName] = useState('');
  const [hoveredCountryCode, setHoveredCountryCode] = useState<string | null>(null);
  const isFlightOverlayEnabled = isFlightsPluginEnabled && isFlightsEnabled;

  const nodeById = useMemo(
    () => Object.fromEntries(MAP_NODES.map((node) => [node.id, node])) as Record<string, MapNode>,
    [],
  );

  const resolvedConnections = useMemo(
    () => {
      if (!isNodePluginEnabled) {
        return [];
      }

      return MAP_CONNECTIONS.reduce<ResolvedConnection[]>((accumulator, edge) => {
        const fromNode = nodeById[edge.from];
        const toNode = nodeById[edge.to];

        if (fromNode && toNode) {
          accumulator.push({ id: edge.id, from: fromNode, to: toNode });
        }

        return accumulator;
      }, []);
    },
    [isNodePluginEnabled, nodeById],
  );

  const activeNode = isNodePluginEnabled ? nodeById[activeNodeId] ?? MAP_NODES[0] ?? null : null;
  const activeTrackedIpLocation = trackedIpLocations.find((location) => location.ip === activeTrackedIp) ?? trackedIpLocations[0] ?? null;
  const activeFlightTrack = flightTracks.find((flightTrack) => flightTrack.icao24 === activeFlightIcao) ?? flightTracks[0] ?? null;
  const mapDetailScope = useMemo(() => getDetailScopeLabel(mapZoomLevel), [mapZoomLevel]);
  const mapInteractiveLayerIds = useMemo(
    () => [...interactiveLayerIds, COUNTRY_HITBOX_LAYER_ID],
    [interactiveLayerIds],
  );

  const hoveredCountryFillLayer = useMemo<LayerProps>(
    () => ({
      ...COUNTRY_HOVER_FILL_LAYER_BASE,
      filter: ['==', ['get', 'ISO3166-1-Alpha-3'], hoveredCountryCode ?? '__none__'],
    }),
    [hoveredCountryCode],
  );

  const hoveredCountryLineLayer = useMemo<LayerProps>(
    () => ({
      ...COUNTRY_HOVER_LINE_LAYER_BASE,
      filter: ['==', ['get', 'ISO3166-1-Alpha-3'], hoveredCountryCode ?? '__none__'],
    }),
    [hoveredCountryCode],
  );

  const connectionLinesData = useMemo<MapLineFeatureCollection>(
    () => ({
      type: 'FeatureCollection' as const,
      features: isNodePluginEnabled
        ? resolvedConnections.map((edge) => ({
            type: 'Feature' as const,
            properties: {
              id: edge.id,
              isActive: activeNode && (edge.from.id === activeNode.id || edge.to.id === activeNode.id) ? 1 : 0,
            },
            geometry: {
              type: 'LineString' as const,
              coordinates: greatCircleCoordinates(edge.from.coordinates, edge.to.coordinates),
            },
          }))
        : [],
    }),
    [activeNode, isNodePluginEnabled, resolvedConnections],
  );

  const flightTrailLinesData = useMemo<MapLineFeatureCollection>(
    () => ({
      type: 'FeatureCollection' as const,
      features: isFlightOverlayEnabled
        ? flightTracks.flatMap((flightTrack) =>
            flightTrack.trail.slice(1).map((point, index) => {
              const previousPoint = flightTrack.trail[index];

              return {
                type: 'Feature' as const,
                properties: {
                  id: `${flightTrack.icao24}-trail-${index}`,
                  isActive: flightTrack.icao24 === activeFlightTrack?.icao24 ? 1 : 0,
                },
                geometry: {
                  type: 'LineString' as const,
                  coordinates: previousPoint ? [previousPoint, point] : [point, point],
                },
              };
            }),
          )
        : [],
    }),
    [activeFlightTrack?.icao24, flightTracks, isFlightOverlayEnabled],
  );

  const totalSignals = useMemo(() => (isNodePluginEnabled ? MAP_NODES.reduce((sum, node) => sum + node.value, 0) : 0), [isNodePluginEnabled]);
  const topNodes = useMemo(() => (isNodePluginEnabled ? [...MAP_NODES].sort((a, b) => b.value - a.value) : []), [isNodePluginEnabled]);

  useEffect(() => {
    if (!isIpPluginEnabled) {
      if (activeTrackedIp !== null) {
        setActiveTrackedIp(null);
      }

      return;
    }

    if (trackedIpLocations.length === 0) {
      if (activeTrackedIp !== null) {
        setActiveTrackedIp(null);
      }

      return;
    }

    if (!activeTrackedIp || !trackedIpLocations.some((location) => location.ip === activeTrackedIp)) {
      setActiveTrackedIp(trackedIpLocations[0].ip);
    }
  }, [activeTrackedIp, isIpPluginEnabled, trackedIpLocations]);

  useEffect(() => {
    if (!isIpPluginEnabled) {
      setSelfIpLocation(null);
      setIsSelfIpResolving(false);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 9000);

    const resolveSelfIpLocation = async () => {
      if (isMounted) {
        setIsSelfIpResolving(true);
      }

      try {
        let resolvedLocation: TrackedIpLocation | null = null;

        try {
          const response = await fetch('https://api.ipify.org?format=json', {
            method: 'GET',
            signal: controller.signal,
            headers: {
              Accept: 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('self_ip_unavailable');
          }

          const payload = (await response.json()) as IpifyLookupResponse;
          const currentIp = typeof payload.ip === 'string' ? payload.ip.trim() : '';

          if (!currentIp || !isLikelyIpAddress(currentIp)) {
            throw new Error('self_ip_unavailable');
          }

          resolvedLocation = await lookupIpWithFallback(currentIp, controller.signal);
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            throw error;
          }
        }

        if (!resolvedLocation) {
          const fallbackPayload = await fetchLookupPayload<GeolocationDbLookupResponse>(
            'https://geolocation-db.com/json/&position=true',
            controller.signal,
          );

          if (typeof fallbackPayload.latitude === 'number' && typeof fallbackPayload.longitude === 'number') {
            resolvedLocation = {
              ip: normalizeText(fallbackPayload.IPv4, 'Current IP'),
              city: normalizeText(fallbackPayload.city, 'Unknown city'),
              country: normalizeText(fallbackPayload.country_name, 'Unknown country'),
              isp: 'Unknown network',
              coordinates: [fallbackPayload.longitude, fallbackPayload.latitude],
            };
          }
        }

        if (!resolvedLocation) {
          throw new Error('self_ip_unavailable');
        }

        if (!isMounted) {
          return;
        }

        setSelfIpLocation(resolvedLocation);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setSelfIpLocation(null);
      } finally {
        if (isMounted) {
          setIsSelfIpResolving(false);
        }
      }
    };

    void resolveSelfIpLocation();

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [isIpPluginEnabled]);

  useEffect(() => {
    if (!isFlightsPluginEnabled) {
      if (activeFlightIcao !== null) {
        setActiveFlightIcao(null);
      }

      return;
    }

    if (flightTracks.length === 0) {
      if (activeFlightIcao !== null) {
        setActiveFlightIcao(null);
      }

      return;
    }

    if (!activeFlightIcao || !flightTracks.some((flightTrack) => flightTrack.icao24 === activeFlightIcao)) {
      setActiveFlightIcao(flightTracks[0].icao24);
    }
  }, [activeFlightIcao, flightTracks, isFlightsPluginEnabled]);

  useEffect(() => {
    if (!isFlightsPluginEnabled || !isFlightsEnabled) {
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
  }, [isFlightsEnabled, isFlightsPluginEnabled]);

  useEffect(() => {
    if (!isNodePluginEnabled) {
      return;
    }

    let animationFrameId: number | null = null;
    let previousStep = -1;

    const animateDash = (timestamp: number) => {
      const map = mapRef.current?.getMap();

      if (map) {
        const step = Math.floor(timestamp / CONNECTION_LINE_DASH_FRAME_MS) % CONNECTION_LINE_DASH_ANIMATION_SEQUENCE.length;

        if (step !== previousStep) {
          const dashPattern = CONNECTION_LINE_DASH_ANIMATION_SEQUENCE[step];

          const dashLayerIds = [CONNECTION_LINE_LAYER.id, CONNECTION_ACTIVE_LINE_LAYER.id].filter(
            (layerId): layerId is string => typeof layerId === 'string',
          );

          for (const layerId of dashLayerIds) {
            if (!map.getLayer(layerId)) {
              continue;
            }

            try {
              map.setPaintProperty(layerId, 'line-dasharray', dashPattern);
            } catch {
              // Ignore transient style updates while layers are reloaded.
            }
          }

          previousStep = step;
        }
      }

      animationFrameId = window.requestAnimationFrame(animateDash);
    };

    animationFrameId = window.requestAnimationFrame(animateDash);

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isNodePluginEnabled]);

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

    if (!isIpPluginEnabled) {
      return;
    }

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

  const refreshInteractiveLayers = () => {
    const map = mapRef.current?.getMap();

    if (!map) {
      return;
    }

    const existingLayers = new Set((map.getStyle().layers ?? []).map((layer) => layer.id));

    setInteractiveLayerIds(MAP_HOVER_LAYER_CANDIDATES.filter((layerId) => existingLayers.has(layerId)));

    for (const { layerId, textSize } of MAP_LABEL_SIZE_OVERRIDES) {
      if (!existingLayers.has(layerId)) {
        continue;
      }

      try {
        map.setLayoutProperty(layerId, 'text-size', textSize as unknown as number[]);
      } catch {
        // Ignore style layers that cannot be overridden in the active style.
      }
    }
  };

  const handleMapMove = (event: ViewStateChangeEvent) => {
    if (!Number.isFinite(event.viewState.zoom)) {
      return;
    }

    setMapZoomLevel(event.viewState.zoom);
  };

  const handleMapHover = (event: MapLayerMouseEvent) => {
    const hoveredCountryFeature = event.features?.find((feature) => feature.layer.id === COUNTRY_HITBOX_LAYER_ID);

    if (hoveredCountryFeature) {
      const countryCode = getCountryFeatureCode(hoveredCountryFeature);
      const countryLabel = getMapFeatureLabel(hoveredCountryFeature);

      setHoveredCountryCode(countryCode || null);
      setHoveredCountryName(countryLabel);
      return;
    }

    setHoveredCountryCode(null);
    const mapFeatureLabel = getMapFeatureLabel(event.features?.[0]);
    setHoveredCountryName(mapFeatureLabel);
  };

  const focusMapOnCoordinates = (coordinates: Coordinates, minimumZoom = 3.1) => {
    const map = mapRef.current?.getMap();

    if (!map) {
      return;
    }

    const currentZoom = map.getZoom();

    map.easeTo({
      center: coordinates,
      zoom: Math.max(currentZoom, minimumZoom),
      duration: 750,
      essential: true,
    });
  };

  const handleNodeSelect = (node: MapNode, shouldFocus = false) => {
    if (!isNodePluginEnabled) {
      return;
    }

    setActiveNodeId(node.id);

    if (shouldFocus) {
      focusMapOnCoordinates(node.coordinates, 2.8);
    }
  };

  const handleTrackedIpSelect = (location: TrackedIpLocation, shouldFocus = false) => {
    if (!isIpPluginEnabled) {
      return;
    }

    setActiveTrackedIp(location.ip);

    if (shouldFocus) {
      focusMapOnCoordinates(location.coordinates, 3.4);
    }
  };

  const handleListKeyboardNavigation = (
    event: KeyboardEvent<HTMLButtonElement>,
    onActivate?: () => void,
  ) => {
    const currentListItem = event.currentTarget.closest('li');
    const parentList = currentListItem?.parentElement;

    if (!currentListItem || !parentList) {
      return;
    }

    const listButtons = [...parentList.querySelectorAll<HTMLButtonElement>('li > button')];
    const currentIndex = listButtons.indexOf(event.currentTarget);

    if (currentIndex < 0 || listButtons.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      listButtons[(currentIndex + 1) % listButtons.length]?.focus();
      return;
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      listButtons[(currentIndex - 1 + listButtons.length) % listButtons.length]?.focus();
      return;
    }

    if ((event.key === 'Enter' || event.key === ' ') && onActivate) {
      event.preventDefault();
      onActivate();
    }
  };

  const mapScene = (
    <div className="world-map-stage" ref={mapStageRef}>
      <div className={cn('world-map-country-chip', hoveredCountryName && 'is-active')} aria-live="polite">
        {hoveredCountryName || `${mapDetailScope} · hover map labels`}
      </div>

      <div className="world-map-maplibre">
        <MapView
          ref={mapRef}
          mapLib={import('maplibre-gl')}
          mapStyle={DETAILED_DARK_MAP_STYLE_URL}
          initialViewState={{ longitude: 8, latitude: 16, zoom: 1.45 }}
          minZoom={MAP_MIN_ZOOM}
          maxZoom={MAP_MAX_ZOOM}
          maxPitch={0}
          dragRotate={false}
          touchPitch={false}
          attributionControl={false}
          style={{ width: '100%', minHeight: '410px', height: '100%' }}
          interactiveLayerIds={mapInteractiveLayerIds}
          onLoad={refreshInteractiveLayers}
          onStyleData={refreshInteractiveLayers}
          onMove={handleMapMove}
          onZoom={handleMapMove}
          onMouseMove={handleMapHover}
          onMouseLeave={() => {
            setHoveredCountryName('');
            setHoveredCountryCode(null);
          }}
        >
          <Source id="world-map-country-borders" type="geojson" data={COUNTRY_BORDERS_GEOJSON_URL}>
            <Layer {...COUNTRY_HITBOX_LAYER} />
            <Layer {...hoveredCountryFillLayer} />
            <Layer {...hoveredCountryLineLayer} />
          </Source>

          {isNodePluginEnabled ? (
            <NodesPlugin
              mapNodes={MAP_NODES}
              activeNode={activeNode}
              connectionLinesData={connectionLinesData}
              connectionLineLayer={CONNECTION_LINE_LAYER}
              connectionActiveLineLayer={CONNECTION_ACTIVE_LINE_LAYER}
              metricFormatter={metricFormatter}
              onSelectNode={handleNodeSelect}
            />
          ) : null}

          {isFlightOverlayEnabled ? (
            <FlightsPlugin
              flightTracks={flightTracks}
              activeFlightTrack={activeFlightTrack}
              flightTrailLinesData={flightTrailLinesData}
              flightTrailLineLayer={FLIGHT_TRAIL_LINE_LAYER}
              flightTrailActiveLineLayer={FLIGHT_TRAIL_ACTIVE_LINE_LAYER}
              formatFlightSpeed={formatFlightSpeed}
              onSelectFlight={setActiveFlightIcao}
            />
          ) : null}

          {isIpPluginEnabled ? (
            <IpPlugin
              selfIpLocation={selfIpLocation}
              trackedIpLocations={trackedIpLocations}
              activeTrackedIpLocation={activeTrackedIpLocation}
              formatIpLabel={formatIpLabel}
              onSelectTrackedIp={handleTrackedIpSelect}
            />
          ) : null}
        </MapView>
      </div>
    </div>
  );

  if (isNodePluginEnabled && !activeNode) {
    return null;
  }

  return (
    <article className="world-map-shell" ref={mapShellRef}>
      <header className="world-map-topbar">
        <div>
          <h3>Global Signal Map</h3>
          <p>Live dark vector map with country, province, and city detail.</p>
        </div>

        <div className="world-map-controls">
          <div className="world-map-kpis" aria-label="Map metrics">
            {isNodePluginEnabled ? <span>{MAP_NODES.length} nodes</span> : null}
            {isNodePluginEnabled ? <span>{resolvedConnections.length} links</span> : null}
            {isNodePluginEnabled ? <span>{metricFormatter.format(totalSignals)} traffic</span> : null}
            {isFlightsPluginEnabled ? <span>{isFlightOverlayEnabled ? `${flightTracks.length} flights` : 'flights off'}</span> : null}
          </div>

          {isIpPluginEnabled ? (
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
          ) : null}

          {isFlightsPluginEnabled ? (
            <button
              type="button"
              className={cn('world-map-flight-toggle', isFlightOverlayEnabled && 'is-active')}
              onClick={() => setIsFlightsEnabled((enabled) => !enabled)}
            >
              {isFlightOverlayEnabled ? 'Hide Flights' : 'Show Flights'}
            </button>
          ) : null}
        </div>
      </header>

      <div className="world-map-surface">
        {mapScene}

        <aside className="world-map-sidebar" aria-live="polite">
          {isNodePluginEnabled && activeNode ? (
            <div className="world-map-focus-card">
              <p className="world-map-focus-label">Focused Node</p>
              <h4>{activeNode.label}</h4>
              <p className="world-map-focus-region">{activeNode.region}</p>
              <p className="world-map-focus-value">{metricFormatter.format(activeNode.value)}</p>
            </div>
          ) : null}

          {isFlightsPluginEnabled ? (
            <div className="world-map-flight-card">
              <div className="world-map-ip-card-head">
                <p className="world-map-focus-label">Live Flights</p>
                <span className="world-map-ip-count">{isFlightOverlayEnabled ? (isFlightsSyncing ? 'syncing' : 'live') : 'paused'}</span>
              </div>

              <p className="world-map-flight-meta">
                {isFlightOverlayEnabled
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
              ) : isFlightOverlayEnabled && !flightSyncError ? (
                <p className="world-map-ip-placeholder">No airborne flights in the current feed.</p>
              ) : null}

              {flightSyncError ? <p className="world-map-ip-error">{flightSyncError}</p> : null}

              {isFlightOverlayEnabled && flightTracks.length > 0 ? (
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
          ) : null}

          {isIpPluginEnabled ? (
            <div className="world-map-ip-card">
              <div className="world-map-ip-card-head">
                <p className="world-map-focus-label">IP Lookup</p>
                <span className="world-map-ip-count">{trackedIpLocations.length} tracked</span>
              </div>

              <p className="world-map-ip-meta">
                {selfIpLocation
                  ? `You: ${selfIpLocation.ip} - ${selfIpLocation.city}, ${selfIpLocation.country}`
                  : isSelfIpResolving
                    ? 'Detecting your current IP location...'
                    : 'Unable to detect your current IP location.'}
              </p>

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
                        onClick={() => handleTrackedIpSelect(location, true)}
                        onMouseEnter={() => handleTrackedIpSelect(location)}
                        onFocus={() => handleTrackedIpSelect(location)}
                        onKeyDown={(event) => handleListKeyboardNavigation(event, () => handleTrackedIpSelect(location, true))}
                      >
                        <span>{formatIpLabel(location.ip)}</span>
                        <strong>{location.country}</strong>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {isNodePluginEnabled ? (
            <ul className="world-map-feed">
              {topNodes.map((node) => (
                <li key={node.id}>
                  <button
                    type="button"
                    className={cn('world-map-feed-item', node.id === activeNode?.id && 'is-active')}
                    onClick={() => handleNodeSelect(node, true)}
                    onMouseEnter={() => handleNodeSelect(node)}
                    onFocus={() => handleNodeSelect(node)}
                    onKeyDown={(event) => handleListKeyboardNavigation(event, () => handleNodeSelect(node, true))}
                  >
                    <span>{node.label}</span>
                    <strong>{metricFormatter.format(node.value)}</strong>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </aside>
      </div>
    </article>
  );
};
