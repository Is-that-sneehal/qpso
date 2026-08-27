import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon default URLs for React bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Frosted SVG Circle Marker Icons
const createCustomMarker = (text: string, isStart: boolean = false, isLast: boolean = false, color: string = '#ff5719') => {
  const bg = isStart ? '#ff5719' : isLast ? '#3c95e4' : '#110b1b';
  const border = color;
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background: ${bg};
        border: 2px solid ${border};
        color: #ffffff;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: monospace;
        font-size: 11px;
        font-weight: bold;
        box-shadow: 0 0 12px ${border}a0;
      ">
        ${text}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

interface RouteMapProps {
  startLocation: { name: string; coords: [number, number] };
  routes?: { vehicle_id: number; stops: any[]; geometry: [number, number][] }[];
  height?: string;
}

const MapBoundsManager: React.FC<{
  startCoords: [number, number];
  routes: { vehicle_id: number; stops: any[]; geometry: [number, number][] }[];
}> = ({ startCoords, routes }) => {
  const map = useMap();

  useEffect(() => {
    const allCoords: [number, number][] = [startCoords];

    routes.forEach(r => {
      if (r.geometry && r.geometry.length > 0) {
        r.geometry.forEach(g => allCoords.push(g));
      } else if (r.stops && r.stops.length > 0) {
        r.stops.forEach(s => allCoords.push(s.coords));
      }
    });

    if (allCoords.length > 1) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else {
      map.setView(startCoords, 12);
    }
  }, [startCoords, routes, map]);

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
    <div style={{ height, width: '100%' }} className="rounded-xl overflow-hidden border border-[#5c4037] relative z-0">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <MapBoundsManager startCoords={center} routes={routes} />

        {/* Free Open-Source Dark Tile Layer (No API Key Required) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        {/* Hub / Start Marker */}
        <Marker position={center} icon={createCustomMarker('HUB', true, false, '#ff5719')}>
          <Popup>
            <div className="text-xs font-sans p-1">
              <strong className="text-[#ff5719]">Origin Hub:</strong>
              <div className="text-[#e9def5] mt-0.5">{startLocation.name}</div>
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
                pathOptions={{ color, weight: 5, opacity: 0.9 }}
              />

              {/* Stop Markers */}
              {vRoute.stops.map((stop, sIdx) => {
                if (sIdx === 0 && vRoute.stops.length > 1) return null; // skip duplicate start node marker
                const isLast = sIdx === vRoute.stops.length - 1;
                return (
                  <Marker
                    key={sIdx}
                    position={stop.coords}
                    icon={createCustomMarker(`${sIdx}`, false, isLast, color)}
                  >
                    <Popup>
                      <div className="text-xs font-sans p-1">
                        <div className="font-bold text-[#e9def5]">Vehicle {vRoute.vehicle_id} - Stop {sIdx}</div>
                        <div className="text-[#e6beb2]">{stop.name}</div>
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
