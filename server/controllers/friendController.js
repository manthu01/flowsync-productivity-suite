const db = require("../config/db");

const MAX_STARRED = 3;

const query = (sql, params) =>
    new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => (err ? reject(err) : resolve(result)));
    });

const PROFILE_FIELDS = "id, name, username, avatar_url";

// Sends a friend request by username. If that person already sent *us* a pending
// request, this accepts it instead of creating a duplicate reverse request.
const sendRequest = async (req, res) => {
    const { username } = req.body;

    if (!username || !username.trim()) {
        return res.status(400).json({ message: "Username is required" });
    }

    try {
        const targets = await query(`SELECT ${PROFILE_FIELDS} FROM users WHERE username = ?`, [
            username.trim(),
        ]);

        if (targets.length === 0) {
            return res.status(404).json({ message: "No user with that username" });
        }

        const target = targets[0];

        if (target.id === req.userId) {
            return res.status(400).json({ message: "You can't add yourself" });
        }

        const existing = await query(
            "SELECT * FROM friend_requests WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
            [req.userId, target.id, target.id, req.userId]
        );

        if (existing.length > 0) {
            const row = existing[0];

            if (row.status === "accepted") {
                return res.status(409).json({ message: "You're already friends" });
            }

            if (row.sender_id === req.userId) {
                return res.status(409).json({ message: "Friend request already sent" });
            }

            // They'd already requested us — treat this as accepting theirs.
            await query(
                "UPDATE friend_requests SET status = 'accepted', responded_at = NOW() WHERE id = ?",
                [row.id]
            );
            return res.status(200).json({ message: `You and ${target.username} are now friends` });
        }

        await query("INSERT INTO friend_requests (sender_id, receiver_id) VALUES (?, ?)", [
            req.userId,
            target.id,
        ]);

        res.status(201).json({ message: "Friend request sent" });
    } catch (error) {
        res.status(500).json({ message: "Couldn't send friend request" });
    }
};

const getFriends = async (req, res) => {
    try {
        const friends = await query(
            `SELECT u.id, u.name, u.username, u.avatar_url, fr.created_at AS friends_since,
                    (sf.friend_id IS NOT NULL) AS starred
             FROM friend_requests fr
             JOIN users u ON u.id = CASE WHEN fr.sender_id = ? THEN fr.receiver_id ELSE fr.sender_id END
             LEFT JOIN starred_friends sf ON sf.user_id = ? AND sf.friend_id = u.id
             WHERE fr.status = 'accepted' AND (fr.sender_id = ? OR fr.receiver_id = ?)
             ORDER BY starred DESC, u.name ASC`,
            [req.userId, req.userId, req.userId, req.userId]
        );

        res.status(200).json(friends.map((f) => ({ ...f, starred: !!f.starred })));
    } catch (error) {
        res.status(500).json({ message: "Couldn't load friends" });
    }
};

const getPending = async (req, res) => {
    try {
        const [incoming, outgoing] = await Promise.all([
            query(
                `SELECT fr.id AS request_id, fr.created_at, u.id, u.name, u.username, u.avatar_url
                 FROM friend_requests fr JOIN users u ON u.id = fr.sender_id
                 WHERE fr.receiver_id = ? AND fr.status = 'pending'
                 ORDER BY fr.created_at DESC`,
                [req.userId]
            ),
            query(
                `SELECT fr.id AS request_id, fr.created_at, u.id, u.name, u.username, u.avatar_url
                 FROM friend_requests fr JOIN users u ON u.id = fr.receiver_id
                 WHERE fr.sender_id = ? AND fr.status = 'pending'
                 ORDER BY fr.created_at DESC`,
                [req.userId]
            ),
        ]);

        res.status(200).json({ incoming, outgoing });
    } catch (error) {
        res.status(500).json({ message: "Couldn't load pending requests" });
    }
};

const acceptRequest = async (req, res) => {
    const { requestId } = req.params;

    try {
        const result = await query(
            "UPDATE friend_requests SET status = 'accepted', responded_at = NOW() WHERE id = ? AND receiver_id = ? AND status = 'pending'",
            [requestId, req.userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Request not found" });
        }

        res.status(200).json({ message: "Friend request accepted" });
    } catch (error) {
        res.status(500).json({ message: "Couldn't accept request" });
    }
};

// Declines an incoming request, or cancels one you sent — either way it's just
// removing a pending row that involves you.
const removeRequest = async (req, res) => {
    const { requestId } = req.params;

    try {
        const result = await query(
            "DELETE FROM friend_requests WHERE id = ? AND (sender_id = ? OR receiver_id = ?) AND status = 'pending'",
            [requestId, req.userId, req.userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Request not found" });
        }

        res.status(200).json({ message: "Request removed" });
    } catch (error) {
        res.status(500).json({ message: "Couldn't remove request" });
    }
};

const removeFriend = async (req, res) => {
    const friendId = Number(req.params.friendId);

    try {
        const result = await query(
            "DELETE FROM friend_requests WHERE status = 'accepted' AND ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))",
            [req.userId, friendId, friendId, req.userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Friendship not found" });
        }

        await query(
            "DELETE FROM starred_friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)",
            [req.userId, friendId, friendId, req.userId]
        );

        res.status(200).json({ message: "Friend removed" });
    } catch (error) {
        res.status(500).json({ message: "Couldn't remove friend" });
    }
};

const verifyIsFriend = async (userId, friendId) => {
    const rows = await query(
        "SELECT id FROM friend_requests WHERE status = 'accepted' AND ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))",
        [userId, friendId, friendId, userId]
    );
    return rows.length > 0;
};

const starFriend = async (req, res) => {
    const friendId = Number(req.params.friendId);

    try {
        const isFriend = await verifyIsFriend(req.userId, friendId);
        if (!isFriend) return res.status(404).json({ message: "Friendship not found" });

        const starred = await query("SELECT friend_id FROM starred_friends WHERE user_id = ?", [
            req.userId,
        ]);

        if (starred.some((s) => s.friend_id === friendId)) {
            return res.status(200).json({ message: "Already starred" });
        }

        if (starred.length >= MAX_STARRED) {
            return res.status(400).json({ message: `You can only star up to ${MAX_STARRED} friends` });
        }

        await query("INSERT INTO starred_friends (user_id, friend_id) VALUES (?, ?)", [
            req.userId,
            friendId,
        ]);

        res.status(200).json({ message: "Friend starred" });
    } catch (error) {
        res.status(500).json({ message: "Couldn't star friend" });
    }
};

const unstarFriend = async (req, res) => {
    const friendId = Number(req.params.friendId);

    try {
        await query("DELETE FROM starred_friends WHERE user_id = ? AND friend_id = ?", [
            req.userId,
            friendId,
        ]);
        res.status(200).json({ message: "Friend unstarred" });
    } catch (error) {
        res.status(500).json({ message: "Couldn't unstar friend" });
    }
};

module.exports = {
    sendRequest,
    getFriends,
    getPending,
    acceptRequest,
    removeRequest,
    removeFriend,
    starFriend,
    unstarFriend,
};
