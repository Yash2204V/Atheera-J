const loggedIn = (req, res, next) => {
    res.locals.token = req.cookies.token ? true : false;
    next();
}

module.exports = loggedIn;