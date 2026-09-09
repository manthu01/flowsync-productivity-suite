import { motion } from "framer-motion";

const fullDate = (iso) =>
  new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

const AdminInboxList = ({ messages }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="bg-line/[0.03] backdrop-blur-lg border border-line/10 rounded-3xl overflow-hidden"
  >
    <div className="flex items-center justify-between p-6 pb-4">
      <h2 className="text-xl font-bold">Contact Us Inbox</h2>
      <span className="text-subtle text-sm">{messages.length} message{messages.length === 1 ? "" : "s"}</span>
    </div>

    {messages.length === 0 ? (
      <div className="p-10 text-center text-subtle border-t border-line/10">No messages yet.</div>
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
  </motion.div>
);

export default AdminInboxList;
