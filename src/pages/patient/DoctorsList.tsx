import MainLayout from "../../layouts/MainLayout";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  email: string;
  phone: string;
}

export default function DoctorsList() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/doctors")
      .then((res) => {
        setDoctors(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <p>Loading doctors...</p>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <h1 className="text-3xl font-bold text-primary mb-6">Available Doctors</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {doctors.map((doc) => (
          <div
            key={doc.id}
            className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition"
          >
            <h2 className="text-xl font-semibold text-gray-800">{doc.name}</h2>
            <p className="text-gray-600">{doc.specialty}</p>

            <button
              onClick={() => navigate(`/patient/book/${doc.id}`)}
              className="mt-4 w-full bg-primary text-white py-2 rounded-lg hover:bg-blue-600 transition"
            >
              Book Appointment
            </button>
          </div>
        ))}
      </div>
    </MainLayout>
  );
}
