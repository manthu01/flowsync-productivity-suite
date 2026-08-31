import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaBars, FaTimes } from "react-icons/fa";
import { getToken, getStoredUser, logout } from "../services/authService";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/tasks", label: "Tasks" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact Us" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAuthed = !!getToken();
  const user = getStoredUser();

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/login");
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-40 backdrop-blur-xl bg-black/40 border-b border-white/10"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
        <Link to="/" data-cursor-hover className="text-lg font-extrabold tracking-tight">
          FlowSync
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              data-cursor-hover
              className={({ isActive }) =>
                `relative px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive ? "text-white" : "text-zinc-400 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 -z-10 rounded-lg bg-white/[0.06] border border-white/10"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {isAuthed ? (
            <>
              {user?.name && (
                <span className="text-zinc-400 text-sm">Hi, {user.name.split(" ")[0]}</span>
              )}
              <button
                onClick={handleLogout}
                data-cursor-hover
                className="bg-white/5 hover:bg-white/10 border border-white/10 transition-colors px-4 py-2 rounded-xl font-medium text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                data-cursor-hover
                className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                data-cursor-hover
                className="bg-cyan-500 hover:bg-cyan-400 transition-colors px-4 py-2 rounded-xl font-bold text-sm text-black"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          data-cursor-hover
          className="md:hidden text-zinc-300 hover:text-white transition-colors"
          aria-label="Toggle menu"
        >
          {menuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden overflow-hidden border-t border-white/10 bg-black/60"
          >
            <div className="px-6 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? "bg-white/[0.06] text-white" : "text-zinc-400"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              <div className="h-px bg-white/10 my-2" />

              {isAuthed ? (
                <button
                  onClick={handleLogout}
                  className="text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-400"
                >
                  Logout
                </button>
              ) : (
                <div className="flex gap-2 px-3 pt-1">
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 text-center py-2.5 rounded-lg text-sm font-medium text-zinc-300 border border-white/10"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 text-center py-2.5 rounded-lg text-sm font-bold text-black bg-cyan-500"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;
