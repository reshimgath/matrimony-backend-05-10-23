const mongoose = require("mongoose")
const rechargesScheama = new mongoose.Schema({
    email: {
        type: String,
        require: true
    },
    rechargeId: {
        type: String,
        require: true
    },
    plan: {
        type: String,
        require: true
    },
    rechargeDate: {
        type: Date,
        require: true,
        default: 0
    },
    expireDate: {
        type: Date,
        require: true,
        default: 0
    }
})
module.exports = mongoose.model("recharge", rechargesScheama)