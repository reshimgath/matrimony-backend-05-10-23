const mongoose = require("mongoose")
const adminScheama = new mongoose.Schema({
    root: {
        type: Boolean,
        default: false
    },
    canrecharge: {
        type: Boolean,
        default: false
    },
    email: {
        type: String,
        unique: true,
        require: [true, "email required"],

    },
    password: {
        type: String,
        require: true
    }

})
module.exports = mongoose.model("admin", adminScheama)