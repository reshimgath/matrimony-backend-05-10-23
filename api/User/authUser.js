// @ts-nocheck 
const express = require("express")
const router = express.Router();
const otpGenerator = require('otp-generator')
require('dotenv').config();
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

//cloudinary setup
var cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret,
    secure: true
});

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

                res.send({ status: 400, message: "error while sendng the mail.." })

            });

        }).catch(() => {
            res.status(400).send("sorry error in otp creation..")
        })
    }).catch((e) => {
        res.status(400).send("sorry useralready exist..")
    })

})

//router login a user
router.post('/login', (req, res) => {
    const { email, password } = req.body;

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

//verify the otp sent to mobile********
router.post('/verifyotp', Authorizaton, (req, res) => {
    const { otp } = req.body
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
    console.log(req.body.email)
    const password = generator.generate({
        length: 10,
        numbers: true
    });

    //generate secure hashed password
    const salt = await bcrypt.genSalt(10);
    const secpass = await bcrypt.hash(password, salt);
    UserModel.findOneAndUpdate({ email: req.body.email }, {
        $set: {
            secure_password: secpass
        }
    }).then((val) => {
        console.log(val)
        forgotpassword(email=req.email, firstname=val.firstname, password).then((respo) => {
            res.status(200).send('new password sent succesfully....')
        }).catch((err) => {
            res.status(400).send("sorry error while sending mail....")
        })
    }).catch((e) => {
        console.log(e)
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
//****** api for authentication end***********/


//****************searching apis list*********
//get all details of user except private details
router.post('/getalluserdetails', (req, res) => {
    const { id } = req.body;
    //get user profile details
    UserModel.findById(id, { email: 0, mobile: 0, lastname: 0, addressLine1: 0, addressLine2: 0, country_name: 0, state_name: 0, city_name: 0, taluka: 0, district: 0, verified: 0, coins: 0 }).then((val) => {
        res.status(200).send(val)
    }).catch((e) => {

        res.status(400).send("sorry errror in mongodb...")
    })
})

//access the user profile contact details
router.post("/getusercontactdetails", Authorizaton, async (req, res) => {
    const { profileid } = req.body;
    try {
        //find user who requesting for profile
        const data = await UserModel.findOne({ email: req.email })
        if (data) {
            //cheack wheather recharge expired or not
            if (data.rechargExpireDate > Date.now()) {
                if (data.coins <= 0) {
                    res.status(400).send("sorrry you don't have enough coins ")
                }
                else {
                    try {
                        //get the actual profile which need to share back to user
                        const profiledata = await UserModel.findOne({ _id: profileid }, { email: 1, mobile: 1, lastname: 1, addressLine2: 1, country_name: 1, state_name: 1, city_name: 1, taluka: 1, district: 1 })
                        if (profiledata) {

                            //decrease coins by 5
                            UserModel.findOneAndUpdate({ email: req.email }, {
                                $set: {
                                    coins: data.coins - 5
                                }
                            }, { new: true }).then(async (val1) => {

                                res.status(200).json({ datatoken: await getDatatoken(val1.firstname, val1.email, val1.mobile, val1.gender, val1.verified, val1.profile_completed, val1.coins), profiledata })
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
    //{ $or: [{ email: email }, { firstname: name }] }
    const { lookingFor, fromAge, toAge, maritalStatus, Religion } = req.body
    try {
        const result = await UserModel.find({ caste: Religion, maritalStatus, gender: lookingFor, age: { $gt: fromAge, $lt: toAge } }, { image1: 1, firstname: 1, dob: 1, city_name: 1, caste: 1, age: 1, education: 1 })
        res.status(200).send(result)
    }
    catch (e) {
        console.log(e)
        res.status(400).send('sorry errror found..')
    }
})

//api for advance search 
router.post("/advancesearch", async (req, res) => {
    const {
        lookingFor,
        fromAge,
        toAge,
        maritalStatus,
        Religion,
        caste,
        height,
        education,
        salary,
        state,
        location } = req.body;

    try {
        const data = await UserModel.find({ Religion, maritalStatus, caste, gender: lookingFor, age: { $gt: fromAge, $lt: toAge }, height, education, salaryPA: salary, state_name: state, city_name: location })
        res.status(200).send(data)
    }
    catch (e) {
        res.status(400).send("sorry some errror occured..")

    }

})

//api to get latest created profiles
router.get("/getrecentprofiles", async (req, res) => {
    try {
        let data = await UserModel.find({}, { image1: 1, education: 1, firstname: 1 }).limit(6).exec();
        res.status(200).send(data)
    }
    catch (e) {
        res.status(400).send("sorry some errror occured...")

    }

})

//A) Create **********************************************************************************
//1.gettting basic info
router.post('/getbasicinfouser', Authorizaton, async (req, res) => {

    const {
        age,
        image1,
        image2,
        image3,
        height,
        weight,
        mother_tongue,
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

    try {
        const responseCloud1 = await cloudinary.uploader.upload(image1)
        const responseCloud2 = await cloudinary.uploader.upload(image2)
        const responseCloud3 = await cloudinary.uploader.upload(image3)
        //update only necossory fields in database    
        User.findOneAndUpdate({ email: req.email }, {
            $set: {
                age,
                profile_completed: 50,
                height,
                weight,
                bloodGroup,
                education,
                occupation,
                salaryPA,
                dob,
                mother_tongue,
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
                district,
                image1: responseCloud1.url,
                image2: responseCloud2.url,
                image3: responseCloud3.url
            }
        }, { new: true }).then(async (val1) => {
            res.status(200).send({ datatoken: await getDatatoken(val1.firstname, val1.email, val1.mobile, val1.gender, val1.verified, val1.profile_completed, val1.coins) })
        }).catch((err) => {
            res.status(400).send("sorry some error occured")

        })
    }
    catch (e) {
        res.status(400).send("sorry some errror occured..")
    }

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
    User.findOneAndUpdate({ email: req.email }, {
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
    User.findOneAndUpdate({ email: req.email }, {
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
            profile_completed: 100,
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
    User.findOneAndUpdate({ email: req.email }, {
        $set: {
            rashi, nakshatra, mangal, charan, time_of_birth, place_of_birth, nadi, devak, gan
        }
    }, { new: true }).then(async (val1) => {
        res.status(200).send({ datatoken: await getDatatoken(val1.firstname, val1.email, val1.mobile, val1.gender, val1.verified, val1.profile_completed, val1.coins) })
    }).catch((err) => {
        res.status(400).send("sorry some error occured")
    })
})

//B)Read********************************************************************

//C)Update


//D)Delete*****************************************************************************************************
//sendDeletePreviewMale to user
//sendDeletePreviewMale to user
router.post("/senddeletepreviewemale", Authorizaton, async (req, res) => {
    const { firstname } = req.body
    //otp generator
    try {
        const prevdata = await DeleteOtpModel.findOne({ email: req.email })
        if (prevdata) {
            if (prevdata.expireAt < Date.now()) {
                DeleteOtpModel.findByIdAndDelete(prevdata._id, (err, docs) => {
                    if (err) {
                        res.status(400).send("sorry errro while deleting otp")
                    }
                    else {
                        const otp = otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
                        //create DeleteOtp 
                        const Deleteotp = new DeleteOtpModel({
                            otp,
                            email: req.email, createdAt: Date.now(), expireAt: Date.now() + 180000
                        })
                        Deleteotp.save().then(() => {
                            //send verifivation mail ro user
                            deleteConfirm(req.email, otp, firstname).then(() => {
                                res.status(200).send("email sent succesfully..")
                            }).catch(() => {
                                res.status(400).send("sorry error while sending the mail..")
                            })

                        }).catch(() => {
                            res.status(400).send("sorry errror in mongodb..")
                        })
                    }
                })
            }
            else {
                res.status(400).send("already sent a otp which is not expired..")
            }
        }
        else {
            const otp = otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
            //create DeleteOtp 
            const Deleteotp = new DeleteOtpModel({
                otp,
                email: req.email, createdAt: Date.now(), expireAt: Date.now() + 180000
            })
            Deleteotp.save().then(() => {
                //send verifivation mail ro user
                deleteConfirm(req.email, otp, firstname).then(() => {
                    res.status(200).send("email sent succesfully..")
                }).catch(() => {
                    res.status(400).send("sorry error while sending the mail..")
                })

            }).catch(() => {
                res.status(400).send("sorry errror in mongodb..")
            })
        }
    }
    catch (e) {
        res.status(400).send()
    }


})
//delete user for normal user
router.post('/deleteprofile', Authorizaton, async (req, res) => {
    const { gender, mobile, reason, otp } = req.body
    try {
        const otpdata = await DeleteOtpModel.findOne({ email: req.email })

        if (otpdata) {
            //cheack otp expired or not
            if (otpdata.expireAt > Date.now()) {
                if (otpdata.otp === otp) {
                    const deleted = new Deleted({
                        mobile, email: req.email, gender, reason
                    })
                    //save the deleted informataion
                    deleted.save().then(() => {
                        //delete the info from database
                        UserModel.findOneAndDelete({ email: req.email }).then(() => {
                            res.status(200).send("deleted succesfully..")
                        }).catch(() => {
                            res.status(400).send("sorrry errror while deleting profile")
                        })
                    }).catch((e) => {
                        console.log(e)
                        res.status(400).send("sorrry errro in mongodb ")
                    })
                }
                else {
                    res.status(400).send("please fill correct otp")
                }

            } else {

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

//getting single profile details
router.get('/getsingleprofileofuser', Authorizaton, async (req, res) => {
    try {
        const data = await UserModel.findOne({ email: req.email }, { verified: 0, secure_password: 0, coins: 0, })
        res.status(200).send(data)
    }
    catch (e) {
        res.status(400).send("sorrry cant get profile..")
    }
})
module.exports = router

