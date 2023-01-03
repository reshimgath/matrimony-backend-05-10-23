const express = require("express")
const router = express.Router();
const otpGenerator = require('otp-generator')
require('dotenv').config();
const jwt = require('jsonwebtoken')
const UserModel = require("../Models/User");
const OTP = require("../Models/OTP");
const User = require("../Models/User");
const mailSender = require("../Functions/mailsender");
const Authorizaton = require("../Middlewears/authrization");
const bcrypt = require("bcryptjs");
const getDatatoken = require("../Functions/getDatatoken");
const getAccesstoken = require("../Functions/getaccessToken");


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
                res.status(200).send({ accesstoken: await getAccesstoken(val1.firstname, val1.email, val1.mobile), datatoken: await getDatatoken(val1.firstname, val1.email, val1.mobile, val1.gender, val1.verified, val1.profile_completed), message: "otp sent succesfulyy" })
            }).catch((err) => {
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
    //find the user with email in database
    UserModel.findOne({ email }).then((val1) => {
        if (val1) {
            //compare the hashed passwrod and input password
            bcrypt.compare(password, val1.secure_password).then(async (correct) => {
                if (correct) {
                    res.status(200).send({ accesstoken: await getAccesstoken(val1.firstname, val1.email, val1.mobile), datatoken: await getDatatoken(val1.firstname, val1.email, val1.mobile, val1.gender, val1.verified, val1.profile_completed) })
                }
                else {
                    res.status(401).send("incorrect password")
                }
            })
        }
        else {
            res.status(401).send("sorry user not found with given email id")
        }
    }).catch(() => {
        res.status(400).send("sorry errro in mongodb")
    })

})

//delete user for normal user
router.post('/deleteprofile', (req, res) => {
    res.status(200).send("profile deleted succesfulyy..")
})
//update profile for normal user
router.post('/updateprofile', (req, res) => {
    res.status(200).send("profile updated succesfulyy..")
})

//*********verify the otp sent to mobile********
router.post('/verifyotp',Authorizaton, (req, res) => {
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
                        }
                    }).then(() => {
                        res.status(200).send("hello otp is valid succesfully redirecting to ..")

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
router.post("/resendotp",Authorizaton, (req, res) => {
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

router.get('/samplecheack', Authorizaton, (req, res) => {
    res.status(200).send(req.user)
})

module.exports = router

