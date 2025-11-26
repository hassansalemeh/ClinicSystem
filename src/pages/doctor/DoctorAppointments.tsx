import MainLayout from "../../layouts/MainLayout";
import { useState, useEffect } from "react";
import { FaCheckCircle, FaTimesCircle, FaClock } from "react-icons/fa";

type BackendStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "COMPLETED" | string;

export default function DoctorAppointments() {
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

        // fetch doctor profile by linked userId
        const dres = await fetch(`/api/doctors/user/${userId}`);
        if (!dres.ok) {
          setMessage("Doctor profile not found.");
          setLoading(false);
          return;
        }
        const doctor = await dres.json();
        const doctorId = doctor.id || doctor._id || doctor.id;

        // fetch appointments for this doctor
        const ares = await fetch(`/api/appointments?doctorId=${doctorId}`);
        if (!ares.ok) throw new Error("Failed to load appointments");
        const appts = await ares.json();

        // fetch patient names for appointments
        const patientIds = Array.from(new Set(appts.map((p: any) => p.patientId).filter(Boolean))) as string[];
        const users = await Promise.all(
          patientIds.map((id) => fetch(`/api/users/${id}`).then((r) => (r.ok ? r.json() : null)))
        );
        const userMap: Record<string, any> = {};
        users.forEach((u: any) => {
          if (!u) return;
          const keys: string[] = [];
          if (u.id) keys.push(String(u.id));
          if (u._id) keys.push(String(u._id));
          if ((u as any)._id && (u as any)._id.$oid) keys.push(String((u as any)._id.$oid));
          if (u.email) keys.push(String(u.email));
          keys.forEach((k) => { if (k) userMap[k] = u; });
        });

        const enriched = (appts || []).map((a: any) => ({
          ...a,
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

  const updateStatus = async (id: string, newStatus: BackendStatus) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const updated = await res.json();
      // Preserve enriched fields like patientName/startTime parsing when replacing
      setAppointments((prev) => prev.map((a) => {
        const aId = a.id || a._id;
        const updatedId = updated.id || updated._id;
        if (aId === updatedId) {
          // keep existing derived fields (patientName, parsed dates) if present
          const patientName = a.patientName || updated.patientName || a.patientId || updated.patientId;
          const startDate = a.startDate || (updated.startTime ? new Date(updated.startTime) : null);
          const merged = { ...a, ...updated, patientName, startDate };
          // normalize status
          merged.status = (merged.status || updated.status || '').toString().toUpperCase();
          return merged;
        }
        return a;
      }));
    } catch (err: any) {
      setMessage(err.message || String(err));
    }
  };

  const pendingCount = appointments.filter((a) => a.status === "PENDING").length;
  const confirmedCount = appointments.filter((a) => a.status === "CONFIRMED").length;
  const completedCount = appointments.filter((a) => a.status === "COMPLETED").length;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-secondary">Today's Appointments</h1>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-yellow-100 text-yellow-800 p-4 rounded-xl flex items-center gap-3">
            <FaClock size={24} />
            <div>
              <p className="text-sm">Pending</p>
              <h3 className="text-lg font-semibold">{pendingCount}</h3>
            </div>
          </div>

          <div className="bg-green-100 text-green-800 p-4 rounded-xl flex items-center gap-3">
            <FaCheckCircle size={24} />
            <div>
              <p className="text-sm">Confirmed</p>
              <h3 className="text-lg font-semibold">{confirmedCount}</h3>
            </div>
          </div>

          <div className="bg-gray-100 text-gray-800 p-4 rounded-xl flex items-center gap-3">
            <FaClock size={24} />
            <div>
              <p className="text-sm">Completed</p>
              <h3 className="text-lg font-semibold">{completedCount}</h3>
            </div>
          </div>
        </div>

        {/* Appointments table */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Appointment List</h2>

          {loading && <div className="py-6 text-center text-gray-500">Loading...</div>}
          {message && <div className="py-4 text-center text-red-600">{message}</div>}

          {!loading && !message && (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b text-left text-gray-600">
                  <th className="py-2">Patient</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Time</th>
                  <th className="py-2">Reason</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => {
                  const id = a.id || a._id || a._id;
                  const start = a.startTime ? new Date(a.startTime) : null;
                  const date = start ? start.toLocaleDateString() : "";
                  const time = start ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
                  const status = String(a.status || "");
                  return (
                    <tr key={id} className="border-b hover:bg-gray-50">
                      <td className="py-3">{a.patientName || a.patientId || "Patient"}</td>
                      <td>{date}</td>
                      <td>{time}</td>
                      <td>{a.reason || ""}</td>
                      <td>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : status === "CONFIRMED"
                              ? "bg-green-100 text-green-800"
                              : status === "CANCELLED"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="text-center space-x-2">
                        {status === "PENDING" && (
                          <>
                            <button
                              onClick={() => updateStatus(id, "CONFIRMED")}
                              className="inline-flex items-center gap-1 px-3 py-1 text-sm rounded bg-green-500 text-white hover:bg-green-600"
                            >
                              <FaCheckCircle /> Accept
                            </button>
                            <button
                              onClick={() => updateStatus(id, "CANCELLED")}
                              className="inline-flex items-center gap-1 px-3 py-1 text-sm rounded bg-red-500 text-white hover:bg-red-600"
                            >
                              <FaTimesCircle /> Reject
                            </button>
                          </>
                        )}
                        {status === "CONFIRMED" && (
                          <button
                            onClick={() => updateStatus(id, "COMPLETED")}
                            className="inline-flex items-center gap-1 px-3 py-1 text-sm rounded bg-blue-500 text-white hover:bg-blue-600"
                          >
                            Mark Completed
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
