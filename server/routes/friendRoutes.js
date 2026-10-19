const express = require("express");

const router = express.Router();

const requireAuth = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { writeLimiter } = require("../middleware/rateLimit");
const { numericIdParam } = require("../middleware/idParams");
const { friendRequestSchema } = require("../validation/miscSchemas");
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
router.use(writeLimiter);

router.param("requestId", numericIdParam);
router.param("friendId", numericIdParam);

router.get("/", getFriends);
router.get("/pending", getPending);
router.post("/request", validate(friendRequestSchema), sendRequest);
router.post("/requests/:requestId/accept", acceptRequest);
router.delete("/requests/:requestId", removeRequest);
router.delete("/:friendId", removeFriend);
router.post("/:friendId/star", starFriend);
router.delete("/:friendId/star", unstarFriend);

module.exports = router;
