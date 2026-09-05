import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { AnimatedAmbulanceMarker } from "./AnimatedAmbulanceMarker";

const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface Emergency {
  patientId: string;
  location: {
    lat: number;
    lng: number;
  };
  hospitalName: string;
  etaMinutes: number | null;
  routeCoordinates?: [number, number][];
}

interface EmergencyMapProps {
  emergencies: Emergency[];
}

function AutoFitBounds({ emergencies }: { emergencies: Emergency[] }) {
  const map = useMap();

  useEffect(() => {
    const validEmergencies = emergencies.filter(
      (e) => Number.isFinite(e.location?.lat) && Number.isFinite(e.location?.lng)
    );

    if (validEmergencies.length === 0) return;

    const allPoints: [number, number][] = [];
    validEmergencies.forEach((e) => {
      allPoints.push([e.location.lat, e.location.lng]);
      if (e.routeCoordinates && e.routeCoordinates.length > 0) {
        allPoints.push(...e.routeCoordinates);
      }
    });

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [emergencies, map]);

  return null;
}

const EmergencyMap = ({ emergencies }: EmergencyMapProps) => {
  const defaultPosition: [number, number] = [13.0827, 80.2707];

  const firstEmergency = emergencies.find(
    (emergency) =>
      Number.isFinite(emergency.location?.lat) &&
      Number.isFinite(emergency.location?.lng)
  );

  const center: [number, number] = firstEmergency
    ? [firstEmergency.location.lat, firstEmergency.location.lng]
    : defaultPosition;

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{
        height: "500px",
        width: "100%",
      }}
    >
      <AutoFitBounds emergencies={emergencies} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {emergencies.map((emergency, index) => {
        if (
          !Number.isFinite(emergency.location?.lat) ||
          !Number.isFinite(emergency.location?.lng)
        ) {
          return null;
        }

        const hasRoute =
          emergency.routeCoordinates && emergency.routeCoordinates.length > 1;

        return (
          <div key={`${emergency.patientId}-${index}`}>
            {/* Patient Pin */}
            <Marker
              position={[emergency.location.lat, emergency.location.lng]}
              icon={redIcon}
            >
              <Popup>
                <strong>🚨 Emergency</strong>
                <br />
                Patient: {emergency.patientId}
                <br />
                Target: {emergency.hospitalName}
              </Popup>
            </Marker>

            {/* Static Route Polylines */}
            {hasRoute && (
              <>
                <Polyline
                  positions={emergency.routeCoordinates!}
                  pathOptions={{
                    color: "#ef4444",
                    weight: 7,
                    opacity: 0.35,
                    lineCap: "round",
                  }}
                />
                <Polyline
                  positions={emergency.routeCoordinates!}
                  pathOptions={{
                    color: "#dc2626",
                    weight: 3.5,
                    dashArray: "6, 8",
                    opacity: 0.9,
                  }}
                />

                {/* Animated Moving Ambulance Marker */}
                <AnimatedAmbulanceMarker
                  routeCoordinates={emergency.routeCoordinates!}
                  durationSeconds={(emergency.etaMinutes ?? 1) * 60}
                  hospitalName={emergency.hospitalName}
                />
              </>
            )}
          </div>
        );
      })}
    </MapContainer>
  );
};

export default EmergencyMap;