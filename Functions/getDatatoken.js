require("dotenv").config()
const jwt = require("jsonwebtoken")
// console.log(process.env.secreate_jwt)
const getDatatoken = (firstname, email, mobile, gender, verified, profile_completed, coins) => {
    return new Promise((resolve, reject) => {
        const token = jwt.sign({
            firstname, email, mobile, gender, verified, profile_completed, coins
        }, process.env.secreate_jwt)
        // console.log(token)
        resolve(
            token
        )
    })
}

module.exports = getDatatoken