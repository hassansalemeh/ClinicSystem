import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"DOCTOR" | "PATIENT">("PATIENT");
  const [specialty, setSpecialty] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // client-side password validation
    const pw = password || "";
    const pwValid = validatePassword(pw);
    if (!pwValid.isValid) {
      setError("Password does not meet the requirements.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, specialty, phone }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Registration failed");
      }

      await res.json().catch(() => ({}));
      // redirect to login
      navigate("/login");
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  function validatePassword(pw: string) {
    const minLen = pw.length >= 8;
    const hasLower = /[a-z]/.test(pw);
    const hasUpper = /[A-Z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    const hasSpecial = /[^A-Za-z0-9]/.test(pw);
    const isValid = minLen && hasLower && hasUpper && hasNumber && hasSpecial;
    return { minLen, hasLower, hasUpper, hasNumber, hasSpecial, isValid };
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md">
        <form onSubmit={submit} className="bg-white shadow-md rounded-2xl p-8">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Create account</h2>

          {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

          <div className="space-y-3">
            <div>
              <label className="block text-sm text-slate-600">Full name</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full border rounded-md p-2" />
            </div>

            <div>
              <label className="block text-sm text-slate-600">Email</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full border rounded-md p-2" />
            </div>

            <div>
              <label className="block text-sm text-slate-600">Password</label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full border rounded-md p-2 pr-10"
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
              <div className="mt-2 text-sm">
                <div className="text-sm font-medium mb-1">Password must include:</div>
                {(() => {
                  const v = validatePassword(password);
                  return (
                    <ul className="grid grid-cols-1 gap-1 text-xs text-slate-600">
                      <li className={v.minLen ? "text-green-600" : "text-gray-400"}>• At least 8 characters</li>
                      <li className={v.hasLower ? "text-green-600" : "text-gray-400"}>• A lowercase letter</li>
                      <li className={v.hasUpper ? "text-green-600" : "text-gray-400"}>• An uppercase letter</li>
                      <li className={v.hasNumber ? "text-green-600" : "text-gray-400"}>• A number</li>
                      <li className={v.hasSpecial ? "text-green-600" : "text-gray-400"}>• A special character</li>
                    </ul>
                  );
                })()}
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-600">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as any)} className="mt-1 w-full border rounded-md p-2">
                <option value="PATIENT">Patient</option>
                <option value="DOCTOR">Doctor</option>
              </select>
            </div>

            {role === "DOCTOR" && (
              <>
                <div>
                  <label className="block text-sm text-slate-600">Specialty</label>
                  <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="mt-1 w-full border rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600">Phone</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full border rounded-md p-2" />
                </div>
              </>
            )}

            <div>
              <button
                disabled={loading || !validatePassword(password).isValid}
                type="submit"
                className={`w-full py-2 rounded-md ${loading || !validatePassword(password).isValid ? 'bg-gray-300 text-gray-600' : 'bg-blue-600 text-white'}`}>
                {loading ? "Creating..." : "Create account"}
              </button>
            </div>

            <div className="text-center text-sm text-slate-500">Already have an account? <a className="text-blue-600" href="/login">Log in</a></div>
          </div>
        </form>
      </div>
    </div>
  );
}
