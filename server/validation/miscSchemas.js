const { z } = require("zod");
const { USERNAME_PATTERN } = require("./authSchemas");

const usernameRule = z
    .string()
    .trim()
    .regex(USERNAME_PATTERN, "Username must be 3-20 characters and can only contain letters, numbers, and underscores");

const subtaskTitle = z.string().trim().min(1, "Subtask title is required").max(255, "Subtask title is too long");

const createSubtaskSchema = z.object({ title: subtaskTitle });

const updateSubtaskSchema = z
    .object({
        title: subtaskTitle.optional(),
        is_completed: z.boolean().optional(),
    })
    .refine((body) => body.title !== undefined || body.is_completed !== undefined, {
        message: "Nothing to update",
    });

const friendRequestSchema = z.object({
    username: z.string().trim().min(1, "Username is required").max(50),
});

const updateNameSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
});

const updateUsernameSchema = z.object({ username: usernameRule });

const updateThemeSchema = z.object({
    theme: z.enum(["light", "dark"], "Theme must be 'light' or 'dark'"),
});

module.exports = {
    createSubtaskSchema,
    updateSubtaskSchema,
    friendRequestSchema,
    updateNameSchema,
    updateUsernameSchema,
    updateThemeSchema,
};
