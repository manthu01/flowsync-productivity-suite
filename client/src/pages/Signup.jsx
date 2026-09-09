import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FiUser, FiAtSign, FiMail } from "react-icons/fi";
import { signup } from "../services/authService";
import AuthLayout from "../components/AuthLayout";
import PasswordInput from "../components/PasswordInput";
import { useTheme } from "../context/ThemeContext";

const Signup = () => {
  const navigate = useNavigate();
  const { setThemeFromServer } = useTheme();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await signup({ name, username, email, password });
      localStorage.setItem("flowsync_token", data.token);
      localStorage.setItem("flowsync_user", JSON.stringify(data.user));
      setThemeFromServer(data.user.theme);
      toast.success(`Welcome to FlowSync, ${data.user.name.split(" ")[0]}`);
      navigate("/dashboard");
    } catch (err) {
      const message = err.response?.data?.message || "Signup failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout eyebrow="Get started" title="Create your account" subtitle="Free — no card required">
      {error && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-red-500/10 text-red-400 text-sm p-3 rounded-xl mb-4 border border-red-500/20"
        >
          {error}
        </motion.p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" size={16} />
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full p-3 pl-10 rounded-xl bg-line/[0.04] border border-line/10 outline-none focus:border-cyan-400/50 transition-colors"
          />
        </div>

        <div className="relative">
          <FiAtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" size={16} />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
            required
            minLength={3}
            maxLength={20}
            pattern="[a-zA-Z0-9_]+"
            title="Letters, numbers, and underscores only"
            className="w-full p-3 pl-10 rounded-xl bg-line/[0.04] border border-line/10 outline-none focus:border-cyan-400/50 transition-colors"
          />
        </div>

        <div className="relative">
          <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" size={16} />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 pl-10 rounded-xl bg-line/[0.04] border border-line/10 outline-none focus:border-cyan-400/50 transition-colors"
          />
        </div>

        <PasswordInput
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />

        <motion.button
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          type="submit"
          disabled={loading}
          className="bg-cyan-500 hover:bg-cyan-400 transition-colors p-3 rounded-xl font-bold text-black disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </motion.button>
      </form>

      <p className="text-subtle text-sm text-center mt-6">
        Already have an account?{" "}
        <Link to="/login" className="text-cyan-400 hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Signup;
