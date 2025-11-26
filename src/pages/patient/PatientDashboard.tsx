import MainLayout from "../../layouts/MainLayout";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaPlusCircle, FaCalendarAlt, FaCheckCircle, FaUser } from "react-icons/fa";

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patientName, setPatientName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMessage(null);
      try {
        const patientId = localStorage.getItem("userId");
        if (!patientId) {
          setMessage("Please sign in to see your dashboard.");
          setLoading(false);
          return;
        }

        const [ares, dres] = await Promise.all([
          fetch(`/api/appointments?patientId=${patientId}`),
          fetch(`/api/doctors`),
        ]);

        if (!ares.ok) throw new Error("Failed to load appointments");
        const appts = await ares.json();

        // fetch patient name
        try {
          const ures = await fetch(`/api/users/${patientId}`);
          if (ures.ok) {
            const user = await ures.json();
            setPatientName(user.name || user.fullName || user.username || null);
          }
        } catch (e) {
          // ignore, show fallback
        }

        const docs = dres.ok ? await dres.json() : [];
        setDoctors(docs || []);

        // build doctor map for enrichment
        const docMap: Record<string, any> = {};
        (docs || []).forEach((d: any) => {
          if (d) docMap[d.id || d._id] = d;
        });

        // normalize appointments and keep startDate for sorting; enrich doctor info
        const enriched = (appts || []).map((a: any) => ({
          ...a,
          startDate: a.startTime ? new Date(a.startTime) : null,
          status: (a.status || "").toUpperCase(),
          doctorName: (docMap[a.doctorId]?.name) || a.doctorName || "",
          doctorSpecialty: (docMap[a.doctorId]?.specialty) || a.doctorSpecialty || "",
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
  const upcoming = appointments.filter((a) => {
    const s = a.status || "";
    if (s === "COMPLETED" || s === "CANCELLED") return false;
    if (a.startDate) return a.startDate.getTime() > now;
    return true;
  });
  const completed = appointments.filter((a) => (a.status || "") === "COMPLETED");

  // next appointment is the earliest upcoming
  const nextAppointment = [...upcoming].sort((x, y) => (x.startDate?.getTime() || Infinity) - (y.startDate?.getTime() || Infinity))[0];

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-primary">{`Welcome back${patientName ? ', ' + patientName : ''}`}</h1>
          <div className="flex items-center gap-3">
            <Link to="/patient/doctors" className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600">
              <FaPlusCircle /> Book
            </Link>
            <Link to="/patient/appointments" className="inline-flex items-center gap-2 bg-white border px-4 py-2 rounded-lg">
              <FaCalendarAlt /> My Appointments
            </Link>
          </div>
        </div>

        {message && <div className="mb-4 text-red-600">{message}</div>}
        {loading && <div className="mb-4 text-gray-600">Loading dashboard...</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-blue-50 p-5 rounded-xl shadow flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full"><FaCalendarAlt className="text-blue-700" /></div>
            <div>
              <p className="text-sm text-gray-600">Upcoming</p>
              <h3 className="text-xl font-semibold">{upcoming.length}</h3>
            </div>
          </div>

          <div className="bg-green-50 p-5 rounded-xl shadow flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full"><FaCheckCircle className="text-green-700" /></div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <h3 className="text-xl font-semibold">{completed.length}</h3>
            </div>
          </div>

          <div className="bg-yellow-50 p-5 rounded-xl shadow flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-full"><FaUser className="text-yellow-700" /></div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <h3 className="text-xl font-semibold">{appointments.length}</h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Next Appointment</h2>
            {!nextAppointment && <p className="text-gray-600">No upcoming appointments. Book one now.</p>}
            {nextAppointment && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">With</p>
                  <p className="text-xl font-semibold">{nextAppointment.doctorName || "Unknown"}</p>
                  <p className="text-sm text-gray-600 mt-1">{nextAppointment.doctorSpecialty || ""}</p>
                  <p className="text-sm text-gray-500 mt-2">{nextAppointment.startDate ? nextAppointment.startDate.toLocaleString() : ""}</p>
                </div>
                <div>
                  <Link to="/patient/appointments" className="px-4 py-2 bg-primary text-white rounded-lg">View</Link>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Suggested Doctors</h2>
            {doctors.length === 0 && <p className="text-gray-600">No doctors available yet.</p>}
            {doctors.slice(0, 3).map((d: any) => (
              <div key={d.id || d._id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div>
                  <p className="font-medium">{d.name}</p>
                  <p className="text-sm text-gray-500">{d.specialty || "General"}</p>
                </div>
                <Link to={`/patient/book/${d.id || d._id}`} className="text-primary">Book</Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
