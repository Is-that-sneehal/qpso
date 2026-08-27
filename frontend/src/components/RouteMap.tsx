import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon asset URLs
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Frosted Circle Marker Icons
const createCustomMarker = (text: string, isStart: boolean = false, isLast: boolean = false, color: string = '#ff5719') => {
  const bg = isStart ? '#ff5719' : isLast ? '#3c95e4' : '#1e1929';
  const border = color;
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background: ${bg};
        border: 2px solid ${border};
        color: #ffffff;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: bold;
        box-shadow: 0 0 10px ${border}80;
      ">
        ${text}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

interface RouteMapProps {
  startLocation: { name: string; coords: [number, number] };
  routes?: { vehicle_id: number; stops: any[]; geometry: [number, number][] }[];
  height?: string;
}

const MapRecenter: React.FC<{ coords: [number, number] }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(coords, 11);
  }, [coords, map]);
  return null;
};

export const RouteMap: React.FC<RouteMapProps> = ({
  startLocation,
  routes = [],
  height = "500px"
}) => {
  const center: [number, number] = startLocation.coords || [40.748817, -73.985428];
  const vehicleColors = ['#ff5719', '#9dcaff', '#d0bcff', '#6000e3'];

  return (
    <div style={{ height, width: '100%' }} className="rounded-xl overflow-hidden border border-[#5c4037]">
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <MapRecenter coords={center} />

        {/* CartoDB Dark Matter Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Hub / Start Marker */}
        <Marker position={center} icon={createCustomMarker('HUB', true, false, '#ff5719')}>
          <Popup>
            <div className="text-xs">
              <strong className="text-[#ffb59e]">Origin Hub:</strong> {startLocation.name}
            </div>
          </Popup>
        </Marker>

        {/* Vehicle Routes & Stop Markers */}
        {routes.map((vRoute, rIdx) => {
          const color = vehicleColors[rIdx % vehicleColors.length];
          const positions: [number, number][] = vRoute.geometry && vRoute.geometry.length > 0
            ? vRoute.geometry
            : vRoute.stops.map(s => s.coords);

          return (
            <React.Fragment key={rIdx}>
              {/* Route Polyline */}
              <Polyline
                positions={positions}
                pathOptions={{ color, weight: 4, opacity: 0.85 }}
              />

              {/* Stop Markers */}
              {vRoute.stops.map((stop, sIdx) => {
                if (sIdx === 0) return null; // skip start hub duplicate
                const isLast = sIdx === vRoute.stops.length - 1;
                return (
                  <Marker
                    key={sIdx}
                    position={stop.coords}
                    icon={createCustomMarker(`${sIdx}`, false, isLast, color)}
                  >
                    <Popup>
                      <div className="text-xs">
                        <div className="font-bold text-[#e9def5]">Vehicle {vRoute.vehicle_id} - Stop {sIdx}</div>
                        <div className="text-[#e6beb2]">{stop.name}</div>
                        {stop.window && (
                          <div className="text-[10px] font-mono text-[#ffb59e] mt-1">
                            Window: {stop.window[0]}h - {stop.window[1]}h
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};
