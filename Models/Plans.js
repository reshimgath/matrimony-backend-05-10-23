const mongoose = require("mongoose")
const planScheama = new mongoose.Schema({
    price: {
        type: String,
        require: true
    },
    expiresinMonths: {
        type: Number,
        require: true
    },
    mediator: {
        type: Boolean,
        require: true
    },
    services: {
        type: Array,
    },
    contact_count: {
        type: Number
    }

})

module.exports = mongoose.model("plans", planScheama)