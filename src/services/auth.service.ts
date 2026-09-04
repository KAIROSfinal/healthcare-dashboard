import { supabase } from "../lib/supabase";

export interface Hospital {
  id: string;
  name: string;
}

export interface LoginResponse {
  access_token: string;
  hospital: Hospital;
}

export const loginHospital = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  // 1. Login using Supabase Auth
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    console.error("❌ Supabase login error:", error);
    throw error;
  }

  if (!data.session) {
    throw new Error("No Supabase session returned.");
  }

  // 2. Get JWT access token
  const accessToken = data.session.access_token;

  if (!accessToken) {
    throw new Error("No access token received.");
  }

  // 3. Hospital information provided by Member 3
  const hospital: Hospital = {
    id: "24296dda-2601-47b0-84d2-ea87de437410",
    name: "City General Hospital",
  };

  // 4. Save authentication information
  localStorage.setItem(
    "access_token",
    accessToken
  );

  localStorage.setItem(
    "hospital",
    JSON.stringify(hospital)
  );

  // 5. Debug logs
  console.log("✅ Supabase login successful");
  console.log("🏥 Hospital:", hospital);
  console.log("🔑 Access token received");
  console.log(
    "💾 Access token saved:",
    !!localStorage.getItem("access_token")
  );

  return {
    access_token: accessToken,
    hospital,
  };
};

export const logoutHospital = async () => {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error("❌ Logout error:", error);
  }

  // Remove locally stored authentication data
  localStorage.removeItem("access_token");
  localStorage.removeItem("hospital");

  console.log("🚪 Hospital logged out");
};