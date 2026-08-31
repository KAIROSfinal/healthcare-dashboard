import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

interface Emergency {
  patientId: string;

  location: {
    lat: number;
    lng: number;
  };

  hospitalName: string;
  etaMinutes: number | null;
}

interface EmergencyMapProps {
  emergencies: Emergency[];
}

const EmergencyMap = ({
  emergencies,
}: EmergencyMapProps) => {
  const defaultPosition: [number, number] = [
    13.0827,
    80.2707,
  ];

  const firstEmergency = emergencies[0];

  const center: [number, number] = firstEmergency
    ? [
        firstEmergency.location.lat,
        firstEmergency.location.lng,
      ]
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
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {emergencies.map((emergency, index) => (
        <Marker
          key={`${emergency.patientId}-${index}`}
          position={[
            emergency.location.lat,
            emergency.location.lng,
          ]}
          icon={redIcon}
        >
          <Popup>
            <strong>🚨 Emergency</strong>

            <br />

            Patient: {emergency.patientId}

            <br />

            Latitude: {emergency.location.lat}

            <br />

            Longitude: {emergency.location.lng}

            <br />

            Hospital: {emergency.hospitalName}

            <br />

            ETA:{" "}
            {emergency.etaMinutes !== null
              ? `${emergency.etaMinutes} minutes`
              : "Calculating..."}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default EmergencyMap;