jest.mock("../config/db", () => ({ query: jest.fn() }));

const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../app");
const { queueDbResults, setSession, resetDb } = require("./helpers/mockDb");

const tokenFor = (id) => `Bearer ${jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" })}`;

beforeEach(() => {
    jest.clearAllMocks();
    resetDb();
});

describe("admin routes require is_admin", () => {
    it("rejects a non-admin user", async () => {
        const res = await request(app).get("/api/admin/users").set("Authorization", tokenFor(2));
        expect(res.status).toBe(403);
    });

    it("doesn't grant admin from an admin-looking email", async () => {
        // Admin rights come only from the is_admin column now.
        setSession({ is_admin: false, email: "Admin@Example.com" });

        const res = await request(app).get("/api/admin/stats").set("Authorization", tokenFor(3));
        expect(res.status).toBe(403);
    });

    it("allows an admin user through", async () => {
        setSession({ is_admin: true });
        queueDbResults(
            { result: [{ total: "1" }] }, // getUsers count
            { result: [{ id: 1, name: "U", email: "u@example.com" }] } // getUsers rows
        );

        const res = await request(app).get("/api/admin/users").set("Authorization", tokenFor(1));
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.users)).toBe(true);
        expect(res.body.total).toBe(1);
    });

    it("supports a search query param", async () => {
        setSession({ is_admin: true });
        queueDbResults(
            { result: [{ total: "0" }] },
            { result: [] }
        );

        const res = await request(app)
            .get("/api/admin/users?search=nobody&page=1&pageSize=10")
            .set("Authorization", tokenFor(1));
        expect(res.status).toBe(200);
        expect(res.body.users).toEqual([]);
        expect(res.body.page).toBe(1);
    });
});

describe("PUT /api/admin/users/:id/password", () => {
    it("rejects a short password before touching the db", async () => {
        setSession({ is_admin: true });

        const res = await request(app)
            .put("/api/admin/users/2/password")
            .set("Authorization", tokenFor(1))
            .send({ password: "123" });
        expect(res.status).toBe(400);
    });

    it("updates the password and writes an audit log entry", async () => {
        setSession({ is_admin: true });
        queueDbResults(
            { result: { affectedRows: 1 } }, // UPDATE users (also bumps token_version)
            { result: { affectedRows: 1 } } // INSERT admin_actions
        );

        const res = await request(app)
            .put("/api/admin/users/2/password")
            .set("Authorization", tokenFor(1))
            .send({ password: "newpassword123" });
        expect(res.status).toBe(200);
    });

    it("rejects a weak password (no number)", async () => {
        setSession({ is_admin: true });

        const res = await request(app)
            .put("/api/admin/users/2/password")
            .set("Authorization", tokenFor(1))
            .send({ password: "onlyletters" });
        expect(res.status).toBe(400);
    });

    it("returns 404 for a non-numeric user id", async () => {
        setSession({ is_admin: true });

        const res = await request(app)
            .put("/api/admin/users/abc/password")
            .set("Authorization", tokenFor(1))
            .send({ password: "newpassword123" });
        expect(res.status).toBe(404);
    });

    it("returns 404 for a user that doesn't exist", async () => {
        setSession({ is_admin: true });
        queueDbResults(
            { result: { affectedRows: 0 } } // UPDATE users matches nothing
        );

        const res = await request(app)
            .put("/api/admin/users/9999/password")
            .set("Authorization", tokenFor(1))
            .send({ password: "newpassword123" });
        expect(res.status).toBe(404);
    });
});

describe("GET /api/admin/audit-log", () => {
    it("returns logged admin actions", async () => {
        setSession({ is_admin: true });
        queueDbResults(
            { result: [{ total: "1" }] }, // count
            {
                result: [
                    { id: 1, action: "set_password", admin_name: "Admin", target_name: "U", created_at: new Date() },
                ],
            }
        );

        const res = await request(app).get("/api/admin/audit-log").set("Authorization", tokenFor(1));
        expect(res.status).toBe(200);
        expect(res.body.entries[0].action).toBe("set_password");
        expect(res.body.total).toBe(1);
    });
});
