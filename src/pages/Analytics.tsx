import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface HospitalAnalytics {
  assigned_hospital_id: string;
  assigned_hospital_name: string;
  total_emergencies: number;
  accepted_cases: number;
  rejected_cases: number;
  pending_cases: number;
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState<HospitalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error("❌ No authenticated hospital user:", userError);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("hospital_analytics")
          .select("*")
          .eq("assigned_hospital_id", user.id);

        if (error) {
          console.error("❌ Analytics fetch error:", error);
        } else if (data && data.length > 0) {
          setAnalytics(data[0]);
        } else {
          // Clean zero-state fallback
          setAnalytics({
            assigned_hospital_id: user.id,
            assigned_hospital_name: "Hospital",
            total_emergencies: 0,
            accepted_cases: 0,
            rejected_cases: 0,
            pending_cases: 0,
          });
        }
      } catch (err) {
        console.error("Unexpected error fetching analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-lg font-semibold text-slate-600">Loading metrics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-3xl font-bold text-slate-900">
          {analytics?.assigned_hospital_name ?? "Hospital"} Performance Analytics
        </h1>
        <p className="mb-8 text-slate-500">
          Aggregated response telemetry and intake statistics
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm font-medium text-slate-500">Total Emergencies</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {analytics?.total_emergencies ?? 0}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm font-medium text-slate-500">Accepted</p>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {analytics?.accepted_cases ?? 0}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm font-medium text-slate-500">Rejected / Diverted</p>
            <p className="mt-2 text-3xl font-bold text-red-600">
              {analytics?.rejected_cases ?? 0}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm font-medium text-slate-500">Pending Intake</p>
            <p className="mt-2 text-3xl font-bold text-amber-500">
              {analytics?.pending_cases ?? 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}