import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import AmbientBackground from "../components/AmbientBackground";
import { getToken } from "../services/authService";

const NotFound = () => {
  const { pathname } = useLocation();
  const isAuthed = !!getToken();

  return (
    <div className="relative">
      <AmbientBackground />

      <section className="relative z-10 max-w-xl mx-auto px-6 md:px-8 pt-24 pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="hud text-center !py-12"
        >
          <span className="hud-corner hud-c1" />
          <span className="hud-corner hud-c2" />
          <span className="hud-corner hud-c3" />
          <span className="hud-corner hud-c4" />

          <p className="hud-hint mb-6 text-[rgb(var(--hud))]">SIGNAL LOST // NO TARGET</p>
          <h1 className="text-7xl md:text-8xl font-bold tracking-tight text-[rgb(var(--hud))] [text-shadow:0_0_24px_rgb(var(--hud)/0.45)]">
            404
          </h1>
          <p className="mt-6 text-muted text-sm break-all">
            Nothing is docked at <span className="text-fg">{pathname}</span>
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3 text-xs font-bold tracking-widest uppercase">
            <Link
              to={isAuthed ? "/tasks" : "/"}
              data-cursor-hover
              className="px-5 py-3 bg-[rgb(var(--hud))] text-[rgb(var(--hud-ink))] hover:opacity-90 transition-opacity"
            >
              {isAuthed ? "Back to tasks" : "Back home"}
            </Link>
            {isAuthed && (
              <Link
                to="/dashboard"
                data-cursor-hover
                className="px-5 py-3 border border-[rgb(var(--hud)/0.4)] text-[rgb(var(--hud))] hover:bg-[rgb(var(--hud)/0.1)] transition-colors"
              >
                Dashboard
              </Link>
            )}
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default NotFound;
