import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginHospital } from "../services/auth.service";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const data = await loginHospital(email, password);

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem(
        "hospital",
        JSON.stringify(data.hospital)
      );

      console.log("✅ Login successful:", data.hospital);

      navigate("/dashboard");
    } catch (error: any) {
      console.error("❌ Login failed:", error);

      setError(
        error?.response?.data?.message ||
          "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg"
      >
        <h1 className="mb-2 text-3xl font-bold text-slate-900">
          Hospital Login
        </h1>

        <p className="mb-8 text-slate-500">
          Sign in to access the emergency dashboard
        </p>

        {error && (
          <div className="mb-5 rounded-lg bg-red-100 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <label className="mb-2 block font-medium">
          Email
        </label>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="hospital@example.com"
          required
          className="mb-5 w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500"
        />

        <label className="mb-2 block font-medium">
          Password
        </label>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password123"
          required
          className="mb-6 w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}