import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaBars, FaTimes } from "react-icons/fa";
import { FiUserPlus } from "react-icons/fi";
import { FaShieldHalved } from "react-icons/fa6";
import { getToken, getStoredUser, logout } from "../services/authService";
import { getPendingRequests } from "../services/friendService";
import Avatar from "./Avatar";

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
  const [pendingCount, setPendingCount] = useState(0);
  const isAuthed = !!getToken();
  const user = getStoredUser();

  useEffect(() => {
    if (!isAuthed) return;
    getPendingRequests()
      .then((data) => setPendingCount(data.incoming.length))
      .catch(() => {});
  }, [isAuthed]);

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
      className="sticky top-0 z-40 backdrop-blur-xl bg-surface/40 border-b border-line/10"
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
                  isActive ? "text-fg" : "text-muted hover:text-fg"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 -z-10 rounded-lg bg-line/[0.06] border border-line/10"
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
              <Link
                to="/friends"
                data-cursor-hover
                aria-label="Friends"
                className="relative w-10 h-10 rounded-full flex items-center justify-center text-fg bg-line/5 hover:bg-line/10 border border-line/10 transition-colors"
              >
                <FiUserPlus size={18} />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-cyan-500 text-black text-[10px] font-bold flex items-center justify-center">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </Link>
              {user?.is_admin && (
                <Link
                  to="/admin"
                  data-cursor-hover
                  aria-label="Admin dashboard"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-fg bg-line/5 hover:bg-line/10 border border-line/10 transition-colors"
                >
                  <FaShieldHalved size={16} />
                </Link>
              )}
              <Link to="/profile" data-cursor-hover aria-label="Profile">
                <Avatar src={user?.avatar_url} name={user?.name} size="md" />
              </Link>
              <button
                onClick={handleLogout}
                data-cursor-hover
                className="bg-line/5 hover:bg-line/10 border border-line/10 transition-colors px-4 py-2 rounded-xl font-medium text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                data-cursor-hover
                className="px-4 py-2 text-sm font-medium text-muted hover:text-fg transition-colors"
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
          className="md:hidden text-muted hover:text-fg transition-colors"
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
            className="md:hidden overflow-hidden border-t border-line/10 bg-surface/60"
          >
            <div className="px-6 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? "bg-line/[0.06] text-fg" : "text-muted"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              <div className="h-px bg-line/10 my-2" />

              {isAuthed ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-fg"
                  >
                    <Avatar src={user?.avatar_url} name={user?.name} size="sm" />
                    Profile
                  </Link>
                  <Link
                    to="/friends"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-fg"
                  >
                    <FiUserPlus size={18} />
                    Friends
                    {pendingCount > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-cyan-500 text-black text-[10px] font-bold flex items-center justify-center">
                        {pendingCount > 9 ? "9+" : pendingCount}
                      </span>
                    )}
                  </Link>
                  {user?.is_admin && (
                    <Link
                      to="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-fg"
                    >
                      <FaShieldHalved size={16} />
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-400"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex gap-2 px-3 pt-1">
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 text-center py-2.5 rounded-lg text-sm font-medium text-muted border border-line/10"
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
