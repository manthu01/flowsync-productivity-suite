import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FiSearch } from "react-icons/fi";
import { getAdminContactMessages } from "../../services/adminService";
import AdminPagination from "./AdminPagination";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

const fullDate = (iso) =>
  new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

const AdminInboxList = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [messages, setMessages] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getAdminContactMessages({ search: debouncedSearch, page, pageSize: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return;
        setMessages(data.messages);
        setTotal(data.total);
      })
      .catch(() => {
        if (!cancelled) toast.error("Couldn't load messages");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, page]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-line/[0.03] backdrop-blur-lg border border-line/10 rounded-3xl overflow-hidden"
    >
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Contact Us Inbox</h2>
          <span className="text-subtle text-sm">{total} message{total === 1 ? "" : "s"}</span>
        </div>
        <div className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" size={15} />
          <input
            type="text"
            placeholder="Search by name, email, or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2.5 pl-10 rounded-xl bg-line/[0.04] border border-line/10 outline-none focus:border-cyan-400/50 transition-colors text-sm"
          />
        </div>
      </div>

      {!loading && messages.length === 0 ? (
        <div className="p-10 text-center text-subtle border-t border-line/10">No messages found.</div>
      ) : (
        <div className="border-t border-line/10 divide-y divide-line/10">
          {messages.map((m) => (
            <div key={m.id} className="p-6 hover:bg-line/[0.03] transition-colors">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                <div>
                  <span className="font-semibold">{m.name}</span>{" "}
                  <a href={`mailto:${m.email}`} className="text-cyan-400 hover:underline text-sm">
                    {m.email}
                  </a>
                </div>
                <span className="text-subtle text-xs shrink-0">{fullDate(m.created_at)}</span>
              </div>
              <p className="text-muted text-sm leading-relaxed whitespace-pre-wrap">{m.message}</p>
            </div>
          ))}
        </div>
      )}

      <AdminPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </motion.div>
  );
};

export default AdminInboxList;
