import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiUserPlus, FiX } from "react-icons/fi";
import { getFriends } from "../services/friendService";
import { getCollaborators, shareTask, unshareTask } from "../services/taskService";

// Owner-only panel for managing who a task is shared with. Sharing is limited to
// accepted friends (enforced server-side too) — this just surfaces that as a picker
// instead of a free-text username field.
const TaskCollaborators = ({ taskId, onChanged }) => {
  const [collaborators, setCollaborators] = useState([]);
  const [friends, setFriends] = useState([]);
  const [picked, setPicked] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [collabData, friendData] = await Promise.all([getCollaborators(taskId), getFriends()]);
      setCollaborators(collabData);
      setFriends(friendData);
    } catch {
      toast.error("Couldn't load sharing info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const shareable = friends.filter((f) => !collaborators.some((c) => c.id === f.id));

  const handleShare = async () => {
    if (!picked) return;
    setSaving(true);
    try {
      await shareTask(taskId, picked);
      setPicked("");
      await load();
      onChanged?.();
      toast.success("Task shared");
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't share task");
    } finally {
      setSaving(false);
    }
  };

  const handleUnshare = async (userId) => {
    try {
      await unshareTask(taskId, userId);
      setCollaborators((prev) => prev.filter((c) => c.id !== userId));
      onChanged?.();
    } catch {
      toast.error("Couldn't remove access");
    }
  };

  if (loading) return <p className="text-xs text-subtle">Loading sharing info...</p>;

  return (
    <div className="flex flex-col gap-3">
      {collaborators.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {collaborators.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-line/[0.06] border border-line/10 text-xs"
            >
              @{c.username}
              <button
                onClick={() => handleUnshare(c.id)}
                className="p-0.5 rounded-full hover:bg-line/10 transition-colors"
                aria-label={`Remove ${c.username}`}
              >
                <FiX size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {shareable.length > 0 ? (
        <div className="flex gap-2">
          <select
            value={picked}
            onChange={(e) => setPicked(e.target.value)}
            className="flex-1 p-2 rounded-lg bg-line/[0.04] border border-line/10 outline-none focus:border-cyan-400/50 transition-colors text-sm"
          >
            <option value="">Share with a friend...</option>
            {shareable.map((f) => (
              <option key={f.id} value={f.username}>
                {f.name} (@{f.username})
              </option>
            ))}
          </select>
          <button
            onClick={handleShare}
            disabled={!picked || saving}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-line/5 hover:bg-line/10 border border-line/10 transition-colors text-xs font-medium disabled:opacity-50"
          >
            <FiUserPlus size={13} /> Share
          </button>
        </div>
      ) : (
        <p className="text-xs text-subtle">
          {friends.length === 0 ? "Add friends to be able to share tasks." : "Already shared with all your friends."}
        </p>
      )}
    </div>
  );
};

export default TaskCollaborators;
