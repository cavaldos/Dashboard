import { Layer, Marker, Source, type LayerProps } from 'react-map-gl/maplibre';

import { cn } from '~/lib/utils';

import type { FlightTrack, MapLineFeatureCollection } from '../types';

type FlightsPluginProps = {
  flightTracks: FlightTrack[];
  activeFlightTrack: FlightTrack | null;
  flightTrailLinesData: MapLineFeatureCollection;
  flightTrailLineLayer: LayerProps;
  flightTrailActiveLineLayer: LayerProps;
  formatFlightSpeed: (velocity: number | null) => string;
  onSelectFlight: (icao24: string) => void;
};

export const FlightsPlugin = ({
  flightTracks,
  activeFlightTrack,
  flightTrailLinesData,
  flightTrailLineLayer,
  flightTrailActiveLineLayer,
  formatFlightSpeed,
  onSelectFlight,
}: FlightsPluginProps) => (
  <>
    <Source id="world-map-flight-trails" type="geojson" data={flightTrailLinesData}>
      <Layer {...flightTrailLineLayer} />
      <Layer {...flightTrailActiveLineLayer} />
    </Source>

    {flightTracks.map((flightTrack) => {
      const isActiveFlight = flightTrack.icao24 === activeFlightTrack?.icao24;

      return (
        <Marker
          key={`flight-${flightTrack.icao24}`}
          longitude={flightTrack.coordinates[0]}
          latitude={flightTrack.coordinates[1]}
          anchor="center"
        >
          <button
            type="button"
            className="world-map-marker-hit"
            aria-label={`${flightTrack.callsign}: ${formatFlightSpeed(flightTrack.velocity)}`}
            title={`${flightTrack.callsign}: ${formatFlightSpeed(flightTrack.velocity)}`}
            onClick={() => onSelectFlight(flightTrack.icao24)}
            onMouseEnter={() => onSelectFlight(flightTrack.icao24)}
            onFocus={() => onSelectFlight(flightTrack.icao24)}
          >
            <svg
              viewBox="-8 -8 16 16"
              className={cn('world-map-flight-node world-map-flight-svg', isActiveFlight && 'is-active')}
              aria-hidden="true"
            >
              <circle className="world-map-flight-halo" r={isActiveFlight ? 5.8 : 4.6} />
              <path
                className="world-map-flight-body"
                transform={`rotate(${flightTrack.trueTrack ?? 0})`}
                d="M0,-4.2 L2.8,3.2 L0,1.8 L-2.8,3.2 Z"
              />
            </svg>
          </button>
        </Marker>
      );
    })}
  </>
);
