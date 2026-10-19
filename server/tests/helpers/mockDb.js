// Queues fake responses for the mocked db.query (from jest.mock("../../config/db"))
// in call order, regardless of the SQL text — keeps tests focused on controller
// behavior (status codes, response shape) rather than brittle to query wording.
//
// The one exception is requireAuth's per-request session lookup: it runs before
// every protected route, so it's answered from `setSession` instead of the queue.
// Tests then only queue the queries the route itself makes.
const db = require("../../config/db");

const DEFAULT_SESSION = { id: 1, token_version: 0, is_admin: false };
let session = DEFAULT_SESSION;

// Pass overrides (e.g. { is_admin: true }) or null to simulate a deleted user.
const setSession = (overrides = {}) => {
    session = overrides === null ? null : { ...DEFAULT_SESSION, ...overrides };
};

const isSessionLookup = (sql) => /SELECT id, token_version, is_admin FROM users WHERE id = \?/.test(sql);

const queueDbResults = (...results) => {
    const queue = [...results];

    db.query.mockImplementation((sql, paramsOrCallback, maybeCallback) => {
        const callback = typeof paramsOrCallback === "function" ? paramsOrCallback : maybeCallback;

        if (isSessionLookup(sql)) {
            return callback(null, session ? [session] : []);
        }

        const next = queue.shift();

        if (!next) {
            throw new Error(`mockDb: no queued result for query: ${sql}`);
        }

        if (next.error) {
            callback(next.error);
        } else {
            callback(null, next.result);
        }
    });
};

// Fresh, empty queue + default (non-admin) session; call from beforeEach.
const resetDb = () => {
    setSession();
    queueDbResults();
};

module.exports = { queueDbResults, setSession, resetDb };
