const mongoose = require("mongoose");
const queriesDetails = new mongoose.Schema({
    name: String,
    email: String,
    mobile: String,
    message: String
})

module.exports = mongoose.model("queries", queriesDetails)