import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { verifyEmail } from "../services/authService";
import AmbientBackground from "../components/AmbientBackground";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // verifying | success | error
  const [status, setStatus] = useState(token ? "verifying" : "error");
  const [message, setMessage] = useState(token ? "" : "Missing verification token.");

  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const data = await verifyEmail(token);
        setStatus("success");
        setMessage(data.message);
      } catch (err) {
        setStatus("error");
        setMessage(err.response?.data?.message || "Verification failed");
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center text-fg p-6 relative">
      <AmbientBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm bg-line/[0.03] backdrop-blur-xl border border-line/10 p-8 rounded-3xl relative z-10 shadow-[0_0_60px_rgba(0,0,0,0.5)] text-center"
      >
        <h1 className="text-3xl font-extrabold mb-6 tracking-tight">FlowSync</h1>

        {status === "verifying" && (
          <p className="text-muted">Verifying your email...</p>
        )}

        {status === "success" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <p className="text-2xl mb-3">✅</p>
            <p className="text-muted mb-6">{message}</p>
            <Link
              to="/login"
              className="inline-block bg-cyan-500 hover:bg-cyan-400 transition-colors px-6 py-2.5 rounded-xl font-bold text-black"
            >
              Log In
            </Link>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <p className="text-2xl mb-3">⚠️</p>
            <p className="text-red-400 mb-6">{message}</p>
            <Link to="/signup" className="text-cyan-400 hover:underline text-sm">
              Back to Sign Up
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
