import MainLayout from "../../layouts/MainLayout";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";

type DayName =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

interface DaySchedule {
  enabled: boolean;
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
}

const DEFAULT_SCHEDULE: Record<DayName, DaySchedule> = {
  Sunday: { enabled: false, start: "09:00", end: "13:00" },
  Monday: { enabled: true, start: "09:00", end: "17:00" },
  Tuesday: { enabled: true, start: "09:00", end: "17:00" },
  Wednesday: { enabled: true, start: "09:00", end: "17:00" },
  Thursday: { enabled: true, start: "09:00", end: "17:00" },
  Friday: { enabled: true, start: "09:00", end: "17:00" },
  Saturday: { enabled: false, start: "09:00", end: "13:00" },
};

function getDayName(dateStr: string): DayName | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const jsDay = d.getDay(); // 0 = Sunday ... 6 = Saturday
  const names: DayName[] = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return names[jsDay] ?? null;
}

function generateSlots(day: DaySchedule, stepMinutes = 30): string[] {
  if (!day.enabled) return [];
  const [sh, sm] = day.start.split(":").map(Number);
  const [eh, em] = day.end.split(":").map(Number);
  let start = sh * 60 + sm;
  const end = eh * 60 + em;

  const slots: string[] = [];
  while (start < end) {
    const h = Math.floor(start / 60)
      .toString()
      .padStart(2, "0");
    const m = (start % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
    start += stepMinutes;
  }

  return slots;
}

export default function PatientBook() {
  const { doctorId } = useParams<{ doctorId: string }>();

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);
  const navigate = useNavigate();

  interface Doctor {
    id?: string;
    name: string;
    specialty?: string;
  }

  const [doctor, setDoctor] = useState<Doctor>({ name: "Loading...", specialty: "" });
  const [weeklySchedule, setWeeklySchedule] = useState<Record<DayName, DaySchedule>>(DEFAULT_SCHEDULE);

  // today's date in YYYY-MM-DD for input min and quick checks
  const getTodayISO = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };
  const todayISO = getTodayISO();

  useEffect(() => {
    if (!doctorId) return;
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const dres = await fetch(`/api/doctors/${doctorId}`);
        if (dres.ok) {
          const d = await dres.json();
          if (!mounted) return;
          setDoctor({ id: d.id || d._id || d.id, name: d.name || "Unknown doctor", specialty: d.specialty || "" });
        } else {
          setDoctor({ name: "Unknown doctor", specialty: "" });
        }

        const sres = await fetch(`/api/doctors/${doctorId}/schedule`);
        if (sres.ok) {
          const sb = await sres.json();
          if (sb && sb.weekly && mounted) {
            setWeeklySchedule(sb.weekly);
          }
        }
      } catch (err: any) {
        setMessage("Failed to load doctor info or schedule.");
        setMessageType("error");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [doctorId]);

  const dayName = useMemo(() => getDayName(date), [date]);

  const slots = useMemo(() => {
    if (!dayName) return [];
    const daySchedule = weeklySchedule[dayName];
    if (!daySchedule) return [];
    return generateSlots(daySchedule);
  }, [dayName, weeklySchedule]);

  const handleSubmit = async () => {
    setMessage(null);
    setMessageType(null);
    if (!date) {
      setMessage("Please select a date.");
      setMessageType("error");
      return;
    }
    if (!time) {
      setMessage("Please select a time slot.");
      setMessageType("error");
      return;
    }

    const patientId = localStorage.getItem("userId");
    if (!patientId) {
      setMessage("You must be signed in to book an appointment.");
      setMessageType("error");
      return;
    }

    // build ISO start/end times (assume local timezone)
    // date is YYYY-MM-DD, time is HH:MM
    const start = new Date(`${date}T${time}:00`);
    const end = new Date(start.getTime() + 30 * 60000); // 30 minutes slot

    // final validation: do not allow booking a time already in the past
    if (start.getTime() <= Date.now()) {
      setMessage("Cannot book a time in the past. Please choose a future slot.");
      setMessageType("error");
      return;
    }

    const payload = {
      doctorId: doctorId,
      patientId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      reason: reason || "",
    };

    setLoading(true);
    try {
      const res = await fetch(`/api/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || "Failed to create appointment");
      }
      setMessage("Appointment booked successfully.");
      setMessageType("success");
      // optionally go to patient appointments page
      setTimeout(() => navigate("/patient/appointments"), 800);
    } catch (err: any) {
      setMessage(err.message || String(err));
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const isDayAvailable = dayName ? weeklySchedule[dayName]?.enabled : true;


  return (
    <MainLayout>
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-4">Book Appointment</h1>

        <div className="mb-6">
          <h2 className="text-xl font-semibold">{doctor.name}</h2>
          {doctor.specialty && (
            <p className="text-gray-600">{doctor.specialty}</p>
          )}
        </div>

        {/* Date selection */}
        <div className="mb-6">
          <label className="block font-medium mb-2">Select Date</label>
          <input
            type="date"
            value={date}
            min={todayISO}
            onChange={(e) => {
              const v = e.target.value;
              if (v < todayISO) {
                setMessage("Cannot select a past date.");
                setMessageType("error");
                return;
              }
              setDate(v);
              setTime("");
            }}
            className="border p-2 rounded w-full"
          />
          {date && !isDayAvailable && (
            <p className="text-sm text-red-600 mt-2">
              Doctor is not available on this day. Please choose another date.
            </p>
          )}
        </div>

        {/* Time slots grid */}
        <div className="mb-6">
          <label className="block font-medium mb-2">Select Time</label>

          {!date && (
            <p className="text-gray-500 text-sm">
              Please select a date first.
            </p>
          )}

          {date && isDayAvailable && slots.length === 0 && (
            <p className="text-gray-500 text-sm">
              No time slots configured for this day.
            </p>
          )}

          {date && isDayAvailable && slots.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {slots.map((slot) => {
                // construct local datetime for the slot
                const slotDate = new Date(`${date}T${slot}:00`);
                const isPast = slotDate.getTime() <= Date.now();
                return (
                  <button
                    key={slot}
                    onClick={() => {
                      if (isPast) return;
                      setTime(slot);
                    }}
                    disabled={isPast}
                    className={`py-2 rounded-lg border text-sm ${
                      isPast
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : time === slot
                        ? "bg-primary text-white border-primary"
                        : "bg-white hover:bg-blue-50"
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Reason input */}
        <div className="mb-6">
          <label className="block font-medium mb-2">Reason (optional)</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} className="w-full border p-2 rounded" placeholder="Brief reason for the appointment (symptoms, follow-up, etc.)" />
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-primary text-white py-2 rounded-lg hover:bg-blue-600 transition"
        >
          Confirm Appointment
        </button>
      </div>
    </MainLayout>
  );
}
