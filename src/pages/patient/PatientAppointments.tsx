import MainLayout from "../../layouts/MainLayout";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FaCalendarAlt, FaPlusCircle, FaClock, FaCheckCircle } from "react-icons/fa";

export default function PatientAppointments() {

  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const patientId = localStorage.getItem("userId");
      if (!patientId) {
        setMessage("Please sign in to see your appointments.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/appointments?patientId=${patientId}`);
        if (!res.ok) throw new Error("Failed to load appointments");
        const appts = await res.json();

        // Collect doctor ids and fetch doctor names
        const doctorIds = Array.from(new Set(appts.map((a: any) => a.doctorId).filter(Boolean))) as string[];
        const doctors = await Promise.all(
          doctorIds.map((id: string) => fetch(`/api/doctors/${id}`).then((r) => (r.ok ? r.json() : null)))
        );
        const doctorMap: Record<string, any> = {};
        doctors.forEach((d: any) => {
          if (d && (d.id || d._id)) doctorMap[d.id || d._id] = d;
        });

        const enriched = appts.map((a: any) => {
          const start = a.startTime ? new Date(a.startTime) : null;
          return {
            ...a,
            doctorName: (doctorMap[a.doctorId]?.name) || "Unknown",
            doctorSpecialty: (doctorMap[a.doctorId]?.specialty) || "",
            date: start ? start.toLocaleDateString() : "",
            time: start ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
            status: a.status || "",
            // keep the Date object to compute upcoming/completed accurately
            startDate: start,
          };
        });

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
  const upcomingCount = appointments.filter((a) => {
    const st = (a.status || "").toUpperCase();
    if (st === "COMPLETED" || st === "CANCELLED") return false;
    if (a.startDate) {
      try {
        const ms = (a.startDate instanceof Date) ? a.startDate.getTime() : new Date(a.startDate).getTime();
        return ms > now;
      } catch (e) {
        return true;
      }
    }
    return true;
  }).length;

  const completedCount = appointments.filter((a) => (a.status || "").toUpperCase() === "COMPLETED").length;

  const getStatusClasses = (status: string) => {
    switch ((status || "").toUpperCase()) {
      case "CONFIRMED":
        return { bg: "bg-green-100", text: "text-green-700", label: "CONFIRMED" };
      case "PENDING":
        return { bg: "bg-yellow-100", text: "text-yellow-700", label: "PENDING" };
      case "REJECTED":
      case "CANCELLED":
        return { bg: "bg-red-100", text: "text-red-700", label: "CANCELLED" };
      case "COMPLETED":
        return { bg: "bg-gray-100", text: "text-gray-700", label: "COMPLETED" };
      default:
        return { bg: "bg-blue-100", text: "text-blue-700", label: status || "UNKNOWN" };
    }
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-primary">My Appointments</h1>
          <button
            onClick={() => navigate("/patient/doctors")}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all"
          >
            <FaPlusCircle /> Book New
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-100 text-blue-700 p-4 rounded-xl flex items-center gap-3">
            <FaClock size={24} />
            <div>
              <p className="text-sm">Upcoming</p>
              <h3 className="text-lg font-semibold">{upcomingCount}</h3>
            </div>
          </div>
          <div className="bg-green-100 text-green-700 p-4 rounded-xl flex items-center gap-3">
            <FaCheckCircle size={24} />
            <div>
              <p className="text-sm">Completed</p>
              <h3 className="text-lg font-semibold">{completedCount}</h3>
            </div>
          </div>
          <div className="bg-yellow-100 text-yellow-700 p-4 rounded-xl flex items-center gap-3">
            <FaCalendarAlt size={24} />
            <div>
              <p className="text-sm">Total</p>
              <h3 className="text-lg font-semibold">{appointments.length}</h3>
            </div>
          </div>
        </div>

        {/* Appointment List */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Appointment History</h2>

          {loading && <div className="py-6 text-center text-gray-500">Loading...</div>}
          {message && <div className="py-4 text-center text-red-600">{message}</div>}

          {!loading && !message && (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b text-left text-gray-600">
                  <th className="py-2">Doctor</th>
                  <th className="py-2">Specialty</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Time</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id || a._id} className="border-b hover:bg-gray-50">
                    <td className="py-3">{a.doctorName}</td>
                    <td>{a.doctorSpecialty}</td>
                    <td>{a.date}</td>
                    <td>{a.time}</td>
                    <td>
                      {(() => {
                        const s = getStatusClasses(a.status);
                        return (
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${s.bg} ${s.text}`}>
                            {s.label}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
