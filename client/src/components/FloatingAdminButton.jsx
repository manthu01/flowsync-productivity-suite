import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaCrown } from "react-icons/fa6";
import { getStoredUser } from "../services/authService";

// The "secret" admin entrance: a floating, glowing button that only renders for
// accounts whose email is in ADMIN_EMAILS (server-enforced — this is just the door,
// not the lock). Deliberately not another navbar icon like everything else, so it
// reads as a found thing rather than a menu item.
const FloatingAdminButton = () => {
  const navigate = useNavigate();
  const [hovering, setHovering] = useState(false);
  const user = getStoredUser();

  if (!user?.is_admin) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, rotate: -180 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.7 }}
      className="fixed bottom-6 right-6 z-50"
      onHoverStart={() => setHovering(true)}
      onHoverEnd={() => setHovering(false)}
    >
      <motion.div
        animate={{ scale: [1, 1.35, 1], opacity: [0.55, 0, 0.55] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500"
      />

      <AnimatePresence>
        {hovering && (
          <motion.span
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            className="absolute right-full top-1/2 -translate-y-1/2 mr-3 whitespace-nowrap bg-panel border border-line/10 text-fg text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg"
          >
            You have the keys 👑
          </motion.span>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => navigate("/admin")}
        data-cursor-hover
        aria-label="Admin dashboard"
        whileHover={{ scale: 1.12, rotate: 8 }}
        whileTap={{ scale: 0.9 }}
        className="relative w-14 h-14 rounded-full flex items-center justify-center text-black bg-gradient-to-br from-cyan-400 to-fuchsia-500 shadow-[0_8px_30px_rgba(34,211,238,0.4)]"
      >
        <FaCrown size={22} />
      </motion.button>
    </motion.div>
  );
};

export default FloatingAdminButton;
