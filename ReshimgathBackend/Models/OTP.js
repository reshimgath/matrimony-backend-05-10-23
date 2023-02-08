// Schema for OTP
const mongoose = require("mongoose")
let otpScheama = new mongoose.Schema({
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

module.exports = mongoose.model("otp", otpScheama)