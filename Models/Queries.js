// Schema to get details from user form
const mongoose = require("mongoose")
let formSheama = new mongoose.Schema({
    name: String,
    email: String,
    message: String,
    contact: String,
    createdAt: Object
})

module.exports = mongoose.model("queries", formSheama)