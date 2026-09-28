import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FiKey } from "react-icons/fi";
import { getAdminAuditLog } from "../../services/adminService";
import AdminPagination from "./AdminPagination";

const PAGE_SIZE = 20;

const fullDate = (iso) =>
  new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

const ACTION_LABELS = {
  set_password: "reset the password for",
};

const AdminAuditLog = () => {
  const [page, setPage] = useState(1);
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getAdminAuditLog({ page, pageSize: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return;
        setEntries(data.entries);
        setTotal(data.total);
      })
      .catch(() => {
        if (!cancelled) toast.error("Couldn't load the audit log");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-line/[0.03] backdrop-blur-lg border border-line/10 rounded-3xl overflow-hidden"
    >
      <div className="flex items-center justify-between p-6 pb-4">
        <h2 className="text-xl font-bold">Audit Log</h2>
        <span className="text-subtle text-sm">{total} action{total === 1 ? "" : "s"}</span>
      </div>

      {!loading && entries.length === 0 ? (
        <div className="p-10 text-center text-subtle border-t border-line/10">No admin actions logged yet.</div>
      ) : (
        <div className="border-t border-line/10 divide-y divide-line/10">
          {entries.map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-6 py-3 text-sm">
              <FiKey className="text-subtle shrink-0" size={14} />
              <span className="text-muted">
                <span className="font-medium text-fg">{e.admin_name}</span>{" "}
                {ACTION_LABELS[e.action] || e.action}{" "}
                <span className="font-medium text-fg">{e.target_name || "a deleted user"}</span>
              </span>
              <span className="ml-auto text-subtle text-xs shrink-0">{fullDate(e.created_at)}</span>
            </div>
          ))}
        </div>
      )}

      <AdminPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </motion.div>
  );
};

export default AdminAuditLog;
