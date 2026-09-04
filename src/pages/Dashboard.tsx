import { useEffect, useState, useRef } from "react";
import { createSocket } from "../services/socket";
import type { EmergencyIncident } from "../types/emergency";
import EmergencyMap from "../components/EmergencyMap";
import { supabase } from "../lib/supabase";

type IncidentAction = "Accepted" | "Rejected";

interface IncidentWithAction extends EmergencyIncident {
  action?: IncidentAction;
}

interface HospitalAnalytics {
  assigned_hospital_name: string;
  total_emergencies: number;
  accepted_cases: number;
  rejected_cases: number;
}

export default function Dashboard() {
  const [incidents, setIncidents] = useState<
    IncidentWithAction[]
  >([]);

  const [analytics, setAnalytics] = useState<
    HospitalAnalytics[]
  >([]);

  // Authenticated Socket.IO connection
  const socketRef = useRef<any>(null);

  // ========================================
  // FETCH HOSPITAL ANALYTICS
  // ========================================

  const fetchAnalytics = async () => {
    const { data, error } = await supabase
      .from("hospital_analytics")
      .select("*");

    if (error) {
      console.error("❌ Analytics Error:", error);
      return;
    }

    console.log("📊 Hospital Analytics:", data);

    setAnalytics(data ?? []);
  };

  // ========================================
  // LOAD ANALYTICS
  // ========================================

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // ========================================
  // AUTHENTICATED SOCKET.IO
  // ========================================

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      console.error("❌ No access token found");
      return;
    }

    console.log(
      "🔑 Dashboard socket token exists:",
      !!token
    );

    const socket = createSocket(token);

    socketRef.current = socket;

    const handleEmergency = (
      incident: EmergencyIncident
    ) => {
      console.log(
        "🚨 Emergency received:",
        incident
      );

      setIncidents((previous) => [
        incident,
        ...previous,
      ]);
    };

    socket.on(
      "EMERGENCY_BROADCAST",
      handleEmergency
    );

    return () => {
      socket.off(
        "EMERGENCY_BROADCAST",
        handleEmergency
      );

      socket.disconnect();

      socketRef.current = null;
    };
  }, []);

  // ========================================
  // ACCEPT EMERGENCY
  // ========================================

  const handleAccept = (
    patientId: string,
    hospitalName: string,
    index: number
  ) => {
    console.log("✅ HOSPITAL_ACCEPTED", {
      patientId,
      hospitalName,
    });

    // Emit through authenticated socket
    socketRef.current?.emit(
      "HOSPITAL_ACCEPTED",
      {
        patientId,
        hospitalName,
      }
    );

    // Update UI immediately
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

    // Refresh analytics
    setTimeout(() => {
      fetchAnalytics();
    }, 1000);
  };

  // ========================================
  // REJECT EMERGENCY
  // ========================================

  const handleReject = (
    patientId: string,
    hospitalName: string,
    index: number
  ) => {
    console.log("❌ HOSPITAL_REJECTED", {
      patientId,
      hospitalName,
    });

    // Emit through authenticated socket
    socketRef.current?.emit(
      "HOSPITAL_REJECTED",
      {
        patientId,
        hospitalName,
      }
    );

    // Update UI immediately
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

    // Refresh analytics
    setTimeout(() => {
      fetchAnalytics();
    }, 1000);
  };

  // ========================================
  // SYSTEM STATISTICS
  // ========================================

  const totalEmergencies = analytics.reduce(
    (total, hospital) =>
      total +
      Number(
        hospital.total_emergencies || 0
      ),
    0
  );

  const totalAccepted = analytics.reduce(
    (total, hospital) =>
      total +
      Number(
        hospital.accepted_cases || 0
      ),
    0
  );

  const totalRejected = analytics.reduce(
    (total, hospital) =>
      total +
      Number(
        hospital.rejected_cases || 0
      ),
    0
  );

  // ========================================
  // UI
  // ========================================

  return (
    <div className="min-h-screen bg-slate-100 p-8">

      {/* HEADER */}

      <h1 className="mb-2 text-3xl font-bold text-slate-900">
        Hospital Emergency Dashboard
      </h1>

      <p className="mb-8 text-slate-500">
        Real-time incoming emergency incidents
      </p>

      {/* =====================================
          SYSTEM STATS
      ====================================== */}

      <div className="mb-8">

        <h2 className="mb-4 text-xl font-bold text-slate-900">
          📊 System Stats
        </h2>

        <div className="grid gap-4 md:grid-cols-3">

          {/* TOTAL */}

          <div className="rounded-xl bg-white p-6 shadow">

            <p className="text-sm font-medium text-slate-500">
              Total Emergencies
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {totalEmergencies}
            </p>

          </div>

          {/* ACCEPTED */}

          <div className="rounded-xl bg-white p-6 shadow">

            <p className="text-sm font-medium text-slate-500">
              Accepted
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {totalAccepted}
            </p>

          </div>

          {/* REJECTED */}

          <div className="rounded-xl bg-white p-6 shadow">

            <p className="text-sm font-medium text-slate-500">
              Rejected
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {totalRejected}
            </p>

          </div>

        </div>

      </div>

      {/* =====================================
          HOSPITAL ANALYTICS
      ====================================== */}

      {analytics.length > 0 && (
        <div className="mb-8 rounded-xl bg-white p-6 shadow">

          <h2 className="mb-4 text-xl font-bold text-slate-900">
            🏥 Hospital Analytics
          </h2>

          <div className="space-y-4">

            {analytics.map((hospital) => (

              <div
                key={
                  hospital.assigned_hospital_name
                }
                className="rounded-lg border border-slate-200 p-4"
              >

                <h3 className="mb-3 font-bold text-slate-800">
                  {hospital.assigned_hospital_name}
                </h3>

                <div className="grid gap-3 sm:grid-cols-3">

                  {/* TOTAL */}

                  <div>

                    <p className="text-sm text-slate-500">
                      Total Emergencies
                    </p>

                    <p className="text-xl font-bold text-slate-900">
                      {hospital.total_emergencies}
                    </p>

                  </div>

                  {/* ACCEPTED */}

                  <div>

                    <p className="text-sm text-slate-500">
                      Accepted
                    </p>

                    <p className="text-xl font-bold text-green-600">
                      {hospital.accepted_cases}
                    </p>

                  </div>

                  {/* REJECTED */}

                  <div>

                    <p className="text-sm text-slate-500">
                      Rejected
                    </p>

                    <p className="text-xl font-bold text-red-600">
                      {hospital.rejected_cases}
                    </p>

                  </div>

                </div>

              </div>

            ))}

          </div>

        </div>
      )}

      {/* =====================================
          LIVE MAP
      ====================================== */}

      <div className="mb-8 overflow-hidden rounded-xl bg-white shadow">

        <EmergencyMap
          emergencies={incidents}
        />

      </div>

      {/* =====================================
          INCIDENTS
      ====================================== */}

      {incidents.length === 0 ? (

        <div className="rounded-xl bg-white p-8 text-center shadow">

          <p className="text-slate-500">
            No active emergency incidents
          </p>

        </div>

      ) : (

        <div className="space-y-4">

          {incidents.map(
            (incident, index) => (

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

                    {/* ACCEPT */}

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

                    {/* REJECT */}

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

            )
          )}

        </div>

      )}

    </div>
  );
}