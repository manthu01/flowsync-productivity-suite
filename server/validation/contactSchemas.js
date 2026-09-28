const { z } = require("zod");

const contactMessageSchema = z.object({
    name: z.string().trim().min(1, "Name, email, and message are all required").max(255),
    email: z.email("A valid email is required"),
    message: z.string().trim().min(1, "Name, email, and message are all required").max(5000),
});

module.exports = { contactMessageSchema };
