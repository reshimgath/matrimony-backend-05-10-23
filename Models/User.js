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
    mother_tongue: {
        type: String
    },
    addressLine1: {
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
    image1: {
        type: String,
        default: ""
    },
    image2: {
        type: String,
        default: ""
    },
    image3: {
        type: String,
        default: ""
    },

    //****get family details***
    fathers_name: {
        type: String,
        default: ""
    },
    fathers_occupation: {
        type: String,
        default: ""
    },
    mothers_name: {
        type: String,
        default: ""
    },
    mothers_occupation: {
        type: String,
        default: ""
    },
    bother_select: {
        type: String,
        default: ""
    },
    bother_status: {
        type: String,
        default: ""
    },
    sister_select: {
        type: String,
        default: ""
    },
    sister_status: {
        type: String,
        default: ""
    },
    own_house: {
        type: String,
        default: ""
    },
    own_farm: {
        type: String,
        default: ""
    },
    own_plot: {
        type: String,
        default: ""
    },
    other_prop: {
        type: String,
        default: ""
    },
    //Horoscope details
    rashi: {
        type: String,
        default: ""

    }
    , nakshatra: {
        type: String,
        default: ""
    }
    , mangal: {
        type: Boolean,
        default: false
    }
    , charan: {
        type: String,
        default: ""
    }
    , time_of_birth: {
        type: String,
        default: ""
    },
    place_of_birth: {
        type: String,
        default: ""
    }
    , nadi: {
        type: String,
        default: ""
    },
    devak: {
        type: String,
        default: ""
    },
    gan: {
        type: String,
        default: ""
    },

    //partner prefrence
    education_pref: {
        type: String,
        default: ""
    },
    occupation_pref: {
        type: String,
        default: ""
    },
    salary_pref: {
        type: String,
        default: ""
    },
    complexion_pref: {
        type: String,
        default: ""
    },
    height_pref: {
        type: String,
        default: ""
    },
    religion_pref: {
        type: String,
        default: ""
    },
    caste_pref: {
        type: String,
        default: ""
    },
    state_pref: {
        type: String,
        default: ""
    },
    location_pref: {
        type: String,
        default: ""
    },
})

module.exports = mongoose.model("user", usermodel)