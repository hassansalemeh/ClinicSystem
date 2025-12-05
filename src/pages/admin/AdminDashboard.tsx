import MainLayout from "../../layouts/MainLayout";
import { Link } from "react-router-dom";
//addinc comments for github branch
export default function AdminDashboard() {
  return (
    <MainLayout>
      <h1 className="text-3xl font-bold text-primary mb-6">
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <Link
          to="/admin/users"
          className="bg-blue-100 p-6 rounded-xl shadow hover:bg-blue-200 transition block"
        >
          <h2 className="text-xl font-semibold text-blue-700">Manage Users</h2>
          <p className="text-gray-700 mt-2">Add / edit / delete patients & doctors.</p>
        </Link>


      </div>
    </MainLayout>
  );
}
