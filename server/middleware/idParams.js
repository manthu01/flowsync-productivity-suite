// router.param handler for numeric ids: anything that isn't a plain positive integer
// can't match a row, so answer 404 up front instead of letting Postgres reject the
// cast and turn it into a 500.
const numericIdParam = (req, res, next, value) => {
    if (!/^[1-9][0-9]{0,9}$/.test(value)) {
        return res.status(404).json({ message: "Not found" });
    }
    next();
};

module.exports = { numericIdParam };
