// Wraps a zod schema as body-validation middleware. Replaces req.body with the
// parsed (and coerced/defaulted) result so downstream controllers can trust it.
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
        const message = result.error.issues[0]?.message || "Invalid request";
        return res.status(400).json({ message });
    }

    req.body = result.data;
    next();
};

module.exports = validate;
