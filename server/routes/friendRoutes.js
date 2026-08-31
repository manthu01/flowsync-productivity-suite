const express = require("express");

const router = express.Router();

const requireAuth = require("../middleware/authMiddleware");
const {
    sendRequest,
    getFriends,
    getPending,
    acceptRequest,
    removeRequest,
    removeFriend,
    starFriend,
    unstarFriend,
} = require("../controllers/friendController");

router.use(requireAuth);

router.get("/", getFriends);
router.get("/pending", getPending);
router.post("/request", sendRequest);
router.post("/requests/:requestId/accept", acceptRequest);
router.delete("/requests/:requestId", removeRequest);
router.delete("/:friendId", removeFriend);
router.post("/:friendId/star", starFriend);
router.delete("/:friendId/star", unstarFriend);

module.exports = router;
