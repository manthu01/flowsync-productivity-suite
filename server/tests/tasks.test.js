jest.mock("../config/db", () => ({ query: jest.fn() }));

const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../app");
const { queueDbResults, setSession, resetDb } = require("./helpers/mockDb");

const authHeader = () => {
    const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: "1d" });
    return `Bearer ${token}`;
};

beforeEach(() => {
    jest.clearAllMocks();
    resetDb();
});

describe("task routes require auth", () => {
    it("rejects requests with no token", async () => {
        const res = await request(app).get("/api/tasks");
        expect(res.status).toBe(401);
    });

    it("rejects an invalid token", async () => {
        const res = await request(app).get("/api/tasks").set("Authorization", "Bearer garbage");
        expect(res.status).toBe(401);
    });

    it("rejects a token issued before a password reset (stale token_version)", async () => {
        setSession({ token_version: 1 }); // token below carries tv 0

        const res = await request(app).get("/api/tasks").set("Authorization", authHeader());
        expect(res.status).toBe(401);
    });

    it("rejects a token for a deleted user", async () => {
        setSession(null);

        const res = await request(app).get("/api/tasks").set("Authorization", authHeader());
        expect(res.status).toBe(401);
    });

    it("rejects a token signed with a different algorithm", async () => {
        const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
        const none = `${b64({ alg: "none", typ: "JWT" })}.${b64({ id: 1, tv: 0 })}.`;

        const res = await request(app).get("/api/tasks").set("Authorization", `Bearer ${none}`);
        expect(res.status).toBe(401);
    });
});

describe("POST /api/tasks", () => {
    it("rejects a missing title", async () => {
        const res = await request(app)
            .post("/api/tasks")
            .set("Authorization", authHeader())
            .send({ description: "no title here" });
        expect(res.status).toBe(400);
    });

    it("rejects an invalid category", async () => {
        const res = await request(app)
            .post("/api/tasks")
            .set("Authorization", authHeader())
            .send({ title: "Task", category: "NotARealCategory" });
        expect(res.status).toBe(400);
    });

    it("creates a task with defaults applied", async () => {
        queueDbResults({ result: { affectedRows: 1 } });

        const res = await request(app)
            .post("/api/tasks")
            .set("Authorization", authHeader())
            .send({ title: "Write tests" });
        expect(res.status).toBe(201);
    });

    it("refuses to create past the per-user task limit", async () => {
        queueDbResults({ result: { affectedRows: 0 } }); // capped INSERT ... SELECT inserts nothing

        const res = await request(app)
            .post("/api/tasks")
            .set("Authorization", authHeader())
            .send({ title: "One too many" });
        expect(res.status).toBe(429);
    });

    it("never leaks a raw db error to the client", async () => {
        queueDbResults({ error: new Error("duplicate key value violates unique constraint") });

        const res = await request(app)
            .post("/api/tasks")
            .set("Authorization", authHeader())
            .send({ title: "Task" });
        expect(res.status).toBe(500);
        expect(JSON.stringify(res.body)).not.toMatch(/constraint/);
    });
});

describe("GET /api/tasks", () => {
    it("returns tasks with numeric subtask/collaborator counts", async () => {
        queueDbResults({
            result: [
                {
                    id: 1,
                    title: "T1",
                    subtask_count: "3",
                    subtask_completed_count: "1",
                    collaborator_count: "2",
                    is_owner: true,
                },
            ],
        });

        const res = await request(app).get("/api/tasks").set("Authorization", authHeader());
        expect(res.status).toBe(200);
        expect(res.body[0].subtask_count).toBe(3);
        expect(res.body[0].subtask_completed_count).toBe(1);
        expect(res.body[0].collaborator_count).toBe(2);
    });
});

describe("PUT /api/tasks/:id", () => {
    it("updates a task the caller owns or collaborates on", async () => {
        queueDbResults(
            { result: [{ status: "In Progress" }] }, // existing status
            { result: { affectedRows: 1 } }, // UPDATE
            { result: [{ user_id: 1 }, { user_id: 2 }] } // watchers
        );

        const res = await request(app)
            .put("/api/tasks/1")
            .set("Authorization", authHeader())
            .send({ title: "Updated title", status: "Completed" });
        expect(res.status).toBe(200);
    });

    it("spawns the next occurrence when a repeating task is completed", async () => {
        queueDbResults(
            { result: [{ status: "In Progress" }] }, // existing status
            { result: { affectedRows: 1 } }, // UPDATE
            { result: { affectedRows: 1, insertId: 7 } }, // INSERT next occurrence
            { result: { affectedRows: 2 } }, // copy subtasks
            { result: { affectedRows: 1 } }, // copy collaborators
            { result: { affectedRows: 1 } }, // clear recurrence on the completed task
            { result: [{ user_id: 1 }] } // watchers
        );

        const res = await request(app)
            .put("/api/tasks/1")
            .set("Authorization", authHeader())
            .send({ title: "Standup notes", status: "Completed", recurrence: "Weekly" });
        expect(res.status).toBe(200);

        const db = require("../config/db");
        const insertCall = db.query.mock.calls.find(([sql]) => /INSERT INTO tasks/.test(sql));
        expect(insertCall).toBeDefined();
        expect(insertCall[1]).toEqual(["1"]);
    });

    it("doesn't spawn a copy when re-saving an already completed repeating task", async () => {
        queueDbResults(
            { result: [{ status: "Completed" }] }, // existing status
            { result: { affectedRows: 1 } }, // UPDATE
            { result: [{ user_id: 1 }] } // watchers
        );

        const res = await request(app)
            .put("/api/tasks/1")
            .set("Authorization", authHeader())
            .send({ title: "Standup notes", status: "Completed", recurrence: "Weekly" });
        expect(res.status).toBe(200);
    });

    it("rejects an invalid mood or recurrence", async () => {
        const badMood = await request(app)
            .post("/api/tasks")
            .set("Authorization", authHeader())
            .send({ title: "Task", mood: "Sleepy" });
        expect(badMood.status).toBe(400);

        const badRepeat = await request(app)
            .post("/api/tasks")
            .set("Authorization", authHeader())
            .send({ title: "Task", recurrence: "Hourly" });
        expect(badRepeat.status).toBe(400);
    });

    it("returns 404 when the caller has no access to the task", async () => {
        queueDbResults({ result: [] });

        const res = await request(app)
            .put("/api/tasks/999")
            .set("Authorization", authHeader())
            .send({ title: "Nope" });
        expect(res.status).toBe(404);
    });
});

describe("id params", () => {
    it("returns 404 for a non-numeric task id without touching the db", async () => {
        const res = await request(app)
            .put("/api/tasks/1%20OR%201=1")
            .set("Authorization", authHeader())
            .send({ title: "x" });
        expect(res.status).toBe(404);
    });
});

describe("subtasks", () => {
    it("rejects a subtask with no title", async () => {
        const res = await request(app)
            .post("/api/tasks/1/subtasks")
            .set("Authorization", authHeader())
            .send({ title: "   " });
        expect(res.status).toBe(400);
    });

    it("rejects a non-boolean is_completed", async () => {
        const res = await request(app)
            .put("/api/tasks/1/subtasks/2")
            .set("Authorization", authHeader())
            .send({ is_completed: "yes" });
        expect(res.status).toBe(400);
    });

    it("refuses to add past the per-task subtask limit", async () => {
        queueDbResults(
            { result: [{ 1: 1 }] }, // hasTaskAccess
            { result: [{ nextPosition: 100, count: "100" }] } // position + count
        );

        const res = await request(app)
            .post("/api/tasks/1/subtasks")
            .set("Authorization", authHeader())
            .send({ title: "Step 101" });
        expect(res.status).toBe(429);
    });
});

describe("DELETE /api/tasks/:id", () => {
    it("deletes a task the caller owns", async () => {
        queueDbResults(
            { result: [{ user_id: 1 }] }, // watchers, fetched before delete
            { result: { affectedRows: 1 } } // DELETE
        );

        const res = await request(app).delete("/api/tasks/1").set("Authorization", authHeader());
        expect(res.status).toBe(200);
    });

    it("returns 404 when the caller doesn't own the task", async () => {
        queueDbResults({ result: [] }, { result: { affectedRows: 0 } });

        const res = await request(app).delete("/api/tasks/999").set("Authorization", authHeader());
        expect(res.status).toBe(404);
    });
});

describe("POST /api/tasks/:id/share", () => {
    it("rejects a missing username", async () => {
        const res = await request(app)
            .post("/api/tasks/1/share")
            .set("Authorization", authHeader())
            .send({});
        expect(res.status).toBe(400);
    });

    it("returns 404 when the caller doesn't own the task", async () => {
        queueDbResults({ result: [] }); // ownership check fails

        const res = await request(app)
            .post("/api/tasks/1/share")
            .set("Authorization", authHeader())
            .send({ username: "friend1" });
        expect(res.status).toBe(404);
    });

    it("rejects sharing with someone who isn't a friend", async () => {
        queueDbResults(
            { result: [{ id: 1 }] }, // ownership check
            { result: [{ id: 2, username: "notafriend" }] }, // target lookup
            { result: [] } // verifyIsFriend query returns no accepted friendship
        );

        const res = await request(app)
            .post("/api/tasks/1/share")
            .set("Authorization", authHeader())
            .send({ username: "notafriend" });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/friends/i);
    });

    it("shares a task with an accepted friend", async () => {
        queueDbResults(
            { result: [{ id: 1 }] }, // ownership check
            { result: [{ id: 2, username: "friend1" }] }, // target lookup
            { result: [{ id: 5 }] }, // verifyIsFriend query returns a row
            { result: { affectedRows: 1 } }, // INSERT task_collaborators
            { result: [{ user_id: 1 }, { user_id: 2 }] } // watchers
        );

        const res = await request(app)
            .post("/api/tasks/1/share")
            .set("Authorization", authHeader())
            .send({ username: "friend1" });
        expect(res.status).toBe(200);
    });
});

describe("DELETE /api/tasks/:id/share/:userId", () => {
    it("removes a collaborator's access", async () => {
        queueDbResults(
            { result: [{ id: 1 }] }, // ownership check
            { result: [{ user_id: 1 }, { user_id: 2 }] }, // watchers before delete
            { result: { affectedRows: 1 } } // DELETE task_collaborators
        );

        const res = await request(app)
            .delete("/api/tasks/1/share/2")
            .set("Authorization", authHeader());
        expect(res.status).toBe(200);
    });
});
