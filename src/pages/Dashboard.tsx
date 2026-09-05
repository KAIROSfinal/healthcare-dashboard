import { useEffect, useState, useRef } from "react";
import { createSocket } from "../services/socket";
import type { EmergencyIncident } from "../types/emergency";
import EmergencyMap from "../components/EmergencyMap";
import { supabase } from "../lib/supabase";
import { soundService } from "../services/audio";

type IncidentAction = "Accepted" | "Rejected";

interface IncidentWithAction extends EmergencyIncident {
  action?: IncidentAction;
  remainingSeconds?: number;
  routeCoordinates?: [number, number][];
}

interface HospitalAnalytics {
  assigned_hospital_name: string;
  total_emergencies: number;
  accepted_cases: number;
  rejected_cases: number;
}

export default function Dashboard() {
  const [incidents, setIncidents] = useState<IncidentWithAction[]>([]);
  const [analytics, setAnalytics] = useState<HospitalAnalytics[]>([]);
  const [hospitalName, setHospitalName] = useState("Hospital");
  const [availableBeds, setAvailableBeds] = useState<number>(0);

  const socketRef = useRef<any>(null);

  const fetchAnalytics = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return;

    const { data, error } = await supabase
      .from("hospital_analytics")
      .select("*")
      .eq("assigned_hospital_id", user.id);

    if (!error) {
      setAnalytics(data ?? []);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Hydrate Pending Incidents
  useEffect(() => {
    const hydratePendingIncidents = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) return;

      const { data, error } = await supabase
        .from("EmergencyIncident")
        .select("*")
        .eq("assigned_hospital_id", user.id)
        .eq("status", "PENDING")
        .order("createdAt", { ascending: false })
        .limit(5);

      if (!error && data) {
        const mapped = data.map((incident: any) => {
          const eta =
            incident.etaMinutes ??
            incident.eta_minutes ??
            (incident.eta_seconds ? Math.round(incident.eta_seconds / 60) : 5);

          return {
            ...incident,
            patientId: incident.patientId ?? incident.patient_id,
            hospitalName: incident.assigned_hospital_name ?? "Hospital",
            etaMinutes: eta,
            remainingSeconds: Number(eta) * 60,
            routeCoordinates: incident.routeCoordinates || [],
            location: {
              lat: incident.latitude ?? incident.lat ?? incident.location?.lat,
              lng: incident.longitude ?? incident.lng ?? incident.location?.lng,
            },
          };
        });
        setIncidents(mapped);
      }
    };

    hydratePendingIncidents();
  }, []);

  // Fetch Hospital Bed Capacity & Profile
  useEffect(() => {
    const loadHospitalProfile = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) return;

      const { data, error } = await supabase
        .from("hospitals")
        .select("name, available_beds")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setHospitalName(data.name);
        setAvailableBeds(data.available_beds ?? 0);
      }
    };

    loadHospitalProfile();
  }, []);

  // Countdown Interval Loop
  useEffect(() => {
    const timer = setInterval(() => {
      setIncidents((prev) =>
        prev.map((inc) => {
          if (inc.remainingSeconds !== undefined && inc.remainingSeconds > 0) {
            return { ...inc, remainingSeconds: inc.remainingSeconds - 1 };
          }
          return inc;
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Authenticated Real-Time Socket
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const socket = createSocket(token);
    socketRef.current = socket;

    const handleEmergency = (incident: any) => {
      soundService.playEmergencyChime();

      const eta =
        incident.etaMinutes ??
        incident.eta_minutes ??
        (incident.eta_seconds ? Math.round(incident.eta_seconds / 60) : 5);

      const mappedIncident: IncidentWithAction = {
        ...incident,
        patientId: incident.patientId ?? incident.patient_id,
        hospitalName: incident.hospitalName ?? "Hospital",
        etaMinutes: eta,
        remainingSeconds: Number(eta) * 60,
        routeCoordinates: incident.routeCoordinates || [],
        location: {
          lat: incident.latitude ?? incident.lat ?? incident.location?.lat,
          lng: incident.longitude ?? incident.lng ?? incident.location?.lng,
        },
      };

      setIncidents((prev) => [mappedIncident, ...prev]);
    };

    socket.on("EMERGENCY_BROADCAST", handleEmergency);

    return () => {
      socket.off("EMERGENCY_BROADCAST", handleEmergency);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const handleAccept = (patientId: string, hospitalName: string, index: number) => {
    socketRef.current?.emit("HOSPITAL_ACCEPTED", { patientId, hospitalName });
    setAvailableBeds((prev) => Math.max(0, prev - 1));

    setIncidents((prev) =>
      prev.map((incident, i) =>
        i === index ? { ...incident, action: "Accepted" } : incident
      )
    );

    setTimeout(fetchAnalytics, 1000);
  };

  const handleReject = (patientId: string, hospitalName: string, index: number) => {
    socketRef.current?.emit("HOSPITAL_REJECTED", { patientId, hospitalName });

    setIncidents((prev) =>
      prev.map((incident, i) =>
        i === index ? { ...incident, action: "Rejected" } : incident
      )
    );

    setTimeout(fetchAnalytics, 1000);
  };

  const formatCountdown = (seconds?: number) => {
    if (seconds === undefined || isNaN(seconds)) return "Calculating...";
    if (seconds <= 0) return "Arriving Now";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  const totalEmergencies = analytics.reduce(
    (acc, h) => acc + Number(h.total_emergencies || 0),
    0
  );
  const totalAccepted = analytics.reduce(
    (acc, h) => acc + Number(h.accepted_cases || 0),
    0
  );
  const totalRejected = analytics.reduce(
    (acc, h) => acc + Number(h.rejected_cases || 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {hospitalName} Emergency Dashboard
          </h1>
          <p className="text-slate-500">Real-time emergency telemetry feed</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Available Beds
          </p>
          <p className="text-2xl font-bold text-blue-600">{availableBeds}</p>
        </div>
      </div>

      {/* System Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-sm font-medium text-slate-500">Total Emergencies</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{totalEmergencies}</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-sm font-medium text-slate-500">Accepted</p>
          <p className="mt-2 text-3xl font-bold text-green-600">{totalAccepted}</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-sm font-medium text-slate-500">Rejected</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{totalRejected}</p>
        </div>
      </div>

      {/* Map */}
      <div className="mb-8 overflow-hidden rounded-xl bg-white shadow">
        <EmergencyMap emergencies={incidents} />
      </div>

      {/* Incident Stream */}
      {incidents.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow">
          <p className="text-slate-500">No active emergency incidents</p>
        </div>
      ) : (
        <div className="space-y-4">
          {incidents.map((incident, index) => (
            <div
              key={`${incident.patientId}-${index}`}
              className={`rounded-xl border-l-4 bg-white p-6 shadow transition-all ${
                incident.action === "Accepted"
                  ? "border-green-600"
                  : incident.action === "Rejected"
                  ? "border-red-600 opacity-60"
                  : "border-red-600 animate-pulse-once"
              }`}
            >
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
                    : "🚨 Emergency Dispatched"}
                </h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-sm font-semibold text-slate-700">
                  ⏱️ {formatCountdown(incident.remainingSeconds)}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-slate-500">Patient ID</p>
                  <p className="font-semibold">{incident.patientId}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Coordinates</p>
                  <p className="font-semibold">
                    {incident.location?.lat?.toFixed(4)}, {incident.location?.lng?.toFixed(4)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Target Hospital</p>
                  <p className="font-semibold">{incident.hospitalName}</p>
                </div>
              </div>

              {!incident.action && (
                <div className="mt-6 flex gap-4">
                  <button
                    onClick={() =>
                      handleAccept(incident.patientId, incident.hospitalName, index)
                    }
                    className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
                  >
                    ✅ Accept Emergency
                  </button>
                  <button
                    onClick={() =>
                      handleReject(incident.patientId, incident.hospitalName, index)
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