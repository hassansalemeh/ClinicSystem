import MainLayout from "../../layouts/MainLayout";
import { useEffect, useState } from "react";

export default function PatientProfile() {
  const [user, setUser] = useState<any | null>(null);
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
        const res = await fetch(`/api/users/${userId}`);
        if (!res.ok) throw new Error("Failed to load user profile");
        const u = await res.json();
        setUser(u);
      } catch (err: any) {
        setMessage(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <MainLayout>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold mb-4">My Profile</h1>
        {loading && <p className="text-gray-600">Loading...</p>}
        {message && <p className="text-red-600">{message}</p>}
        {user && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold">{(user.name || "?").charAt(0).toUpperCase()}</div>
              <div>
                <h2 className="text-lg font-semibold">{user.name}</h2>
                <p className="text-sm text-gray-500">{user.role}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
  
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
