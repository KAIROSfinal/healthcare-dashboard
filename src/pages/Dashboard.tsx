import { useEffect, useState } from "react";
import { socket } from "../services/socket";
import type { EmergencyIncident } from "../types/emergency";
import EmergencyMap from "../components/EmergencyMap";

type IncidentAction = "Accepted" | "Rejected";

interface IncidentWithAction extends EmergencyIncident {
  action?: IncidentAction;
}

export default function Dashboard() {
  const [incidents, setIncidents] = useState<IncidentWithAction[]>([]);

  useEffect(() => {
    const handleEmergency = (incident: EmergencyIncident) => {
      console.log("🚨 Emergency received:", incident);

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

  // ACCEPT EMERGENCY
  const handleAccept = (
    patientId: string,
    hospitalName: string,
    index: number
  ) => {
    console.log("✅ HOSPITAL_ACCEPTED", {
      patientId,
      hospitalName,
    });

    // Send event to backend
    socket.emit("HOSPITAL_ACCEPTED", {
      patientId,
      hospitalName,
    });

    // Update local UI immediately
    setIncidents((previous) =>
      previous.map((incident, i) =>
        i === index
          ? {
              ...incident,
              action: "Accepted",
            }
          : incident
      )
    );
  };

  // REJECT EMERGENCY
  const handleReject = (
    patientId: string,
    hospitalName: string,
    index: number
  ) => {
    console.log("❌ HOSPITAL_REJECTED", {
      patientId,
      hospitalName,
    });

    // Send event to backend
    socket.emit("HOSPITAL_REJECTED", {
      patientId,
      hospitalName,
    });

    // Update local UI immediately
    setIncidents((previous) =>
      previous.map((incident, i) =>
        i === index
          ? {
              ...incident,
              action: "Rejected",
            }
          : incident
      )
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">

      {/* HEADER */}
      <h1 className="mb-2 text-3xl font-bold text-slate-900">
        Hospital Emergency Dashboard
      </h1>

      <p className="mb-8 text-slate-500">
        Real-time incoming emergency incidents
      </p>

      {/* MAP */}
      <div className="mb-8 overflow-hidden rounded-xl bg-white shadow">
        <EmergencyMap emergencies={incidents} />
      </div>

      {/* INCIDENTS */}
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
              className={`rounded-xl border-l-4 bg-white p-6 shadow transition-all ${
                incident.action === "Accepted"
                  ? "border-green-600"
                  : incident.action === "Rejected"
                  ? "border-red-600 opacity-70"
                  : "border-red-600"
              }`}
            >

              {/* CARD HEADER */}
              <div className="mb-4 flex items-center justify-between">

                <h2
                  className={`text-xl font-bold ${
                    incident.action === "Accepted"
                      ? "text-green-600"
                      : incident.action === "Rejected"
                      ? "text-red-600"
                      : "text-red-600"
                  }`}
                >
                  {incident.action === "Accepted"
                    ? "✅ Emergency Accepted"
                    : incident.action === "Rejected"
                    ? "❌ Emergency Rejected"
                    : "🚨 Emergency Alert"}
                </h2>

                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    incident.action === "Accepted"
                      ? "bg-green-100 text-green-700"
                      : incident.action === "Rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {incident.action ??
                    incident.status ??
                    "Emergency"}
                </span>

              </div>

              {/* INCIDENT DETAILS */}
              <div className="grid gap-3 sm:grid-cols-4">

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
                    {incident.location.lat}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Longitude
                  </p>

                  <p className="font-semibold">
                    {incident.location.lng}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Hospital
                  </p>

                  <p className="font-semibold">
                    {incident.hospitalName}
                  </p>
                </div>

              </div>

              {/* ETA */}
              <div className="mt-4">
                <p className="text-sm text-slate-500">
                  ETA
                </p>

                <p className="font-semibold">
                  {incident.etaMinutes !== null
                    ? `${incident.etaMinutes} minutes`
                    : "Calculating..."}
                </p>
              </div>

              {/* ACTION BUTTONS */}
              {!incident.action && (

                <div className="mt-6 flex gap-4">

                  <button
                    onClick={() =>
                      handleAccept(
                        incident.patientId,
                        incident.hospitalName,
                        index
                      )
                    }
                    className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
                  >
                    ✅ Accept Emergency
                  </button>

                  <button
                    onClick={() =>
                      handleReject(
                        incident.patientId,
                        incident.hospitalName,
                        index
                      )
                    }
                    className="rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
                  >
                    ❌ Reject - Capacity Full
                  </button>

                </div>

              )}

            </div>

          ))}

        </div>

      )}

    </div>
  );
}