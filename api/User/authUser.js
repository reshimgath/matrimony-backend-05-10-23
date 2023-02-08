const express = require("express")
const router = express.Router();
const otpGenerator = require('otp-generator')
require('dotenv').config();
const jwt = require('jsonwebtoken')
const bcrypt = require("bcryptjs");
const generator = require('generate-password');
//Scheama models
const UserModel = require("../../Models/User");
const OTP = require("../../Models/OTP");
const DeleteOtpModel = require("../../Models/DeleteOtp")
const Deleted = require("../../Models/Deleted");

//functions that sends emails to user
const mailSender = require("../../Functions/mailsender");
const deleteConfirm = require("../../Functions/deleteConfirm");
const rechargeConfirm = require("../../Functions/rechargeConfirm");
const forgotpassword = require("../../Functions/forgotpassword")

//functions that create jwt tokens
const getDatatoken = require("../../Functions/getDatatoken");
const getAccesstoken = require("../../Functions/getaccessToken");

//middlewears 
const Authorizaton = require("../../Middlewears/authrization");
const User = require("../../Models/User");

//route to register a user
router.post('/register', async (req, res) => {
    const { firstname, email, mobile, password, lastname, gender } = req.body

    //generate secure hashed password
    const salt = await bcrypt.genSalt(10)
    const secpass = await bcrypt.hash(password, salt)

    //otp generator
    const otp = otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });

    //create user instance
    UserModel.create({ firstname, email, mobile, secure_password: secpass, lastname, gender }).then((val1) => {
        //create otp instance
        const Myotp = new OTP({ firstname, email, otp, createdAt: Date.now(), expireAt: Date.now() + 180000 })
        //save and send otp
        Myotp.save().then(() => {
            //send mail
            mailSender(email, otp, firstname).then(async () => {
                res.status(200).send({ accesstoken: await getAccesstoken(val1.firstname, val1.email, val1.mobile), datatoken: await getDatatoken(val1.firstname, val1.email, val1.mobile, val1.gender, val1.verified, val1.profile_completed, val1.coins), message: "otp sent succesfulyy" })
            }).catch((err) => {
                console.log(err)
                res.send({ status: 400, message: "error while sendng the mail.." })

            });

        }).catch(() => {
            res.status(400).send("sorry error in otp creation..")
        })
    }).catch(() => {
        res.status(400).send("sorry useralready exist..")
    })

})

//router login a user
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    // console.log(req.body)
    //find the user with email in database
    UserModel.findOne({ email }).then((val1) => {
        if (val1) {
            //compare the hashed passwrod and input password
            bcrypt.compare(password, val1.secure_password).then(async (correct) => {
                if (correct) {
                    res.status(200).send({ accesstoken: await getAccesstoken(val1.firstname, val1.email, val1.mobile), datatoken: await getDatatoken(val1.firstname, val1.email, val1.mobile, val1.gender, val1.verified, val1.profile_completed, val1.coins) })
                }

                else {
                    res.status(401).send("Incorrect password")
                }
            })
        }
        else {
            res.status(401).send("Sorry user not found with given email id")
        }
    }).catch(() => {
        res.status(400).send("sorry errro in mongodb")
    })

})

//sendDeletePreviewMale to user
router.post("/senddeletepreviewemale", (req, res) => {
    const { email, firstname } = req.body
    //otp generator
    const otp = otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
    //create DeleteOtp 
    const Deleteotp = new DeleteOtpModel({
        otp,
        email, createdAt: Date.now(), expireAt: Date.now() + 180000
    })

    Deleteotp.save().then(() => {
        //send verifivation mail ro user
        deleteConfirm(email, otp, firstname).then(() => {
            res.status(200).send("email sent succesfully..")
        }).catch((err) => {
            res.status(400).send("sorry error while sending the mail..")
        })
        // res.status(200).send("ok")
    }).catch(() => {
        res.status(400).send("sorry errror in mongodb..")
    })

})

//delete user for normal user
router.post('/deleteprofile', async (req, res) => {
    const { id, email, gender, mobile, reason, otp } = req.body
    try {
        const otpdata = await DeleteOtpModel.findOne({ email })
        if (otpdata) {
            //cheack otp expired or not
            if (otpdata.expireAt > Date.now()) {
                if (otpdata.otp === otp) {
                    const deleted = new Deleted({
                        mobile, email, gender, reason
                    })
                    //save the deleted informataion
                    deleted.save().then(() => {
                        //delete the info from database
                        UserModel.findByIdAndDelete(id).then(() => {
                            res.status(200).send("deleted succesfully..")
                        }).catch(() => {
                            res.status(400).send("sorrry errror while deleting profile")
                        })
                    }).catch(() => {
                        res.status(400).send("sorrry errro in mongodb ")
                    })
                }
                else {
                    res.status(400).send("please fill correct otp")
                }

            }
            else {
                res.status(400).send("sorrry errror in mongodb..")
            }
        }
        else {
            res.status(400).send("sorrry bad request")
        }
    }
    catch (e) {
        res.status(400), send("sorry some errro occured please try again later..")
    }


})

//update profile for normal user
router.post('/updateprofile', (req, res) => {
    res.status(200).send("profile updated succesfulyy....")
})

//*********verify the otp sent to mobile********
router.post('/verifyotp', Authorizaton, (req, res) => {
    const { otp } = req.body
    // console.log(otp)
    //find if otp exist in gien database*********
    OTP.findOne({ email: req.email }).then((val) => {
        if (val != null) {
            if (val.expireAt < Date.now()) {
                //deltete the otp from database of expired
                OTP.findByIdAndDelete(val._id, (err, docs) => {
                    if (docs) {
                        res.status(400).send("sorry otp expired")
                    }
                })
            }
            else {
                //cheack otp correct or not
                if (val.otp == otp) {
                    //update the vrified filed in user collection
                    UserModel.findOneAndUpdate({ email: req.email }, {
                        $set: {
                            verified: true,
                            profile_completed: 20
                        },
                    }, { new: true }).then(async (val1) => {
                        res.status(200).send({ datatoken: await getDatatoken(val1.firstname, val1.email, val1.mobile, val1.gender, val1.verified, val1.profile_completed, val1.coins) })
                    }).catch(() => {
                        res.status(400).send("errror in mongodb")
                    })
                }
                //if not correct then send error
                else {
                    res.status(400).send("invalid otp")
                }
            }
        }
        else {
            //send if otp not exist with given credintials 
            res.status(400).send("sorry otp not exist in database")
        }
    }).catch((err) => {
        //error in mongodb
        res.status(400).send("errror in mongodb")
    })

})

//resend otp route
router.post("/resendotp", Authorizaton, (req, res) => {
    //const { email, firstname } = req.body
    OTP.findOne({ email: req.email }).then((val) => {
        if (val != null) {

            if (val.expireAt < Date.now()) {

                //deltete the otp from database if expired
                OTP.findByIdAndDelete(val._id, (err, docs) => {
                    if (docs) {
                        //create otp
                        const otp = otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });

                        //create otp instance
                        const Myotp = new OTP({ email: req.email, otp, createdAt: Date.now(), expireAt: Date.now() + 180000 })

                        //create and save otp
                        Myotp.save().then(() => {
                            //send otp to user
                            mailSender(req.email, otp, req.firstname).then(() => {
                                res.status(200).send("mail send succesfully....")
                            }).catch(() => {
                                res.send({ status: 400, message: "erorr while sending email" })
                            });
                        }).catch(() => {
                            res.status(400).send("sorry error in otp creation in databse..")
                        })
                    }
                    else {
                        res.status(400).send("sorry error in mongodb")
                    }
                })
            }
            else {
                res.status(400).send("already send a otp which is not expired")
            }
        }
        else {
            //if the otp for given user not exist in database
            //generate otp
            const otp = otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });

            //otp instance
            const Myotp = new OTP({ email: req.email, otp, createdAt: Date.now(), expireAt: Date.now() + 180000 })

            //save and send otp throught mail
            Myotp.save().then(() => {
                mailSender(req.email, otp, req.firstname).then(() => {
                    res.status(200).send("otp send succesfullyy...")
                }).catch(() => {
                    res.send({ status: 400, message: "error ocured while sending mail.." })
                });
            }).catch(() => {
                res.status(400).send("sorry error in otp creation in mongodb..")
            })
        }
    }).catch((err) => {
        res.status(400).send("sorry errror in mongodb")
    })

})

//forgot password route for user
router.post('/forgotpassword', async (req, res) => {
    const { email } = req.body;
    const password = generator.generate({
        length: 10,
        numbers: true
    });

    //generate secure hashed password
    const salt = await bcrypt.genSalt(10);
    const secpass = await bcrypt.hash(password, salt);
    UserModel.findByIdAndUpdate({ email }, {
        $set: {
            secure_password: secpass
        }
    }).then(() => {
        forgotpassword(email).then("new password sent succesfully....").catch((err) => {
            res.status(400).send("sorry error while sending mail....")
        })
    }).catch(() => {
        res.status(400).send("internal server error......")
    })

})

//api to reset password 
router.post('/resetpassword', Authorizaton, async (req, res) => {
    const { password } = req.body;
    //generate secure hashed password
    const salt = await bcrypt.genSalt(10);
    const secpass = await bcrypt.hash(password, salt);
    UserModel.findOneAndUpdate({ email: req.email }, {
        $set: {
            secure_password: secpass
        }
    }).then(() => {
        res.status(200).send("password updated succesfully.....")
    }).catch(() => {
        res.status(400).send("password not updated try again later...")
    })
})

router.get('/samplecheack', Authorizaton, (req, res) => {
    res.status(200).send(req.user)
})

//get all details of user except sirname,email,mobile
router.post('/getalluserdetails', Authorizaton, (req, res) => {
    const { id } = req.body;
    //get user profile details
    UserModel.findById(id).then((val) => {
        res.status(200).send(val)
    }).catch(() => {
        res.status(400).send("sorry errror in mongodb...")
    })
})


//access the user profile contact details
//1:full name
//2:adress 
//3.phone number
//4.email adress
router.post("/getusercontactdetails", async (req, res) => {
    const { profileid, email } = req.body;
    try {
        //find user who requesting for profile
        const data = await UserModel.findOne({ email })
        if (data) {
            //cheack wheather recharge expired or not
            if (data.rechargExpireDate > Date.now()) {
                if (data.coins < 0) {
                    res.status(200).send("sorrry you don't have enough coins ")
                }
                else {
                    try {
                        //get the actual profile which need to share back to user
                        const profiledata = await UserModel.findOne({ _id: profileid }, { email: 1, mobile: 1, lastname: 1 })
                        if (profiledata) {

                            //decrease coins by 5
                            UserModel.updateOne({ email }, {
                                $set: {
                                    coins: data.coins - 5
                                }
                            }).then(() => {
                                res.status(200).send(profiledata)
                            })
                        }
                        else {
                            res.status(400).send("sorry profile not found....")
                        }
                    }
                    catch (e) {
                        res.status(400).send("errro in mongodb")
                    }
                }
            }
            else {
                res.status(400).send("sorrry your recharge expired please contact owner")
            }
        }
    }
    catch (e) {
        res.status(400).send("errro in mongodb")
    }
})

//api for normal search
router.post("/normalsearch", async (req, res) => {
    // lookingFor
    // fromAge
    // toAge
    // maritalStatus
    // Religion
    //{ $or: [{ email: email }, { firstname: name }] }
    const { lookingFor, fromAge, toAge, maritalStatus, Religion } = req.body
    try {
        //{ Religion, maritalStatus, gender: lookingFor, age: { $gt: fromAge, $lt: toAge } }
        const result = await UserModel.find()
        res.status(200).send(result)
    }
    catch (e) {
        res.status(400).send('sorry errror found..')
    }
})

//**************getting remaing details from user***********
//1.gettting basic info
router.post('/getbasicinfouser', Authorizaton, (req, res) => {

    const {
        height,
        weight,
        bloodGroup,
        education,
        occupation,
        salaryPA,
        dob,
        birth_time,
        birth_place,
        caste,
        subCaste,
        complexion,
        disablity,
        maritalStatus,
        childrens_count,
        addressLine2,
        country_name,
        state_name,
        city_name,
        taluka,
        district } = req.body;

    //update only necossory fields in database    
    User.findByIdAndUpdate({ email: req.email }, {
        $set: {
            profile_completed: 50,
            height,
            weight,
            bloodGroup,
            education,
            occupation,
            salaryPA,
            dob,
            birth_time,
            birth_place,
            caste,
            subCaste,
            complexion,
            disablity,
            maritalStatus,
            childrens_count,
            addressLine2,
            country_name,
            state_name,
            city_name,
            taluka,
            district
        }
    }, { new: true }).then(async (val1) => {
        res.status(200).send({ datatoken: await getDatatoken(val1.firstname, val1.email, val1.mobile, val1.gender, val1.verified, val1.profile_completed, val1.coins) })
    }).catch((err) => {
        res.status(400).send("sorry some error occured")

    })
})

//2.Family details 
router.post("/getfamilydetails", Authorizaton, (req, res) => {
    const {
        fathers_name,
        fathers_occupation,
        mothers_name,
        mothers_occupation,
        bother_select,
        bother_status,
        sister_select,
        sister_status,
        vehicle } = req.body;

    //update only necossory fields in database    
    User.findByIdAndUpdate({ email: req.email }, {
        $set: {
            profile_completed: 70,
            fathers_name,
            fathers_occupation,
            mothers_name,
            mothers_occupation,
            bother_select,
            bother_status,
            sister_select,
            sister_status,
            vehicle
        }
    }, { new: true }).then(async (val1) => {
        res.status(200).send({ datatoken: await getDatatoken(val1.firstname, val1.email, val1.mobile, val1.gender, val1.verified, val1.profile_completed, val1.coins) })
    }).catch((err) => {
        res.status(400).send("sorry some error occured")
    })

});

//3.partner prefrence
router.post('/getpartnerprefrence', Authorizaton, (req, res) => {
    const {
        education_pref,
        occupation_pref,
        salary_pref,
        complexion_pref,
        height_pref,
        religion_pref,
        caste_pref,
        state_pref,
        location_pref } = req.body
    User.findByIdAndUpdate({ email: req.email }, {
        $set: {
            education_pref,
            occupation_pref,
            salary_pref,
            complexion_pref,
            height_pref,
            religion_pref,
            caste_pref,
            state_pref,
            location_pref,
            profile_completed: 70,
        }
    }, { new: true }).then(async (val1) => {
        res.status(200).send({ datatoken: await getDatatoken(val1.firstname, val1.email, val1.mobile, val1.gender, val1.verified, val1.profile_completed, val1.coins) })
    }).catch((err) => {
        res.status(400).send("sorry some error occured")
    })


})

//4.Horoscope details
router.post('/gethoroscopedetails', Authorizaton, (req, res) => {
    const { rashi, nakshatra, mangal, charan, time_of_birth, place_of_birth, nadi, devak, gan } = req.body
    User.findByIdAndUpdate({ email: req.email }, {
        $set: {
            rashi, nakshatra, mangal, charan, time_of_birth, place_of_birth, nadi, devak, gan
        }
    }, { new: true }).then(async (val1) => {
        res.status(200).send({ datatoken: await getDatatoken(val1.firstname, val1.email, val1.mobile, val1.gender, val1.verified, val1.profile_completed, val1.coins) })
    }).catch((err) => {
        res.status(400).send("sorry some error occured")
    })
})
//**************getting remaing details from user completed***********

module.exports = router

