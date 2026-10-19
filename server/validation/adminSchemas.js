const { z } = require("zod");
const { newPassword } = require("./authSchemas");

const setPasswordSchema = z.object({
    password: newPassword,
});

module.exports = { setPasswordSchema };
