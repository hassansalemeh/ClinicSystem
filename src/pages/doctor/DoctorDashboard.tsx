import MainLayout from "../../layouts/MainLayout";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaCalendarAlt, FaCheckCircle, FaClock } from "react-icons/fa";

export default function DoctorDashboard() {
  const [doctor, setDoctor] = useState<any | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMessage(null);
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          setMessage("Not signed in.");
          setLoading(false);
          return;
        }

        // fetch doctor profile linked to this user
        const dres = await fetch(`/api/doctors/user/${userId}`);
        if (!dres.ok) {
          setMessage("Doctor profile not found.");
          setLoading(false);
          return;
        }
        const d = await dres.json();
        setDoctor(d);

        const doctorId = d.id || d._id;
        const ares = await fetch(`/api/appointments?doctorId=${doctorId}`);
        if (!ares.ok) throw new Error("Failed to load appointments");
        const appts = await ares.json();

        // fetch patient names for appointments (unique)
        const patientIds = Array.from(new Set((appts || []).map((p: any) => p.patientId).filter(Boolean))) as string[];
        const users = await Promise.all(
          patientIds.map((id: string) => fetch(`/api/users/${id}`).then((r) => (r.ok ? r.json() : null)))
        );
        const userMap: Record<string, any> = {};
        users.forEach((u: any) => {
          if (!u) return;
          // Normalize possible id fields and map by multiple keys to be resilient
          const keys = [] as string[];
          if (u.id) keys.push(String(u.id));
          if (u._id) keys.push(String(u._id));
          // also include common nested forms
          if ((u as any)._id && (u as any)._id.$oid) keys.push(String((u as any)._id.$oid));
          // map by email as a last resort
          if (u.email) keys.push(String(u.email));
          keys.forEach((k) => { if (k) userMap[k] = u; });
        });

        const enriched = (appts || []).map((a: any) => ({
          ...a,
          startDate: a.startTime ? new Date(a.startTime) : null,
          status: (a.status || "").toUpperCase(),
          patientName: (userMap[a.patientId]?.name) || a.patientName || a.patientId,
        }));

        setAppointments(enriched);
      } catch (err: any) {
        setMessage(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const now = Date.now();
  const pendingCount = appointments.filter((a) => (a.status || "") === "PENDING").length;
  const confirmedCount = appointments.filter((a) => (a.status || "") === "CONFIRMED").length;
  const completedCount = appointments.filter((a) => (a.status || "") === "COMPLETED").length;

  const upcoming = appointments.filter((a) => {
    const s = (a.status || "").toUpperCase();
    if (s === "COMPLETED" || s === "CANCELLED") return false;
    return a.startDate ? a.startDate.getTime() > now : true;
  }).sort((x, y) => (x.startDate?.getTime() || Infinity) - (y.startDate?.getTime() || Infinity));

  const next = upcoming[0];

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-secondary">{doctor ? `Welcome Dr. ${doctor.name}` : "Doctor Dashboard"}</h1>
          <div className="flex items-center gap-3">
            <Link to="/doctor/appointments" className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600">Appointments</Link>
            <Link to="/doctor/schedule" className="inline-flex items-center gap-2 bg-white border px-4 py-2 rounded-lg">Schedule</Link>
          </div>
        </div>

        {message && <div className="mb-4 text-red-600">{message}</div>}
        {loading && <div className="mb-4 text-gray-600">Loading...</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-yellow-50 p-5 rounded-xl shadow flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-full"><FaClock className="text-yellow-700" /></div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <h3 className="text-xl font-semibold">{pendingCount}</h3>
            </div>
          </div>

          <div className="bg-blue-50 p-5 rounded-xl shadow flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full"><FaCalendarAlt className="text-blue-700" /></div>
            <div>
              <p className="text-sm text-gray-600">Confirmed</p>
              <h3 className="text-xl font-semibold">{confirmedCount}</h3>
            </div>
          </div>

          <div className="bg-green-50 p-5 rounded-xl shadow flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full"><FaCheckCircle className="text-green-700" /></div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <h3 className="text-xl font-semibold">{completedCount}</h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Next Appointment</h2>
            {!next && <p className="text-gray-600">No upcoming appointments.</p>}
            {next && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Patient</p>
                  <p className="text-xl font-semibold">{next.patientName}</p>
                  <p className="text-sm text-gray-500 mt-2">{next.startDate ? next.startDate.toLocaleString() : ""}</p>
                  {next.reason && <p className="text-sm text-gray-600 mt-2"><strong>Reason:</strong> {next.reason}</p>}
                </div>
                <div>
                  <Link to="/doctor/appointments" className="px-4 py-2 bg-primary text-white rounded-lg">Manage</Link>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Appointments</h2>
            {appointments.slice(0,5).map((a) => (
              <div key={a.id || a._id} className="py-2 border-b last:border-b-0 flex items-center justify-between">
                <div>
                  <p className="font-medium">{a.patientName}</p>
                  <p className="text-sm text-gray-500">{a.startDate ? a.startDate.toLocaleString() : ""}</p>
                  {a.reason && <p className="text-sm text-gray-600">{a.reason}</p>}
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    a.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    a.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                    a.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                  }`}>{a.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
