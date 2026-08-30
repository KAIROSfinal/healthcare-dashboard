import { useEffect, useState } from "react";
import { socket } from "../services/socket";
import type { EmergencyIncident } from "../types/emergency";
import EmergencyMap from "../components/EmergencyMap";

export default function Dashboard() {
  const [incidents, setIncidents] = useState<EmergencyIncident[]>([]);

  useEffect(() => {
    const handleEmergency = (incident: EmergencyIncident) => {
      console.log("Emergency received:", incident);

      setIncidents((previous) => [
        incident,
        ...previous,
      ]);
    };

    socket.on("EMERGENCY_BROADCAST", handleEmergency);

    return () => {
      socket.off("EMERGENCY_BROADCAST", handleEmergency);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <h1 className="mb-2 text-3xl font-bold text-slate-900">
        Hospital Emergency Dashboard
      </h1>

      <p className="mb-8 text-slate-500">
        Real-time incoming emergency incidents
      </p>
      <div className="mb-8 overflow-hidden rounded-xl bg-white shadow">
  <EmergencyMap emergencies={incidents} />
</div>

      {incidents.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow">
          <p className="text-slate-500">
            No active emergency incidents
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {incidents.map((incident, index) => (
            <div
              key={`${incident.patientId}-${incident.timestamp}-${index}`}
              className="rounded-xl border-l-4 border-red-600 bg-white p-6 shadow"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-red-600">
                  🚨 Emergency Alert
                </h2>

                <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
                  {incident.status ?? "Emergency"}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-slate-500">
                    Patient ID
                  </p>
                  <p className="font-semibold">
                    {incident.patientId}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Latitude
                  </p>
                  <p className="font-semibold">
                    {incident.latitude}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Longitude
                  </p>
                  <p className="font-semibold">
                    {incident.longitude}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}