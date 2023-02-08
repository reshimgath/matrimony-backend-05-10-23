const jwt = require("jsonwebtoken")
require('dotenv').config()
const rootadminAuthorizaton = (req, res, next) => {
    const token = req.headers['authorization'];
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.secreate_jwt)
            if (decoded.root) {
                next()
            }
            else {
                res.status(401).send("sorry you cannot access this route")
            }
        }
        catch {
            res.status(401).send("Invalid Credentials")
        }
    }
    else {
        res.status(401).send('Invalid Credentials no token found')
    }
}
module.exports = rootadminAuthorizaton