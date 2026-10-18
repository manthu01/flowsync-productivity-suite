const { z } = require("zod");

const STATUSES = ["In Progress", "Completed"];
const PRIORITIES = ["Low", "Medium", "High"];
const CATEGORIES = ["Work", "Personal", "Urgent", "Other"];
const MOODS = ["Grind", "Chill", "Creative", "Admin"];
const RECURRENCES = ["None", "Daily", "Weekly", "Monthly"];

const taskSchema = z.object({
    title: z.string().trim().min(1, "Title is required").max(255),
    description: z.string().trim().max(5000).optional().default(""),
    status: z.enum(STATUSES).optional().default("In Progress"),
    priority: z.enum(PRIORITIES).optional().default("Medium"),
    category: z.enum(CATEGORIES).optional().default("Other"),
    mood: z.enum(MOODS).optional().default("Chill"),
    recurrence: z.enum(RECURRENCES).optional().default("None"),
    due_date: z.string().optional().nullable(),
});

const shareTaskSchema = z.object({
    username: z.string().trim().min(1, "Username is required"),
});

module.exports = { taskSchema, shareTaskSchema };
