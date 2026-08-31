import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { FiStar, FiUserX, FiCheck, FiX, FiSend } from "react-icons/fi";

import AmbientBackground from "../components/AmbientBackground";
import Avatar from "../components/Avatar";
import {
  getFriends,
  getPendingRequests,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriendRequest,
  removeFriend,
  starFriend,
  unstarFriend,
} from "../services/friendService";

const MAX_STARRED = 3;

const TABS = [
  { id: "friends", label: "Friends" },
  { id: "add", label: "Add Friends" },
  { id: "pending", label: "Pending Requests" },
];

const Card = ({ children }) => (
  <div className="bg-line/[0.03] backdrop-blur-lg border border-line/10 p-4 rounded-2xl flex items-center gap-4">
    {children}
  </div>
);

const Friends = () => {
  const [tab, setTab] = useState("friends");
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState({ incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(true);
  const [usernameInput, setUsernameInput] = useState("");
  const [sending, setSending] = useState(false);

  const starredCount = friends.filter((f) => f.starred).length;

  const loadAll = async () => {
    try {
      const [friendsData, pendingData] = await Promise.all([getFriends(), getPendingRequests()]);
      setFriends(friendsData);
      setPending(pendingData);
    } catch {
      toast.error("Couldn't load friends");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadAll();
    })();
  }, []);

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    setSending(true);
    try {
      const data = await sendFriendRequest(usernameInput.trim());
      toast.success(data.message);
      setUsernameInput("");
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't send request");
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await acceptFriendRequest(requestId);
      toast.success("Friend request accepted");
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't accept request");
    }
  };

  const handleRemoveRequest = async (requestId) => {
    try {
      await removeFriendRequest(requestId);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't remove request");
    }
  };

  const handleRemoveFriend = async (friendId) => {
    try {
      await removeFriend(friendId);
      toast.success("Friend removed");
      setFriends((f) => f.filter((x) => x.id !== friendId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't remove friend");
    }
  };

  const handleToggleStar = async (friend) => {
    try {
      if (friend.starred) {
        await unstarFriend(friend.id);
      } else {
        if (starredCount >= MAX_STARRED) {
          toast.error(`You can only star up to ${MAX_STARRED} friends`);
          return;
        }
        await starFriend(friend.id);
      }
      setFriends((prev) =>
        [...prev.map((f) => (f.id === friend.id ? { ...f, starred: !f.starred } : f))].sort(
          (a, b) => (b.starred === a.starred ? a.name.localeCompare(b.name) : b.starred - a.starred)
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't update star");
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
          Friends
        </motion.h1>

        <div className="flex items-center gap-1 mb-8 bg-line/[0.03] border border-line/10 rounded-2xl p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              data-cursor-hover
              className={`relative flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                tab === t.id ? "text-fg" : "text-muted hover:text-fg"
              }`}
            >
              {tab === t.id && (
                <motion.span
                  layoutId="friends-tab-active"
                  className="absolute inset-0 -z-10 rounded-xl bg-line/[0.08] border border-line/10"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              {t.label}
              {t.id === "pending" && pending.incoming.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-cyan-500 text-black text-[10px] font-bold">
                  {pending.incoming.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-3"
          >
            {tab === "friends" && (
              <>
                {!loading && friends.length === 0 && (
                  <div className="bg-line/[0.03] border border-line/10 rounded-3xl p-10 text-center text-subtle">
                    No friends yet. Add someone by their username to get started.
                  </div>
                )}
                {friends.map((friend) => (
                  <Card key={friend.id}>
                    <Avatar src={friend.avatar_url} name={friend.name} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{friend.name}</p>
                      <p className="text-subtle text-sm truncate">@{friend.username}</p>
                    </div>
                    <button
                      onClick={() => handleToggleStar(friend)}
                      data-cursor-hover
                      aria-label={friend.starred ? "Unstar friend" : "Star friend"}
                      title={friend.starred ? "Unstar" : `Star (up to ${MAX_STARRED})`}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-colors ${
                        friend.starred
                          ? "bg-amber-400/15 border-amber-400/30 text-amber-400"
                          : "bg-line/5 border-line/10 text-muted hover:text-fg"
                      }`}
                    >
                      <FiStar size={16} fill={friend.starred ? "currentColor" : "none"} />
                    </button>
                    <button
                      onClick={() => handleRemoveFriend(friend.id)}
                      data-cursor-hover
                      aria-label="Remove friend"
                      title="Remove friend"
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-line/5 hover:bg-red-500/15 border border-line/10 hover:border-red-500/30 text-muted hover:text-red-400 transition-colors"
                    >
                      <FiUserX size={16} />
                    </button>
                  </Card>
                ))}
              </>
            )}

            {tab === "add" && (
              <div className="bg-line/[0.03] backdrop-blur-lg border border-line/10 p-6 rounded-3xl">
                <p className="text-subtle text-sm mb-4">
                  Enter a colleague's exact username to send them a friend request.
                </p>
                <form onSubmit={handleSendRequest} className="flex gap-3">
                  <input
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Username"
                    className="flex-1 p-3 rounded-xl bg-line/[0.04] border border-line/10 outline-none focus:border-cyan-400/50 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    data-cursor-hover
                    className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 transition-colors px-5 py-3 rounded-xl font-bold text-black text-sm disabled:opacity-50"
                  >
                    <FiSend size={14} />
                    {sending ? "Sending..." : "Send"}
                  </button>
                </form>
              </div>
            )}

            {tab === "pending" && (
              <>
                {pending.incoming.length > 0 && (
                  <>
                    <p className="text-subtle text-xs uppercase tracking-wider font-semibold mt-2">
                      Incoming
                    </p>
                    {pending.incoming.map((req) => (
                      <Card key={req.request_id}>
                        <Avatar src={req.avatar_url} name={req.name} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{req.name}</p>
                          <p className="text-subtle text-sm truncate">@{req.username}</p>
                        </div>
                        <button
                          onClick={() => handleAccept(req.request_id)}
                          data-cursor-hover
                          aria-label="Accept"
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 transition-colors"
                        >
                          <FiCheck size={16} />
                        </button>
                        <button
                          onClick={() => handleRemoveRequest(req.request_id)}
                          data-cursor-hover
                          aria-label="Decline"
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-line/5 hover:bg-red-500/15 border border-line/10 hover:border-red-500/30 text-muted hover:text-red-400 transition-colors"
                        >
                          <FiX size={16} />
                        </button>
                      </Card>
                    ))}
                  </>
                )}

                {pending.outgoing.length > 0 && (
                  <>
                    <p className="text-subtle text-xs uppercase tracking-wider font-semibold mt-4">
                      Sent
                    </p>
                    {pending.outgoing.map((req) => (
                      <Card key={req.request_id}>
                        <Avatar src={req.avatar_url} name={req.name} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{req.name}</p>
                          <p className="text-subtle text-sm truncate">@{req.username}</p>
                        </div>
                        <span className="text-subtle text-xs">Waiting...</span>
                        <button
                          onClick={() => handleRemoveRequest(req.request_id)}
                          data-cursor-hover
                          aria-label="Cancel request"
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-line/5 hover:bg-red-500/15 border border-line/10 hover:border-red-500/30 text-muted hover:text-red-400 transition-colors"
                        >
                          <FiX size={16} />
                        </button>
                      </Card>
                    ))}
                  </>
                )}

                {!loading && pending.incoming.length === 0 && pending.outgoing.length === 0 && (
                  <div className="bg-line/[0.03] border border-line/10 rounded-3xl p-10 text-center text-subtle">
                    No pending requests.
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Friends;
