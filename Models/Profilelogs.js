// Schema to get details from user form
const data = new Date()
const mongoose = require("mongoose")
let profileLogs = new mongoose.Schema({
    createdProfile: String,
    createdBy: String,
    createdAt: { type: String, default: data.toLocaleDateString() },
    createdTime: { type: String, default: data.getHours() + ":" + data.getMinutes() + ":" + data.getSeconds() }
})

module.exports = mongoose.model("profileLogs", profileLogs)