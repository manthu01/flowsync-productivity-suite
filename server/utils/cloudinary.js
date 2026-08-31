const cloudinary = require("cloudinary").v2;

const configured = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (configured) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

// Uploads an in-memory image buffer (from multer) and returns its public URL.
// Images land in a per-user-scoped public ID so a re-upload overwrites the old one
// instead of piling up unused files in the account.
const uploadAvatar = (buffer, userId) =>
    new Promise((resolve, reject) => {
        if (!configured) {
            return reject(new Error("Avatar upload is not configured"));
        }

        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "flowsync/avatars",
                public_id: `user_${userId}`,
                overwrite: true,
                resource_type: "image",
                transformation: [{ width: 256, height: 256, crop: "fill", gravity: "face" }],
            },
            (err, result) => (err ? reject(err) : resolve(result.secure_url))
        );

        stream.end(buffer);
    });

module.exports = { uploadAvatar, isConfigured: () => configured };
