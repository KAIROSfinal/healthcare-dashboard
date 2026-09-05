import React, { useEffect, useState, useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Create custom ambulance icon using SVG data URI
const ambulanceIcon = L.divIcon({
  className: "custom-ambulance-icon",
  html: `
    <div style="
      background-color: #ffffff;
      border: 2px solid #ef4444;
      border-radius: 50%;
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.35);
      font-size: 20px;
    ">
      🚑
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -20],
});

interface AnimatedAmbulanceMarkerProps {
  routeCoordinates: [number, number][]; // Array of [lat, lng]
  durationSeconds?: number; // Total trip duration
  hospitalName?: string;
}

// Helper: Haversine distance in meters between two [lat, lng] points
function getDistance(p1: [number, number], p2: [number, number]): number {
  const R = 6371e3; // Earth radius in meters
  const dLat = ((p2[0] - p1[0]) * Math.PI) / 180;
  const dLng = ((p2[1] - p1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1[0] * Math.PI) / 180) *
      Math.cos((p2[0] * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const AnimatedAmbulanceMarker: React.FC<AnimatedAmbulanceMarkerProps> = ({
  routeCoordinates,
  durationSeconds = 60,
  hospitalName = "Ambulance",
}) => {
  const [currentPos, setCurrentPos] = useState<[number, number]>(
    routeCoordinates[0] || [0, 0]
  );
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!routeCoordinates || routeCoordinates.length < 2) return;

    // 1. Compute cumulative distance along the path segments
    const distances: number[] = [0];
    let totalDistance = 0;

    for (let i = 0; i < routeCoordinates.length - 1; i++) {
      const d = getDistance(routeCoordinates[i], routeCoordinates[i + 1]);
      totalDistance += d;
      distances.push(totalDistance);
    }

    if (totalDistance === 0) return;

    // Use simulated playback duration (caps long trips to max 60s for clear UI demo)
    const animationDurationMs = Math.min(
      Math.max(durationSeconds * 1000, 15000),
      60000
    );
    const startTime = performance.now();

    // 2. Linear interpolation loop
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDurationMs, 1);
      const targetDistance = progress * totalDistance;

      // Locate the active polyline segment
      let segmentIndex = 0;
      for (let i = 0; i < distances.length - 1; i++) {
        if (
          targetDistance >= distances[i] &&
          targetDistance <= distances[i + 1]
        ) {
          segmentIndex = i;
          break;
        }
      }

      const segStartDist = distances[segmentIndex];
      const segEndDist = distances[segmentIndex + 1];
      const segLength = segEndDist - segStartDist;

      const p1 = routeCoordinates[segmentIndex];
      const p2 = routeCoordinates[segmentIndex + 1];

      if (segLength > 0 && p1 && p2) {
        const segRatio = (targetDistance - segStartDist) / segLength;
        const lat = p1[0] + (p2[0] - p1[0]) * segRatio;
        const lng = p1[1] + (p2[1] - p1[1]) * segRatio;
        setCurrentPos([lat, lng]);
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Snap to final arrival coordinate
        setCurrentPos(routeCoordinates[routeCoordinates.length - 1]);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [routeCoordinates, durationSeconds]);

  if (!routeCoordinates || routeCoordinates.length < 2) return null;

  return (
    <Marker position={currentPos} icon={ambulanceIcon}>
      <Popup>
        <strong>🚑 En Route Unit</strong>
        <br />
        Facility: {hospitalName}
      </Popup>
    </Marker>
  );
};