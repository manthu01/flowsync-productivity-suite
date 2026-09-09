import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FiMail } from "react-icons/fi";
import { login } from "../services/authService";
import AuthLayout from "../components/AuthLayout";
import PasswordInput from "../components/PasswordInput";
import { useTheme } from "../context/ThemeContext";

const Login = () => {
  const navigate = useNavigate();
  const { setThemeFromServer } = useTheme();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout eyebrow="Welcome back" title="Sign in" subtitle="Pick up right where you left off">
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-red-500/10 text-red-400 text-sm p-3 rounded-xl mb-4 border border-red-500/20"
        >
          <p>{error}</p>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" size={16} />
          <input
            type="text"
            placeholder="Email or Username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            className="w-full p-3 pl-10 rounded-xl bg-line/[0.04] border border-line/10 outline-none focus:border-cyan-400/50 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <PasswordInput
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
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
      </form>

      <p className="text-subtle text-sm text-center mt-6">
        Don't have an account?{" "}
        <Link to="/signup" className="text-cyan-400 hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
