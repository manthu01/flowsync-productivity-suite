// Queues fake responses for the mocked db.query (from jest.mock("../../config/db"))
// in call order, regardless of the SQL text — keeps tests focused on controller
// behavior (status codes, response shape) rather than brittle to query wording.
const db = require("../../config/db");

const queueDbResults = (...results) => {
    const queue = [...results];

    db.query.mockImplementation((sql, paramsOrCallback, maybeCallback) => {
        const callback = typeof paramsOrCallback === "function" ? paramsOrCallback : maybeCallback;
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

module.exports = { queueDbResults };
