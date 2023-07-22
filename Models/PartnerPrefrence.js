// Schema for OTP
const mongoose = require("mongoose")
let Partnerpref = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    education_pref: [],
    occupation_pref: [],
    salary_pref: [],
    complexion_pref: [],
    height_pref: [],
    religion_pref: [],
    caste_pref: [],
    state_pref: [],
    location_pref: []
})

module.exports = mongoose.model("partner_pref", Partnerpref)