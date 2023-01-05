require("dotenv").config()
const jwt = require("jsonwebtoken")
const getadminaccesstoken = (email, root) => {
    return new Promise((resolve, reject) => {
        const token = jwt.sign({
            email, root
        }, process.env.secreate_jwt)
        resolve(
            token
        )
    })
}
module.exports = getadminaccesstoken