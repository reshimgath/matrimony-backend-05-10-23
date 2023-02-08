require("dotenv").config()
const jwt = require("jsonwebtoken")
const getAccesstoken = (firstname, email, mobile) => {
    return new Promise((resolve, reject) => {
        const token = jwt.sign({
            firstname, email, mobile
        }, process.env.secreate_jwt)
        resolve(
            token
        )
    })
}

module.exports = getAccesstoken