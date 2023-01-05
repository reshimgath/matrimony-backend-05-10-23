const mongoose = require("mongoose")
const deletedProfiles = mongoose.Schema({
    mobile: {
        type: Number,
        require: true
    },
    email: {
        type: String,
        require: true
    },
    gender: {
        type: String,
        require: true
    },
    reson: {
        type: String,
        require: true
    },
})
module.exports = mongoose.model("deletedprofiles", deletedProfiles)