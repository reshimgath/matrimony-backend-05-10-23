// Schema for OTP
const mongoose = require("mongoose")
let DeleteotpScheama = new mongoose.Schema({
    email: {
        type: String,
    },
    otp: {
        type: String,
    },
    createdAt: {
        type: Date,
    },
    expireAt: {
        type: Date
    }
})

module.exports = mongoose.model("deleteotp", DeleteotpScheama)