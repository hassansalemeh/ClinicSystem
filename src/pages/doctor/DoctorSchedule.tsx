import MainLayout from "../../layouts/MainLayout";
import { useEffect, useState } from "react";

interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
}

const DEFAULT_SCHEDULE: Record<string, DaySchedule> = {
  Monday: { enabled: true, start: "09:00", end: "17:00" },
  Tuesday: { enabled: true, start: "09:00", end: "17:00" },
  Wednesday: { enabled: true, start: "09:00", end: "17:00" },
  Thursday: { enabled: true, start: "09:00", end: "17:00" },
  Friday: { enabled: true, start: "09:00", end: "17:00" },
  Saturday: { enabled: false, start: "09:00", end: "13:00" },
  Sunday: { enabled: false, start: "09:00", end: "13:00" },
};

export default function DoctorSchedule() {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>(DEFAULT_SCHEDULE);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    const load = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setMessage("No user logged in. Please sign in as a doctor.");
        setMessageType("error");
        return;
      }

      setLoading(true);
      try {
        // find doctor's profile by userId
        const dres = await fetch(`/api/doctors/user/${userId}`);
        if (!dres.ok) {
          setMessage("Doctor profile not found. Create your doctor profile first.");
          setMessageType("error");
          setLoading(false);
          return;
        }
        const doctor = await dres.json();
        const id = doctor.id || doctor._id || doctor.id;
        setDoctorId(id);

        // fetch schedule
        const sres = await fetch(`/api/doctors/${id}/schedule`);
        if (sres.ok) {
          const body = await sres.json();
          if (body && body.weekly) {
            setSchedule(body.weekly);
            setMessage(null);
            setMessageType(null);
          } else {
            setSchedule(DEFAULT_SCHEDULE);
          }
        } else {
          setSchedule(DEFAULT_SCHEDULE);
        }
      } catch (err: any) {
        setMessage(String(err));
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const updateDay = (day: string, field: keyof DaySchedule, value: any) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const saveSchedule = async () => {
    if (!doctorId) {
      setMessage("Cannot save schedule: missing doctorId.");
      setMessageType("error");
      return;
    }
    setLoading(true);
    setMessage(null);
    setMessageType(null);
    try {
      const res = await fetch(`/api/doctors/${doctorId}/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId, weekly: schedule }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to save");
      }
      setMessage("Schedule saved successfully.");
      setMessageType("success");
    } catch (err: any) {
      setMessage(err.message || String(err));
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <h1 className="text-3xl font-bold text-secondary mb-6">Manage Schedule</h1>

      <div className="bg-white shadow rounded-xl p-6 max-w-3xl">
        <h2 className="text-xl font-semibold mb-4">Weekly Availability</h2>

        {message && (
          <div className={`mb-4 text-sm ${messageType === "success" ? "text-green-600" : "text-red-600"}`}>
            {message}
          </div>
        )}

        <div className="space-y-4">
          {days.map((day) => (
            <div key={day} className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={schedule[day].enabled}
                  onChange={(e) => updateDay(day, "enabled", e.target.checked)}
                />
                <span className="font-medium">{day}</span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="time"
                  value={schedule[day].start}
                  disabled={!schedule[day].enabled}
                  onChange={(e) => updateDay(day, "start", e.target.value)}
                  className="border p-1 rounded"
                />
                <span>-</span>
                <input
                  type="time"
                  value={schedule[day].end}
                  disabled={!schedule[day].enabled}
                  onChange={(e) => updateDay(day, "end", e.target.value)}
                  className="border p-1 rounded"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={saveSchedule}
          disabled={loading}
          className="mt-6 w-full bg-secondary text-white py-2 rounded-lg hover:bg-green-600 transition"
        >
          {loading ? "Saving..." : "Save Schedule"}
        </button>
      </div>
    </MainLayout>
  );
}
