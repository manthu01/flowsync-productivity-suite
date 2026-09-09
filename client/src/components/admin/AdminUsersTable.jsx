import { Fragment, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { FiSearch, FiKey } from "react-icons/fi";
import { setUserPassword } from "../../services/adminService";

const shortDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";

// One row's inline "set a new password on the spot" control. Never shows or asks for
// the existing password — that's not recoverable by design (it's only ever stored as
// a one-way bcrypt hash) — this just overwrites it with a new one the admin picks.
const PasswordEditor = ({ userId, onClose }) => {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSaving(true);
    try {
      await setUserPassword(userId, password);
      toast.success("Password updated");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't update password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="flex flex-wrap items-center gap-2 px-6 py-3 bg-line/[0.04] border-t border-line/10">
        <input
          type="text"
          autoFocus
          placeholder="New password (min. 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          className="flex-1 min-w-[200px] p-2 rounded-lg bg-line/[0.06] border border-line/10 outline-none focus:border-cyan-400/50 transition-colors text-sm"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 transition-colors font-bold text-black text-xs disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={onClose}
          className="px-3 py-2 rounded-lg bg-line/5 hover:bg-line/10 border border-line/10 transition-colors text-xs"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
};

const AdminUsersTable = ({ users }) => {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-line/[0.03] backdrop-blur-lg border border-line/10 rounded-3xl overflow-hidden"
    >
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">All Users</h2>
          <span className="text-subtle text-sm">{filtered.length} of {users.length}</span>
        </div>
        <div className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" size={15} />
          <input
            type="text"
            placeholder="Search by name, username, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2.5 pl-10 rounded-xl bg-line/[0.04] border border-line/10 outline-none focus:border-cyan-400/50 transition-colors text-sm"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-10 text-center text-subtle border-t border-line/10">No users match that search.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-subtle text-left border-t border-line/10">
                <th className="font-medium px-6 py-3">Name</th>
                <th className="font-medium px-6 py-3">Username</th>
                <th className="font-medium px-6 py-3">Email</th>
                <th className="font-medium px-6 py-3">Joined</th>
                <th className="font-medium px-6 py-3">Last active</th>
                <th className="font-medium px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <Fragment key={u.id}>
                  <tr className="border-t border-line/10 hover:bg-line/[0.03] transition-colors">
                    <td className="px-6 py-3 font-medium">{u.name}</td>
                    <td className="px-6 py-3 text-muted">@{u.username}</td>
                    <td className="px-6 py-3 text-muted">{u.email}</td>
                    <td className="px-6 py-3 text-subtle">{shortDate(u.created_at)}</td>
                    <td className="px-6 py-3 text-subtle">{shortDate(u.last_login_at)}</td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => setEditingId(editingId === u.id ? null : u.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-line/5 hover:bg-line/10 border border-line/10 transition-colors text-xs font-medium"
                      >
                        <FiKey size={12} /> Set password
                      </button>
                    </td>
                  </tr>
                  <AnimatePresence>
                    {editingId === u.id && (
                      <tr>
                        <td colSpan={6} className="p-0">
                          <PasswordEditor userId={u.id} onClose={() => setEditingId(null)} />
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};

export default AdminUsersTable;
