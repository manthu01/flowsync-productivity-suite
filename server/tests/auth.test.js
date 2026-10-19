jest.mock("../config/db", () => ({ query: jest.fn() }));

const request = require("supertest");
const bcrypt = require("bcryptjs");
const app = require("../app");
const { queueDbResults, setSession, resetDb } = require("./helpers/mockDb");

beforeEach(() => {
    jest.clearAllMocks();
    resetDb();
});

describe("POST /api/auth/signup", () => {
    const validBody = {
        name: "Test User",
        username: "testuser1",
        email: "testuser1@example.com",
        password: "password123",
    };

    it("rejects missing fields", async () => {
        const res = await request(app).post("/api/auth/signup").send({ email: "a@b.com" });
        expect(res.status).toBe(400);
    });

    it("rejects an invalid username", async () => {
        const res = await request(app)
            .post("/api/auth/signup")
            .send({ ...validBody, username: "a" });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/username/i);
    });

    it("rejects a short password", async () => {
        const res = await request(app)
            .post("/api/auth/signup")
            .send({ ...validBody, password: "123" });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/password/i);
    });

    it("rejects a password without a number", async () => {
        const res = await request(app)
            .post("/api/auth/signup")
            .send({ ...validBody, password: "onlyletters" });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/number/i);
    });

    it("stores the email lowercased", async () => {
        queueDbResults({ result: { affectedRows: 1, insertId: 43 } });

        const res = await request(app)
            .post("/api/auth/signup")
            .send({ ...validBody, email: "  TestUser1@Example.COM " });
        expect(res.status).toBe(201);

        const db = require("../config/db");
        const insertCall = db.query.mock.calls.find(([sql]) => /INSERT INTO users/.test(sql));
        expect(insertCall[1][2]).toBe("testuser1@example.com");
        expect(res.body.user.is_admin).toBe(false);
    });

    it("returns 409 on a duplicate email/username", async () => {
        queueDbResults({ error: { code: "23505", constraint: "users_email_key" } });

        const res = await request(app).post("/api/auth/signup").send(validBody);
        expect(res.status).toBe(409);
        expect(res.body.message).toMatch(/email/i);
    });

    it("creates an account and auto-logs in on success", async () => {
        queueDbResults({ result: { affectedRows: 1, insertId: 42 } });

        const res = await request(app).post("/api/auth/signup").send(validBody);
        expect(res.status).toBe(201);
        expect(res.body.token).toBeTruthy();
        expect(res.body.user).toMatchObject({ id: 42, email: validBody.email, is_admin: false });
    });

    it("never leaks a raw db error to the client", async () => {
        queueDbResults({ error: new Error("connection terminated unexpectedly at 10.0.0.5:5432") });

        const res = await request(app).post("/api/auth/signup").send(validBody);
        expect(res.status).toBe(500);
        expect(JSON.stringify(res.body)).not.toMatch(/10\.0\.0\.5/);
    });
});

describe("POST /api/auth/login", () => {
    it("rejects a missing identifier/password", async () => {
        const res = await request(app).post("/api/auth/login").send({});
        expect(res.status).toBe(400);
    });

    it("gives the same answer for an unknown user as for a wrong password", async () => {
        queueDbResults({ result: [] });
        const unknown = await request(app)
            .post("/api/auth/login")
            .send({ identifier: "nobody@example.com", password: "password123" });

        const hashed = await bcrypt.hash("correct-password", 10);
        queueDbResults({ result: [{ id: 1, email: "u@example.com", password: hashed }] });
        const wrong = await request(app)
            .post("/api/auth/login")
            .send({ identifier: "u@example.com", password: "wrong-password" });

        expect(unknown.status).toBe(401);
        expect(wrong.status).toBe(401);
        expect(unknown.body).toEqual(wrong.body);
    });

    it("returns 401 on a wrong password", async () => {
        const hashed = await bcrypt.hash("correct-password", 10);
        queueDbResults({ result: [{ id: 1, email: "u@example.com", password: hashed }] });

        const res = await request(app)
            .post("/api/auth/login")
            .send({ identifier: "u@example.com", password: "wrong-password" });
        expect(res.status).toBe(401);
    });

    it("logs in successfully and never leaks the password hash", async () => {
        const hashed = await bcrypt.hash("correct-password", 10);
        queueDbResults(
            { result: [{ id: 1, email: "u@example.com", username: "u", name: "U", password: hashed, theme: "dark" }] },
            { result: { affectedRows: 1 } } // last_login_at fire-and-forget update
        );

        const res = await request(app)
            .post("/api/auth/login")
            .send({ identifier: "u@example.com", password: "correct-password" });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeTruthy();
        expect(res.body.user.password).toBeUndefined();
    });

    it("never leaks a raw db error to the client", async () => {
        queueDbResults({ error: new Error("relation \"users\" does not exist") });

        const res = await request(app)
            .post("/api/auth/login")
            .send({ identifier: "u@example.com", password: "password123" });
        expect(res.status).toBe(500);
        expect(JSON.stringify(res.body)).not.toMatch(/relation/);
    });
});

describe("POST /api/auth/forgot-password", () => {
    it("always returns the same generic response, even for an unknown email", async () => {
        queueDbResults({ result: [] });

        const res = await request(app)
            .post("/api/auth/forgot-password")
            .send({ email: "unknown@example.com" });
        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/if that email is registered/i);
    });

    it("rejects an invalid email", async () => {
        const res = await request(app).post("/api/auth/forgot-password").send({ email: "not-an-email" });
        expect(res.status).toBe(400);
    });
});

describe("POST /api/auth/reset-password", () => {
    it("rejects a short password", async () => {
        const res = await request(app)
            .post("/api/auth/reset-password")
            .send({ token: "sometoken", password: "123" });
        expect(res.status).toBe(400);
    });

    it("rejects an invalid or expired token", async () => {
        queueDbResults({ result: [] });

        const res = await request(app)
            .post("/api/auth/reset-password")
            .send({ token: "a".repeat(64), password: "newpassword123" });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/invalid or has expired/i);
    });

    it("rejects a malformed token without touching the db", async () => {
        const res = await request(app)
            .post("/api/auth/reset-password")
            .send({ token: "bad-token", password: "newpassword123" });
        expect(res.status).toBe(400);
    });

    it("resets the password on a valid token, looks it up hashed, and revokes old sessions", async () => {
        queueDbResults({ result: [{ id: 1 }] }, { result: { affectedRows: 1 } });
        const rawToken = "b".repeat(64);

        const res = await request(app)
            .post("/api/auth/reset-password")
            .send({ token: rawToken, password: "newpassword123" });
        expect(res.status).toBe(200);

        const db = require("../config/db");
        const [lookupSql, lookupParams] = db.query.mock.calls[0];
        expect(lookupSql).toMatch(/reset_token = \?/);
        expect(lookupParams[0]).not.toBe(rawToken);
        expect(lookupParams[0]).toMatch(/^[a-f0-9]{64}$/);

        const updateSql = db.query.mock.calls[1][0];
        expect(updateSql).toMatch(/token_version = token_version \+ 1/);
    });
});
