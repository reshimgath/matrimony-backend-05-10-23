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
        type: String
    },
    weight: {
        type: String
    },
    bloodGroup: {
        type: String
    },
    education: {
        type: String
    },
    occupation: {
        type: String
    },
    salaryPA: {
        type: String
    },
    dob: {
        type: String
    },
    birth_time: {
        type: String
    },
    birth_place: {
        type: String
    },
    caste: {
        type: String
    },
    subCaste: {
        type: String
    },
    complexion: {
        type: String
    },
    disablity: {
        type: String
    },
    maritalStatus: {
        type: String
    },
    childrens_count: {
        type: String
    },
    addressLine2: {
        type: String
    },
    country_name: {
        type: String
    },
    state_name: {
        type: String
    },
    city_name: {
        type: String
    },
    taluka: {
        type: String
    },
    district: {
        type: String
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
    }
    

})
module.exports = mongoose.model("user", usermodel)