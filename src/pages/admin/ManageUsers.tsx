import MainLayout from "../../layouts/MainLayout";
import { useEffect, useState } from "react";

type User = {
  id?: string;
  _id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  role?: string;
};

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "PATIENT" });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  function validatePassword(pw: string) {
    const minLen = pw.length >= 8;
    const hasLower = /[a-z]/.test(pw);
    const hasUpper = /[A-Z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    const hasSpecial = /[^A-Za-z0-9]/.test(pw);
    const isValid = minLen && hasLower && hasUpper && hasNumber && hasSpecial;
    return { minLen, hasLower, hasUpper, hasNumber, hasSpecial, isValid };
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/users", { headers });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      // Debug log so testers can inspect shape in browser console
      console.debug("[ManageUsers] /api/users response:", data);

      let list: any[] = [];
      if (Array.isArray(data)) list = data;
      else if (Array.isArray(data.users)) list = data.users;
      else if (Array.isArray(data.data)) list = data.data;
      else if (Array.isArray(data.content)) list = data.content;
      else if (data && typeof data === "object") {
        // try to extract array-like values
        const vals = Object.values(data);
        const candidates = vals.filter((v) => Array.isArray(v) && v.length > 0);
        if (candidates.length) list = candidates[0] as any[];
        else {
          // last resort: collect object values that look like users
          list = vals.filter((v: any) => v && ((v as any).email || (v as any).name));
        }
      }

      setUsers(list || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", email: "", password: "", role: "PATIENT" });
    setShowModal(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({ name: (u.name || u.fullName || ""), email: u.email || "", password: "", role: u.role || "PATIENT" });
    setShowModal(true);
  };

  const handleDelete = async (u: User) => {
    const id = u.id || u._id;
    if (!id) return;
    if (!confirm(`Delete user ${u.name || u.email || id}?`)) return;
    try {
      const token = localStorage.getItem("accessToken");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`/api/users/${id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error("Delete failed");
      // refresh
      await loadUsers();
    } catch (err) {
      console.error(err);
      alert("Failed to delete user");
    }
  };

  const submit = async (e?: any) => {
    if (e) e.preventDefault();
    setFormError(null);
    setSubmitLoading(true);
    try {
      if (editing) {
        // update user
        const id = editing.id || editing._id;
        if (!id) throw new Error("Missing id");
        const token = localStorage.getItem("accessToken");
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`/api/users/${id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ name: form.name, email: form.email }),
        });
        if (!res.ok) throw new Error("Update failed");
      } else {
        // use registration endpoint to create user
        // validate password
        const pw = form.password || "";
        const v = validatePassword(pw);
        if (!v.isValid) {
          setFormError("Password does not meet requirements (min 8 chars, upper, lower, number, special).");
          setSubmitLoading(false);
          return;
        }

        const res = await fetch(`/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, email: form.email, password: form.password, role: form.role }),
        });
        if (!res.ok) {
          let txt = await res.text().catch(() => "");
          try {
            const j = JSON.parse(txt || "{}");
            if (j && j.message) txt = j.message;
          } catch (e) {
            // ignore
          }
          setFormError(txt || "Create failed");
          setSubmitLoading(false);
          return;
        }
      }
      setShowModal(false);
      await loadUsers();
    } catch (err: any) {
      console.error(err);
      setFormError(err?.message || "Failed to save user");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Manage Users</h1>
          <div>
            <button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded">Add User</button>
          </div>
        </div>

        {loading ? (
          <p>Loading users...</p>
        ) : (
          <div className="overflow-x-auto bg-white shadow rounded">
            <table className="min-w-full divide-y">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Name</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Email</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Role</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">No users found</td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const id = u.id || u._id || "";
                    const name = u.name || u.fullName || u.email || "-";
                    return (
                      <tr key={id}>
                        <td className="px-4 py-2 text-sm">{name}</td>
                        <td className="px-4 py-2 text-sm">{u.email}</td>
                        <td className="px-4 py-2 text-sm">{u.role || "PATIENT"}</td>
                        <td className="px-4 py-2 text-sm text-right">
                          <button onClick={() => openEdit(u)} className="mr-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded">Edit</button>
                          <button onClick={() => handleDelete(u)} className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded">Delete</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded shadow-lg w-full max-w-lg p-6">
              <h2 className="text-xl font-semibold mb-4">{editing ? "Edit User" : "Add User"}</h2>
              {formError && <div className="mb-3 text-sm text-red-600">{formError}</div>}
              <form onSubmit={submit}>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} className="w-full border px-3 py-2 rounded" />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input value={form.email} type="email" onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} className="w-full border px-3 py-2 rounded" />
                </div>
                {!editing && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <input value={form.password} type="password" onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} className="w-full border px-3 py-2 rounded" />
                    <div className="text-xs text-slate-600 mt-2">Password must be at least 8 characters and include upper/lower/number/special.</div>
                  </div>
                )}
                {!editing && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Role</label>
                    <select value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))} className="w-full border px-3 py-2 rounded">
                      <option value="PATIENT">PATIENT</option>
                      <option value="DOCTOR">DOCTOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1 rounded border">Cancel</button>
                  <button disabled={submitLoading} type="submit" className={`px-3 py-1 rounded ${submitLoading ? 'bg-gray-300 text-gray-600' : 'bg-blue-600 text-white'}`}>{submitLoading ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
