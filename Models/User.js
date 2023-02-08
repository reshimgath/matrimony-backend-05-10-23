const mongoose = require("mongoose")
let usermodel = new mongoose.Schema({
    //basic registraion details
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
    },
    //*************basic info start***********
    height: {
        type: String,
        default: ""
    },
    weight: {
        type: String,
        default: ""
    },
    bloodGroup: {
        type: String,
        default: ""
    },
    education: {
        type: String,
        default: ""
    },
    occupation: {
        type: String,
        default: ""
    },
    salaryPA: {
        type: String,
        default: ""
    },
    dob: {
        type: String,
        default: ""
    },
    birth_time: {
        type: String,
        default: ""
    },
    birth_place: {
        type: String,
        default: ""
    },
    caste: {
        type: String,
        default: ""
    },
    subCaste: {
        type: String,
        default: ""
    },
    complexion: {
        type: String,
        default: ""
    },
    disablity: {
        type: String,
        default: ""
    },
    maritalStatus: {
        type: String,
        default: ""
    },
    childrens_count: {
        type: String,
        default: ""
    },
    addressLine2: {
        type: String,
        default: ""
    },
    country_name: {
        type: String,
        default: ""
    },
    state_name: {
        type: String,
        default: ""
    },
    city_name: {
        type: String,
        default: ""
    },
    taluka: {
        type: String,
        default: ""
    },
    district: {
        type: String,
        default: ""
    },
    //****get family details***
    fathers_name: {
        type: String
    },
    fathers_occupation: {
        type: String
    },
    mothers_name: {
        type: String
    },
    mothers_occupation: {
        type: String
    },
    bother_select: {
        type: String
    },
    bother_status: {
        type: String
    },
    sister_select: {
        type: String
    },
    sister_status: {
        type: String
    },
    vehicle: {
        type: String
    }
    ,
    //Horoscope details
    rashi: {
        type: String

    }
    , nakshatra: {
        type: String
    }
    , mangal: {
        type: Boolean
    }
    , charan: {
        type: String
    }
    , time_of_birth: {
        type: String
    },
    place_of_birth: {
        type: String
    }
    , nadi: {
        type: String
    },
    devak: {
        type: String
    },
    gan: {
        type: String
    },
    //partner prefrence
    education_pref:{
        type:String
    },
    occupation_pref:{
        type:String
    },
    salary_pref:{
        type:String
    },
    complexion_pref:{
        type:String
    },
    height_pref:{
        type:String
    },
    religion_pref:{
        type:String
    },
    caste_pref:{
        type:String
    },
    state_pref:{
        type:String
    },
    location_pref:{
        type:String
    },
})

module.exports = mongoose.model("user", usermodel)