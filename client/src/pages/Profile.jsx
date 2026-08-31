import { useRef, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FiCamera, FiSun, FiMoon, FiEdit2 } from "react-icons/fi";

import AmbientBackground from "../components/AmbientBackground";
import Avatar from "../components/Avatar";
import { useTheme } from "../context/ThemeContext";
import { getStoredUser, updateStoredUser } from "../services/authService";
import { updateName, updateUsername, uploadAvatar } from "../services/profileService";

const USERNAME_COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000;

const daysLeft = (changedAt) => {
  if (!changedAt) return 0;
  const nextAllowed = new Date(changedAt).getTime() + USERNAME_COOLDOWN_MS;
  return Math.max(0, Math.ceil((nextAllowed - Date.now()) / (24 * 60 * 60 * 1000)));
};

const Section = ({ title, description, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-line/[0.03] backdrop-blur-lg border border-line/10 p-6 rounded-3xl"
  >
    <h2 className="text-lg font-bold">{title}</h2>
    {description && <p className="text-subtle text-sm mt-1 mb-5">{description}</p>}
    {!description && <div className="mt-4" />}
    {children}
  </motion.div>
);

const Profile = () => {
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(getStoredUser());

  const [name, setName] = useState(user?.name || "");
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);

  const [username, setUsername] = useState(user?.username || "");
  const [editingUsername, setEditingUsername] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);

  const [uploading, setUploading] = useState(false);

  const cooldownDays = daysLeft(user?.username_changed_at);
  const canChangeUsername = cooldownDays === 0;

  const handleAvatarPick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const data = await uploadAvatar(file);
      updateStoredUser({ avatar_url: data.avatar_url });
      setUser((u) => ({ ...u, avatar_url: data.avatar_url }));
      toast.success("Avatar updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveName = async () => {
    if (!name.trim() || name.trim() === user?.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      await updateName(name.trim());
      updateStoredUser({ name: name.trim() });
      setUser((u) => ({ ...u, name: name.trim() }));
      toast.success("Name updated");
      setEditingName(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't update name");
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!username.trim() || username.trim() === user?.username) {
      setEditingUsername(false);
      return;
    }
    setSavingUsername(true);
    try {
      const data = await updateUsername(username.trim());
      const changedAt = new Date().toISOString();
      updateStoredUser({ username: data.username, username_changed_at: changedAt });
      setUser((u) => ({ ...u, username: data.username, username_changed_at: changedAt }));
      toast.success("Username updated");
      setEditingUsername(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't update username");
    } finally {
      setSavingUsername(false);
    }
  };

  return (
    <div className="min-h-screen text-fg p-6 md:p-8 relative">
      <AmbientBackground />

      <div className="relative z-10 max-w-2xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-3xl md:text-4xl font-extrabold tracking-tight mb-8"
        >
          Profile
        </motion.h1>

        <div className="flex flex-col gap-6">
          <Section title="Picture">
            <div className="flex items-center gap-5">
              <div className="relative">
                <Avatar src={user?.avatar_url} name={user?.name} size="lg" />
                <button
                  onClick={handleAvatarPick}
                  disabled={uploading}
                  data-cursor-hover
                  aria-label="Change avatar"
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black flex items-center justify-center border-2 border-panel transition-colors disabled:opacity-50"
                >
                  <FiCamera size={14} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div>
                <p className="font-medium">{uploading ? "Uploading..." : "Profile picture"}</p>
                <p className="text-subtle text-sm">PNG or JPG, up to 5MB.</p>
              </div>
            </div>
          </Section>

          <Section title="Name" delay={0.05}>
            <div className="flex items-center gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!editingName || savingName}
                className="flex-1 p-3 rounded-xl bg-line/[0.04] border border-line/10 outline-none focus:border-cyan-400/50 transition-colors disabled:opacity-70"
              />
              {editingName ? (
                <button
                  onClick={handleSaveName}
                  disabled={savingName}
                  data-cursor-hover
                  className="bg-cyan-500 hover:bg-cyan-400 transition-colors px-4 py-3 rounded-xl font-bold text-black text-sm disabled:opacity-50"
                >
                  {savingName ? "Saving..." : "Save"}
                </button>
              ) : (
                <button
                  onClick={() => setEditingName(true)}
                  data-cursor-hover
                  aria-label="Edit name"
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-line/5 hover:bg-line/10 border border-line/10 transition-colors"
                >
                  <FiEdit2 size={16} />
                </button>
              )}
            </div>
          </Section>

          <Section title="Username" delay={0.1}>
            <div className="flex items-center gap-3">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={!editingUsername || savingUsername}
                className="flex-1 p-3 rounded-xl bg-line/[0.04] border border-line/10 outline-none focus:border-cyan-400/50 transition-colors disabled:opacity-70"
              />
              {editingUsername ? (
                <button
                  onClick={handleSaveUsername}
                  disabled={savingUsername}
                  data-cursor-hover
                  className="bg-cyan-500 hover:bg-cyan-400 transition-colors px-4 py-3 rounded-xl font-bold text-black text-sm disabled:opacity-50"
                >
                  {savingUsername ? "Saving..." : "Save"}
                </button>
              ) : (
                <button
                  onClick={() => canChangeUsername && setEditingUsername(true)}
                  disabled={!canChangeUsername}
                  data-cursor-hover
                  aria-label="Edit username"
                  title={canChangeUsername ? "Edit username" : `Available again in ${cooldownDays}d`}
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-line/5 hover:bg-line/10 border border-line/10 transition-colors disabled:opacity-40 disabled:hover:bg-line/5"
                >
                  <FiEdit2 size={16} />
                </button>
              )}
            </div>
            <p className="text-subtle text-xs mt-2">
              {canChangeUsername
                ? "You can change your username once every 90 days."
                : `You've recently changed your username — try again in ${cooldownDays} day${cooldownDays === 1 ? "" : "s"}.`}
            </p>
          </Section>

          <Section
            title="Theme"
            description="Switch between light and dark for the whole site."
            delay={0.15}
          >
            <button
              onClick={toggleTheme}
              data-cursor-hover
              className="w-full flex items-center justify-between p-4 rounded-xl bg-line/[0.04] border border-line/10 hover:border-line/20 transition-colors"
            >
              <span className="flex items-center gap-3 font-medium">
                {theme === "dark" ? <FiMoon size={18} /> : <FiSun size={18} />}
                {theme === "dark" ? "Dark mode" : "Light mode"}
              </span>
              <span className="relative w-12 h-7 rounded-full bg-line/10 border border-line/10">
                <motion.span
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-0.5 w-6 h-6 rounded-full bg-cyan-500"
                  style={{ left: theme === "dark" ? "calc(100% - 26px)" : "2px" }}
                />
              </span>
            </button>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
