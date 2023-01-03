require("dotenv").config()
const jwt = require("jsonwebtoken")
const getDatatoken = (firstname, email, mobile, gender, verified, profile_completed) => {
    return new Promise((resolve, reject) => {
        const token = jwt.sign({
            firstname, email, mobile, gender, verified, profile_completed
        }, process.env.secreate_jwt)
        resolve(
            token
        )
    })
}

module.exports = getDatatoken