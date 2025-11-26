import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [initial, setInitial] = useState<string>("U");
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) {
      try {
        const parsed = JSON.parse(u);
        const name = parsed?.name || parsed?.fullName || parsed?.username || "";
        if (name && typeof name === "string") setInitial(name.charAt(0).toUpperCase());
      } catch (e) {
        if (typeof u === "string" && u.length) setInitial(u.charAt(0).toUpperCase());
      }
    }
    const r = localStorage.getItem("role");
    if (r) setRole(r);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    localStorage.removeItem("userName");
    navigate("/login");
    window.location.reload();
  };

  const dashboardPath = role === "DOCTOR" ? "/doctor/dashboard" : role === "ADMIN" ? "/admin/dashboard" : role === "PATIENT" ? "/patient/dashboard" : "/";

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-primary text-white px-6 py-4 flex justify-between items-center">
        <Link to={dashboardPath} className="font-bold text-lg hover:underline">Clinic Appointment System</Link>
        <div className="flex gap-4 items-center">
          <Link to="/profile" className="flex items-center gap-2 hover:underline">
            <div className="w-8 h-8 bg-white text-primary rounded-full flex items-center justify-center font-semibold">{initial}</div>
          </Link>
          <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded">Logout</button>
        </div>
      </nav>
      <main className="flex-1 p-6">{children}</main>
      <footer className="bg-gray-100 text-center py-3 text-sm">
        © 2025 Clinic System — USJ Project
      </footer>
    </div>
  );
}
