const { json } = require("body-parser")
const jwt = require("jsonwebtoken")

module.exports = function (req, res, next) {
    const token = req.header("auth-token")
    if (!token) {
        res.json({
            status: 401,
            message: "Access denied !"
        })
    }
    try {
        const verified = jwt.verify(token, process.env.TOKEN_SECRET)
        req.user = verified;
        next()
    } catch (err) {
        res.json({
            status: 400,
            error: "Invalid Token",
            message: "invalid Token"
        })
    }
}
