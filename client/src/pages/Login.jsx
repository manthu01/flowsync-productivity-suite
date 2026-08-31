import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { login, resendVerification } from "../services/authService";
import AmbientBackground from "../components/AmbientBackground";
import { useTheme } from "../context/ThemeContext";

const Login = () => {
  const navigate = useNavigate();
  const { setThemeFromServer } = useTheme();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setUnverifiedEmail(null);
    setLoading(true);

    try {
      const data = await login({ identifier, password });
      localStorage.setItem("flowsync_token", data.token);
      localStorage.setItem("flowsync_user", JSON.stringify(data.user));
      setThemeFromServer(data.user.theme);
      toast.success(`Welcome back, ${data.user.name.split(" ")[0]}`);
      navigate("/dashboard");
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      setError(message);
      toast.error(message);
      if (err.response?.data?.unverified) {
        setUnverifiedEmail(err.response.data.email);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!unverifiedEmail) return;
    setResending(true);
    try {
      await resendVerification(unverifiedEmail);
      toast.success("Verification email sent — check your inbox");
    } catch {
      toast.error("Couldn't resend right now");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center text-fg p-6 relative">
      <AmbientBackground />

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm bg-line/[0.03] backdrop-blur-xl border border-line/10 p-8 rounded-3xl relative z-10 shadow-[0_0_60px_rgba(0,0,0,0.5)]"
      >
        <h1 className="text-3xl font-extrabold mb-1 text-center tracking-tight">
          FlowSync
        </h1>
        <p className="text-subtle text-sm text-center mb-8">
          Sign in to your workspace
        </p>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-red-500/10 text-red-400 text-sm p-3 rounded-xl mb-4 border border-red-500/20"
          >
            <p>{error}</p>
            {unverifiedEmail && (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="mt-2 text-cyan-400 hover:underline text-xs disabled:opacity-50"
              >
                {resending ? "Sending..." : "Resend verification email"}
              </button>
            )}
          </motion.div>
        )}

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Email or Username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            className="p-3 rounded-xl bg-line/[0.04] border border-line/10 outline-none focus:border-cyan-400/50 transition-colors"
          />

          <div className="flex flex-col gap-1.5">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="p-3 rounded-xl bg-line/[0.04] border border-line/10 outline-none focus:border-cyan-400/50 transition-colors"
            />
            <Link
              to="/forgot-password"
              className="text-xs text-subtle hover:text-cyan-400 transition-colors self-end"
            >
              Forgot password?
            </Link>
          </div>

          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            type="submit"
            disabled={loading}
            className="bg-cyan-500 hover:bg-cyan-400 transition-colors p-3 rounded-xl font-bold text-black disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log In"}
          </motion.button>
        </div>

        <p className="text-subtle text-sm text-center mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-cyan-400 hover:underline">
            Sign up
          </Link>
        </p>
      </motion.form>
    </div>
  );
};

export default Login;
