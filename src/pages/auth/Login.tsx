import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useState } from "react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleQuick = (role: "ADMIN" | "DOCTOR" | "PATIENT") => {
    // Demo quick-login without backend (keeps original behavior)
    localStorage.setItem("role", role);
    if (role === "ADMIN") navigate("/admin/dashboard");
    if (role === "DOCTOR") navigate("/doctor/dashboard");
    if (role === "PATIENT") navigate("/patient/dashboard");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || "Login failed");
      }

      const token = body.accessToken;
      const user = body.user;
      if (token) localStorage.setItem("accessToken", token);
      if (user) {
        if (user.role) localStorage.setItem("role", user.role);
        if (user.id) {
          localStorage.setItem("userId", user.id);
          localStorage.setItem("user", JSON.stringify(user));
        }
      }

      // Redirect based on role
      const role = user?.role;
      if (role === "ADMIN") navigate("/admin/dashboard");
      else if (role === "DOCTOR") navigate("/doctor/dashboard");
      else navigate("/patient/dashboard");
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-6">

        {/* Left demo / slogan panel */}
        <div className="hidden md:flex flex-col justify-center gap-6 px-6">
          <div className="max-w-lg">
            <h2 className="text-3xl font-bold text-slate-800">Manage appointments effortlessly</h2>
            <p className="mt-3 text-slate-600">Quickly schedule, track and manage appointments for doctors and patients. Built for clarity and speed.</p>

            <ul className="mt-4 text-sm text-slate-500 space-y-2">
              <li>• Simple scheduling interface</li>
              <li>• Doctor calendar & availability</li>
              <li>• Patient booking and history</li>
            </ul>

            <div className="mt-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-blue-600 text-white flex items-center justify-center font-semibold">C</div>
              <div>
                <div className="text-sm font-semibold">Clinic Appointment</div>
                <div className="text-xs text-slate-400">Demo</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: login card positioned to the right */}
        <div className="flex justify-center md:justify-end px-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-md p-8">
              <div className="flex flex-col items-center mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-600 text-white flex items-center justify-center font-semibold">C</div>
                <h1 className="mt-4 text-2xl font-semibold text-slate-800">Welcome Back</h1>
                <p className="text-sm text-slate-500 mt-1">Sign in to continue</p>
              </div>

              {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

              <form onSubmit={submit} className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-600">Email</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full border rounded-md p-2" required />
                </div>

                <div>
                  <label className="block text-sm text-slate-600">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 w-full border rounded-md p-2 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div>
                  <button disabled={loading} type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg">{loading ? "Signing in..." : "Sign in"}</button>
                </div>
              </form>

              

              <div className="mt-6 text-center text-xs text-slate-400">Don't have an account? <a className="text-blue-600" href="/register">Create one</a></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
