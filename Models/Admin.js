const mongoose = require("mongoose")
const adminScheama = new mongoose.Schema({
    root: {
        type: Boolean,
        default: false
    },
    email: {
        type: String,
        unique: true,
        require: [true, "email required"],

    },
    password: {
        type: String
    }

})
module.exports = mongoose.model("admin", adminScheama)