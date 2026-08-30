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
  latitude: number;
  longitude: number;
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
        firstEmergency.latitude,
        firstEmergency.longitude,
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
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {emergencies.map((emergency, index) => (
        <Marker
          key={`${emergency.patientId}-${index}`}
          position={[
            emergency.latitude,
            emergency.longitude,
          ]}
          icon={redIcon}
        >
          <Popup>
            <strong>🚨 Emergency</strong>
            <br />
            Patient: {emergency.patientId}
            <br />
            Latitude: {emergency.latitude}
            <br />
            Longitude: {emergency.longitude}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default EmergencyMap;