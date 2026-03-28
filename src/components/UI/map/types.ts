export type Coordinates = [number, number];

export type MapNode = {
  id: string;
  label: string;
  region: string;
  coordinates: Coordinates;
  value: number;
};

export type MapConnection = {
  id: string;
  from: string;
  to: string;
};

export type ResolvedConnection = {
  id: string;
  from: MapNode;
  to: MapNode;
};

export type TrackedIpLocation = {
  ip: string;
  city: string;
  country: string;
  isp: string;
  coordinates: Coordinates;
};

export type FlightSnapshot = {
  icao24: string;
  callsign: string;
  originCountry: string;
  coordinates: Coordinates;
  velocity: number | null;
  trueTrack: number | null;
  lastContact: number;
};

export type FlightTrack = FlightSnapshot & {
  trail: Coordinates[];
};

export type MapLineFeatureCollection = {
  type: 'FeatureCollection';
  features: {
    type: 'Feature';
    properties: {
      id: string;
      isActive: number;
    };
    geometry: {
      type: 'LineString';
      coordinates: Coordinates[];
    };
  }[];
};

export type WorldActivityMapPlugin = 'nodes' | 'ip' | 'flights';
