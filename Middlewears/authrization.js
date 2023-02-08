const jwt = require("jsonwebtoken")
require('dotenv').config()
const Authorizaton = (req, res, next) => {
    const token = req.headers['authorization'];
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.secreate_jwt)

            req.email = decoded.email
            req.firstname = decoded.firstname
            next()
        }
        catch {
            res.status(401).send("Invalid Credentials")
        }
    }
    else {
        res.status(401).send('Invalid Credentials no token found')
    }

}
module.exports = Authorizaton