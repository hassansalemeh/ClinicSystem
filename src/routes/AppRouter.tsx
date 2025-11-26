import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, type ReactNode } from "react";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

import AdminDashboard from "../pages/admin/AdminDashboard";
import ManageUsers from "../pages/admin/ManageUsers";


import DoctorDashboard from "../pages/doctor/DoctorDashboard";
import DoctorAppointments from "../pages/doctor/DoctorAppointments";
import DoctorSchedule from "../pages/doctor/DoctorSchedule";

import PatientDashboard from "../pages/patient/PatientDashboard";
import PatientAppointments from "../pages/patient/PatientAppointments";
import DoctorsList from "../pages/patient/DoctorsList";
import PatientProfile from "../pages/patient/PatientProfile";
import PatientBook from "../pages/patient/PatientBook";

function ProtectedRoute({
  element,
  requiredRole,
}: {
  element: ReactNode;
  requiredRole: "ADMIN" | "DOCTOR" | "PATIENT";
}) {
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    setRole(storedRole);
    setIsLoading(false);
  }, []);

  if (isLoading) return <div>Loading...</div>;

  return role === requiredRole ? element : <Navigate to="/login" />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* public */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* admin */}
        <Route
          path="/admin/dashboard"
          element={<ProtectedRoute element={<AdminDashboard />} requiredRole="ADMIN" />}
        />
        <Route
          path="/admin/users"
          element={<ProtectedRoute element={<ManageUsers />} requiredRole="ADMIN" />}
        />
        
      

        {/* doctor */}
        <Route
          path="/doctor/dashboard"
          element={<ProtectedRoute element={<DoctorDashboard />} requiredRole="DOCTOR" />}
        />
        <Route
          path="/doctor/appointments"
          element={<ProtectedRoute element={<DoctorAppointments />} requiredRole="DOCTOR" />}
        />
        <Route
          path="/doctor/schedule"
          element={<ProtectedRoute element={<DoctorSchedule />} requiredRole="DOCTOR" />}
        />

        {/* patient */}
        <Route
          path="/patient/dashboard"
          element={<ProtectedRoute element={<PatientDashboard />} requiredRole="PATIENT" />}
        />
        <Route
          path="/patient/appointments"
          element={<ProtectedRoute element={<PatientAppointments />} requiredRole="PATIENT" />}
        />
        <Route
          path="/patient/doctors"
          element={<ProtectedRoute element={<DoctorsList />} requiredRole="PATIENT" />}
        />
        <Route
          path="/patient/profile"
          element={<ProtectedRoute element={<PatientProfile />} requiredRole="PATIENT" />}
        />
        {/* public role-agnostic profile route (redirects to login if not signed in) */}
        <Route path="/profile" element={<PatientProfile />} />
        <Route
          path="/patient/book/:doctorId"
          element={<ProtectedRoute element={<PatientBook />} requiredRole="PATIENT" />}
        />
      </Routes>
    </BrowserRouter>
  );
}
