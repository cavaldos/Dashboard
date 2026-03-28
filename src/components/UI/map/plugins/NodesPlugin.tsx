import { Layer, Marker, Source, type LayerProps } from 'react-map-gl/maplibre';

import { cn } from '~/lib/utils';

import type { MapLineFeatureCollection, MapNode } from '../types';

type NodesPluginProps = {
  mapNodes: MapNode[];
  activeNode: MapNode | null;
  connectionLinesData: MapLineFeatureCollection;
  connectionLineLayer: LayerProps;
  connectionActiveLineLayer: LayerProps;
  metricFormatter: Intl.NumberFormat;
  onSelectNode: (node: MapNode, shouldFocus?: boolean) => void;
};

export const NodesPlugin = ({
  mapNodes,
  activeNode,
  connectionLinesData,
  connectionLineLayer,
  connectionActiveLineLayer,
  metricFormatter,
  onSelectNode,
}: NodesPluginProps) => (
  <>
    <Source id="world-map-connections" type="geojson" data={connectionLinesData}>
      <Layer {...connectionLineLayer} />
      <Layer {...connectionActiveLineLayer} />
    </Source>

    {mapNodes.map((node) => {
      const isActive = activeNode ? node.id === activeNode.id : false;

      return (
        <Marker key={node.id} longitude={node.coordinates[0]} latitude={node.coordinates[1]} anchor="center">
          <button
            type="button"
            className="world-map-marker-hit"
            aria-label={`${node.label}: ${metricFormatter.format(node.value)}`}
            title={`${node.label}: ${metricFormatter.format(node.value)}`}
            onClick={() => onSelectNode(node, true)}
            onMouseEnter={() => onSelectNode(node)}
            onFocus={() => onSelectNode(node)}
          >
            <svg
              viewBox="-18 -18 36 36"
              className={cn('world-map-node world-map-node-svg', isActive && 'is-active')}
              aria-hidden="true"
            >
              <circle className="world-map-pulse pulse-1" r={isActive ? 8 : 6} />
              <circle className="world-map-pulse pulse-2" r={isActive ? 8 : 6} />
              <circle className="world-map-pulse pulse-3" r={isActive ? 8 : 6} />
              <circle className="world-map-ring" r={isActive ? 7 : 6} />
              <circle className="world-map-dot" r={isActive ? 3.4 : 3} />
              <text className="world-map-label" y={isActive ? -11 : -10}>
                {node.id}
              </text>
            </svg>
          </button>
        </Marker>
      );
    })}
  </>
);
