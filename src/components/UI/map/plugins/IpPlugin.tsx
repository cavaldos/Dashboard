import { Marker } from 'react-map-gl/maplibre';

import { cn } from '~/lib/utils';

import type { TrackedIpLocation } from '../types';

type IpPluginProps = {
  selfIpLocation: TrackedIpLocation | null;
  trackedIpLocations: TrackedIpLocation[];
  activeTrackedIpLocation: TrackedIpLocation | null;
  formatIpLabel: (ip: string) => string;
  onSelectTrackedIp: (location: TrackedIpLocation, shouldFocus?: boolean) => void;
};

export const IpPlugin = ({
  selfIpLocation,
  trackedIpLocations,
  activeTrackedIpLocation,
  formatIpLabel,
  onSelectTrackedIp,
}: IpPluginProps) => (
  <>
    {selfIpLocation ? (
      <Marker longitude={selfIpLocation.coordinates[0]} latitude={selfIpLocation.coordinates[1]} anchor="center">
        <div
          className="world-map-self-ip-marker"
          aria-label={`Your IP: ${selfIpLocation.ip} - ${selfIpLocation.city}, ${selfIpLocation.country}`}
          title={`Your IP: ${selfIpLocation.ip} - ${selfIpLocation.city}, ${selfIpLocation.country}`}
        >
          <svg viewBox="-19 -18 38 36" className="world-map-ip-node world-map-ip-svg is-self" aria-hidden="true">
            <circle className="world-map-ip-pulse" r={9} />
            <circle className="world-map-ip-ring" r={7} />
            <circle className="world-map-ip-dot" r={3.6} />
            <text className="world-map-ip-label" y={-12}>
              ME
            </text>
          </svg>
        </div>
      </Marker>
    ) : null}

    {trackedIpLocations.map((trackedIpLocation) => {
      const isActiveTrackedIp = trackedIpLocation.ip === activeTrackedIpLocation?.ip;

      return (
        <Marker
          key={trackedIpLocation.ip}
          longitude={trackedIpLocation.coordinates[0]}
          latitude={trackedIpLocation.coordinates[1]}
          anchor="center"
        >
          <button
            type="button"
            className="world-map-marker-hit"
            aria-label={`${trackedIpLocation.ip} - ${trackedIpLocation.city}, ${trackedIpLocation.country}`}
            title={`${trackedIpLocation.ip} - ${trackedIpLocation.city}, ${trackedIpLocation.country}`}
            onClick={() => onSelectTrackedIp(trackedIpLocation, true)}
            onMouseEnter={() => onSelectTrackedIp(trackedIpLocation)}
            onFocus={() => onSelectTrackedIp(trackedIpLocation)}
          >
            <svg
              viewBox="-19 -18 38 36"
              className={cn('world-map-ip-node world-map-ip-svg', isActiveTrackedIp && 'is-active')}
              aria-hidden="true"
            >
              <circle className="world-map-ip-pulse" r={isActiveTrackedIp ? 9 : 7} />
              <circle className="world-map-ip-ring" r={isActiveTrackedIp ? 7 : 6} />
              <circle className="world-map-ip-dot" r={isActiveTrackedIp ? 3.6 : 3} />
              <text className="world-map-ip-label" y={isActiveTrackedIp ? -12 : -10}>
                {formatIpLabel(trackedIpLocation.ip)}
              </text>
            </svg>
          </button>
        </Marker>
      );
    })}
  </>
);
