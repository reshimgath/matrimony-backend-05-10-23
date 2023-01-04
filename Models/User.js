const mongoose = require("mongoose")
let usermodel = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        require: [true, "why no email"],

    },
    mobile: {
        type: Number,
        unique: true,
        require: [true, "why no number"]
    },
    secure_password: {
        type: String,
        require: [true, "why no password"]
    },
    firstname: {
        type: String,
        require: [true, "why no fname"]
    },
    lastname: {
        type: String,
        require: [true, "why no lname"]
    },
    gender: {
        type: String,
        require: [true, "why no gender"]
    },
    verified: {
        type: Boolean,
        default: false
    },
    profile_completed: {
        type: Number,
        default: 0
    },
    coins: {
        type: Number,
        default: 0
    },
    rechargeDate: {
        type: Date,
        default: 0
    },
    rechargExpireDate: {
        type: Date,
        default: 0
    }
})
module.exports = mongoose.model("user", usermodel)