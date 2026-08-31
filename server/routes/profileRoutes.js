const express = require("express");
const multer = require("multer");

const router = express.Router();

const requireAuth = require("../middleware/authMiddleware");
const {
    getProfile,
    updateName,
    updateUsername,
    updateTheme,
    uploadAvatarHandler,
} = require("../controllers/profileController");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        cb(null, file.mimetype.startsWith("image/"));
    },
});

router.use(requireAuth);

router.get("/", getProfile);
router.put("/name", updateName);
router.put("/username", updateUsername);
router.put("/theme", updateTheme);
router.post("/avatar", upload.single("avatar"), uploadAvatarHandler);

module.exports = router;
