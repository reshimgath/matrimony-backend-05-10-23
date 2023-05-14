// @ts-nocheck 
const express = require("express");
const Reacharges = require("../../Models/Reacharges");
const router = express.Router();
const UserModel = require("../../Models/User");
const AdminModel = require("../../Models/Admin")
const { v4: uuidv4 } = require('uuid');
const bcrypt = require("bcryptjs");
require('dotenv').config();
const getadminaccesstoken = require("../../Functions/jwtforadmin");
const adminAuthorizaton = require("../../Middlewears/cheackrootadmin");
const cheackNormaladmin = require("../../Middlewears/cheackNormaladmin")
const cheackRecharge = require("../../Middlewears/cheackRecharge");
const Stories = require("../../Models/Stories");
const Queries = require("../../Models/Queries");
const Plans = require("../../Models/Plans")
const RechargeEmail = require("../../Functions/rechargeConfirm")
//const getAccesstoken = require("../../Functions/getaccessToken");
//const getDatatoken = require("../../Functions/getDatatoken");

//cloudinary setup
var cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret,
    secure: true
});

//home page
router.get("/", (req, res) => {
    res.send("ok")
})

//Only Root admin can create new admin
router.post('/createadmin', adminAuthorizaton, async (req, res) => {
    const { root, canrecharge, email, password } = req.body
    //generate secure hashed password
    const salt = await bcrypt.genSalt(10)
    const secpass = await bcrypt.hash(password, salt)
    const admin = new AdminModel({
        root,
        email,
        canrecharge,
        password: secpass
    })

    //save admin details
    admin.save().then(() => {
        res.status(200).send("user created succesfully")
    }).catch(() => {
        res.status(400).send("user already exist")
    })
})

//delete addmin
router.post("/deleteadmin", adminAuthorizaton, (req, res) => {
    const { id } = req.body
    AdminModel.findByIdAndDelete(id).then(() => {
        res.status(200).send("admin deleted succesfully..")
    }).catch((err) => {
        res.status(400).send("sorrry user not deleted..")
    })

})
//get all admin details
router.get("/getalladmins", adminAuthorizaton, async (req, res) => {
    try {
        const data = await AdminModel.find()
        res.status(200).send(data)
    }
    catch (e) {
        res.status(400).send("sorry some errro occured..")

    }
})

//get all users for users table
router.get("/getallusersfortable", cheackNormaladmin, async (req, res) => {

    try {
        UserModel.find({}, { email: 1, coins: 1, firstname: 1, rechargeDate: 1, rechargExpireDate: 1 }).then((val) => {
            res.status(200).send(val)
        }).catch((err) => {
            res.status(400).send(err)
        });
    }
    catch (e) {
        res.status(400).send("sorry error in mongodb...")

    }
})

//admin can search a specific profile based on email or firstname
router.post("/getspecificuser", cheackNormaladmin, async (req, res) => {
    const { name, email } = req.body
    try {
        // const result = await UserModel.find({ $or: [{ email: { $regex: email, $options: 'i' } }, { firstname: { $regex: name, $options: 'i' } }] }, { email: 1, firstname: 1, coins: 1, rechargeDate: 1, rechargExpireDate: 1 })
        const result = await UserModel.find({ $or: [{ email: email }, { firstname: name }] }, { email: 1, firstname: 1, coins: 1, rechargeDate: 1, rechargExpireDate: 1 })

        res.send(result)
    }
    catch (e) {
        res.status(400).send('sorry errror found..')
    }

})

//get unpaid users 
router.get("/getunpaidusers", cheackNormaladmin, async (req, res) => {
    try {
        const data = await UserModel.find({ coins: 0 }, { email: 1, firstname: 1, coins: 1, rechargeDate: 1, rechargExpireDate: 1 });
        res.status(200).send(data)
    }
    catch (e) {
        res.status(400).send("sorry error in mongodb...")

    }
})

//get paid users 
router.get("/getpaidusers", cheackNormaladmin, async (req, res) => {
    try {
        const data = await UserModel.find({ coins: { $gt: 0 } }, { email: 1, coins: 1, firstname: 1, rechargeDate: 1, rechargExpireDate: 1 });
        res.status(200).send(data)
    }
    catch (e) {
        res.status(400).send("sorry error in mongodb...")

    }
})

//admin login
router.post("/loginadmin", async (req, res) => {
    const { email, password } = req.body
    try {
        //find user
        const admindata = await AdminModel.findOne({ email })
        if (admindata) {

            //compare the hashed passwrod and input password
            bcrypt.compare(password, admindata.password).then(async (correct) => {
                if (correct) {
                    res.status(200).send({ accesstoken: await getadminaccesstoken(admindata.email, admindata.root, admindata.canrecharge) })
                }
                else {
                    res.status(401).send("incorrect password")
                }
            })
        }
        else {
            res.status(401).send("sorry user not found")
        }
    }
    catch (e) {
        res.status(401).send("sorry user not found")
    }
})

//admin can search a specific profile based on email or firstname
router.post("/getallsingleprofiledetails", cheackNormaladmin, async (req, res) => {
    const { email } = req.body
    try {
        const result = await UserModel.findOne({ email })
        res.send(result)
    }
    catch (e) {
        res.status(400).send('sorry error found..')
    }

})

//admin can delete specific profile
router.post("/deletespecificuser", adminAuthorizaton, (req, res) => {
    const { id } = req.body
    UserModel.findByIdAndDelete(id).then(() => {
        res.status(200).send("profile deleted succesfully...")
    }).catch(() => {
        res.status(400).send("sorry profile not deleted")
    })
})

//admin can recharge a profile
router.post("/rechargeuser", cheackRecharge, async (req, res) => {
    const { firstname, email, coins, plan, days, details } = req.body
    const finalplan = JSON.parse(details)

    const rid = uuidv4();
    const recharge = new Reacharges({ email, plan, rechargeDate: Date.now(), expireDate: Date.now() + days * 86400000, rechargeId: rid })
    recharge.save().then(() => {
        UserModel.findOneAndUpdate({ email }, {
            $set: {
                coins,
                rechargeDate: Date.now(),
                rechargExpireDate: Date.now() + days * 86400000
            }
        }).then(() => {
            RechargeEmail(email, plan, firstname, finalplan).then(() => {
                res.status(200).send("recharge succsessfull...thanks... !")
            }).catch((er) => {
            })
        }).catch(() => {
            res.status(400).send("sorry errro while recharging....")
        })
    }).catch(() => {
        res.status(400).send("sorry erorr while recharging...")
    })
})

//api to get expired users from database
router.get("/getexpiredusers", cheackNormaladmin, (req, res) => {
    UserModel.find({
        rechargExpireDate: {
            $lt: Date.now()
        }
    }).then((val) => {
        res.status(200).send(val)
    }).catch((err) => {
        res.status(400).send("sorry errror in mongodb")
    })

})

//Create:success story
router.post("/addstories", cheackNormaladmin, async (req, res) => {
    const { image, date, men, women } = req.body;
    try {
        const responseCloud = await cloudinary.uploader.upload(image)
        const myStory = new Stories({
            image: responseCloud.url,
            date,
            men,
            women
        })

        myStory.save().then((val) => {
            res.status(200).send(val)
        }).catch((err) => {
            res.status(400).send(err)
        })
    }
    catch (e) {
        res.status(400).send(e)
    }

})

//Read:get all stories
router.get("/getstories", async (req, res) => {
    try {
        const data = await Stories.find()
        res.status(200).send(data)
    }
    catch (e) {
        res.status(400).send("sorrry some errror in mongodb..")

    }
})

//Update: perticular story
router.post("/updatestories", cheackNormaladmin, async (req, res) => {
    const { id, image, date, men, women } = req.body;
    let finalurl;
    try {
        //cheack wheather user selected a image if not then set the image url directly to database
        if (image.split(":")[0] === 'data') {
            const responseCloud = await cloudinary.uploader.upload(image)
            finalurl = responseCloud.url
        }
        else {
            finalurl = image
        }
        Stories.findByIdAndUpdate(id, {
            image: finalurl,
            date,
            men,
            women
        }).then(async (val1) => {
            const split1 = val1.image.split("/").pop()
            try {
                //delete image from cloudinary
                await cloudinary.uploader.destroy(split1.split(".")[0])
                res.status(200).send("updated succesfully")
            }
            catch (e) {
                res.status(400).send("sorry seome error occurs in cloudinary")
            }
        })
    }
    catch (e) {
        res.status(400).send(e)
    }
})

//get story by id
router.post("/getonestory", cheackNormaladmin, async (req, res) => {
    const { id } = req.body
    try {
        const data = await Stories.findById(id);
        res.status(200).send(data)
    }
    catch (e) {
        res.status(400).send("sorry some errror errro occured...")
    }
})

//Delete:delete perticular story from database
router.post("/deletestory", cheackNormaladmin, (req, res) => {
    const { id } = req.body
    Stories.findByIdAndDelete(id).then(async (val1) => {
        const split1 = val1.image.split("/").pop()
        try {
            //delete image from cloudinary
            await cloudinary.uploader.destroy(split1.split(".")[0])
            res.status(200).send("deleted succesfully")
        }
        catch (e) {
            res.status(400).send("sorry seome error occurs in cloudinary")
        }
    }).catch((err) => {
        res.status(400).send("sorrry some error found in mongodb")
    })
})

//get customer queries 
// router.post("/getqueries", (req, res) => {
//     const { name, email, contact, message } = req.body;
//     const newQuery = Queries({
//         name, email, contact, message
//     })
//     newQuery.save().then(() => [
//         res.status(200).send("query added succesfully..")
//     ]).catch(() => {
//         res.status(400).send("sorry query not added...")
//     })

// })

//Getting details from contact form
router.post('/getqueries', (req, res) => {
    const { name, email, message, contact } = req.body;
    const Details = new Queries({
        name, email, message, contact, createdAt: {
            date: new Date().toDateString(),
            time: new Date().toLocaleTimeString()
        }
    })
    Details.save().then(() => {
        res.status(200).send("form details submitted succesfully...")
    }).catch(() => {
        res.status(400).send("error in contact form")
    })
})
//send customer queries back
router.get('/customerqueries', cheackNormaladmin, (req, res) => {

    Queries.find().then((val) => {
        res.status(200).send(val)
    }).catch(() => {
        res.status(400).send("sorry error in mongodb..")
    })
})

//********* normal admin can create users without email verification */
//1.get register informaton
router.post('/register', cheackNormaladmin, async (req, res) => {
    const { firstname, email, mobile, password, lastname, gender } = req.body

    //generate secure hashed password
    const salt = await bcrypt.genSalt(10)
    const secpass = await bcrypt.hash(password, salt)

    //otp generator
    // const otp = otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });

    //create user instance
    UserModel.create({
        firstname, email, mobile, secure_password: secpass, lastname, gender, verified: true,
        profile_completed: 20
    }).then((val1) => {
        res.status(200).send("registartion details submited succesfully..")
    }).catch((e) => {
        res.status(400).send("sorry user already exist..")
    })

})

//2.gettting basic info
router.post('/getbasicinfo', cheackNormaladmin, async (req, res) => {
    const {
        age,
        image1,
        image2,
        image3,
        email,
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
        addressLine1,
        addressLine2,
        country_name,
        state_name,
        city_name,
        taluka,
        district,
        mother_tongue } = req.body;
    const responseCloud1 = await cloudinary.uploader.upload(image1)
    const responseCloud2 = await cloudinary.uploader.upload(image2)
    const responseCloud3 = await cloudinary.uploader.upload(image3)

    //update only necossory fields in database    
    UserModel.findOneAndUpdate({ email }, {
        $set: {
            age,
            profile_completed: 50,
            height,
            weight,
            bloodGroup,
            education,
            occupation,
            mother_tongue,
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
            addressLine1,
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
    },).then(async () => {
        res.status(200).send("basic details submited succesfully..")
    }).catch(() => {
        res.status(400).send("sorry some error occured")

    })
})

//3.getting family details
router.post("/getfamilydetails", cheackNormaladmin, (req, res) => {
    const {
        email,
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
    UserModel.findOneAndUpdate({ email }, {
        $set: {
            fathers_name,
            fathers_occupation,
            profile_completed: 70,
            mothers_name,
            mothers_occupation,
            bother_select,
            bother_status,
            sister_select,
            sister_status,
            vehicle
        }
    }, { new: true }).then(async (val1) => {
        res.status(200).send("family details submitted succesfully..")
    }).catch((err) => {
        res.status(400).send("sorry some error occured")
    })

});
//3.partner prefrence
router.post('/getpartnerprefrence', cheackNormaladmin, (req, res) => {
    const {
        email,
        education_pref,
        occupation_pref,
        salary_pref,
        complexion_pref,
        height_pref,
        religion_pref,
        caste_pref,
        state_pref,
        location_pref } = req.body
    UserModel.findOneAndUpdate({ email }, {
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
        res.status(200).send("partner prefrence details added succesfully...")
    }).catch((err) => {
        res.status(400).send("sorry some error occured")
    })
})

//4.getting horoscope details (optional)
router.post('/gethoroscopedetails', cheackNormaladmin, (req, res) => {
    const { email, rashi, nakshatra, mangal, charan, time_of_birth, place_of_birth, nadi, devak, gan } = req.body

    UserModel.findOneAndUpdate({ email }, {
        $set: {
            rashi, nakshatra, mangal, charan, time_of_birth, place_of_birth, nadi, devak, gan
        }
    }, { new: true }).then(async (val1) => {
        res.status(200).send("horoscope details submited succesfully..")
    }).catch((err) => {
        res.status(400).send("sorry some error occured")
    })
})

//Update User Profile 
router.post('/updateuserprofile', cheackNormaladmin, async (req, res) => {
    const {

        //1.get register details
        firstname, email, mobile, lastname, gender,
        //2.gettting basic info
        height, weight, bloodGroup, education, occupation, salaryPA, dob,
        birth_time, birth_place, caste, subCaste, complexion, disablity,
        maritalStatus, childrens_count, addressLine1, addressLine2, country_name, state_name,
        city_name, taluka, district, mother_tongue, image1, image2, image3,
        //3.family info
        fathers_name, fathers_occupation, mothers_name, mothers_occupation,
        bother_select, bother_status, sister_select, sister_status,
        own_house, own_farm, own_plot, other_prop,
        //4.partner prefrence
        education_pref, occupation_pref, salary_pref, complexion_pref,
        height_pref, religion_pref, caste_pref, state_pref, location_pref,
        //5.horoscope details
        rashi, nakshatra, mangal, charan, time_of_birth,
        place_of_birth, nadi, devak, gan
    } = req.body;

    let responseCloud1
    let responseCloud2
    let responseCloud3
    //cheack wheather user selected a image if not then set the image url directly to database
    image1.split(":")[0] === 'data' ? responseCloud1 = await cloudinary.uploader.upload(image1) : (responseCloud1 = image1)
    image2.split(":")[0] === 'data' ? responseCloud2 = await cloudinary.uploader.upload(image2) : (responseCloud2 = image2)
    image3.split(":")[0] === 'data' ? responseCloud3 = await cloudinary.uploader.upload(image3) : (responseCloud3 = image3)


    UserModel.findOneAndUpdate({ email }, {
        $set: {
            //1.gettting registration details
            firstname, email, mobile, lastname, gender, profile_completed: 100,

            //2.getting perosnal details
            height, weight, bloodGroup, education,
            occupation, mother_tongue, salaryPA, dob, birth_time, birth_place, caste,
            subCaste, complexion, disablity, maritalStatus, childrens_count, addressLine1,
            addressLine2, country_name, state_name, city_name, taluka, district,
            image1: responseCloud1.url, image2: responseCloud2.url, image3: responseCloud3.url

            //3.family details
            , fathers_name, fathers_occupation, mothers_name,
            mothers_occupation, bother_select, bother_status, sister_select, sister_status,
            own_house, own_farm, own_plot, other_prop

            //4.partner prefrence
            , education_pref, occupation_pref, salary_pref, complexion_pref,
            height_pref, religion_pref, caste_pref, state_pref, location_pref,

            //5.horoscope details
            rashi, nakshatra, mangal, charan, time_of_birth,
            place_of_birth, nadi, devak, gan
        }
    }).then(() => {
        res.status(200).send("user updated succesfullyy...")
    }).catch(() => {
        res.status(400).send("sorrry errro while updation")
    })



})
//updating user profile by breking all the forms

//getting only register related details
router.post("/getregisterdetailsupdate", cheackNormaladmin, async (req, res) => {
    const { email } = req.body;
    try {
        const data = await UserModel.findOne({ email }, { firstname: 1, email: 1, mobile: 1, lastname: 1, gender: 1, profile_completed: 1 })
        res.status(200).send(data)
    }
    catch (e) {
        res.status(400).send("sorrry some errro occured while registerupdate.")
    }
})
//getting only personal related details
router.post("/getpersonaldetailsupdate", cheackNormaladmin, async (req, res) => {
    const { email } = req.body;
    try {
        const data = await UserModel.findOne({ email }, {
            age: 1, height: 1, weight: 1, bloodGroup: 1, education: 1, occupation: 1, salaryPA: 1, dob: 1,
            birth_time: 1, birth_place: 1, caste: 1, subCaste: 1, complexion: 1, disablity: 1,
            maritalStatus: 1, childrens_count: 1, addressLine1: 1, addressLine2: 1, country_name: 1, state_name: 1,
            city_name: 1, taluka: 1, district: 1, mother_tongue: 1, image1: 1, image2: 1, image3: 1
        })
        res.status(200).send(data)
    }
    catch (e) {
        res.status(400).send("sorrry some errro occured while personalupdate.")
    }
})
//getting only family related details
router.post("/getfamilydetailsupdate", cheackNormaladmin, async (req, res) => {
    const { email } = req.body;
    try {
        const data = await UserModel.findOne({ email }, {
            fathers_name: 1, fathers_occupation: 1, mothers_name: 1, mothers_occupation: 1,
            bother_select: 1, bother_status: 1, sister_select: 1, sister_status: 1,
            own_house: 1, own_farm: 1, own_plot: 1, other_prop: 1
        })
        res.status(200).send(data)
    }
    catch (e) {
        res.status(400).send("sorrry some errro occured while familyupdate.")
    }
})
//getting only partner related details
router.post("/getpartnerdetailsupdate", cheackNormaladmin, async (req, res) => {
    const { email } = req.body;
    try {
        const data = await UserModel.findOne({ email }, {
            education_pref: 1, occupation_pref: 1, salary_pref: 1, complexion_pref: 1,
            height_pref: 1, religion_pref: 1, caste_pref: 1, state_pref: 1, location_pref: 1
        })
        res.status(200).send(data)
    }
    catch (e) {
        res.status(400).send("sorrry some errro occured while partnerupdate.")
    }
})
//getting horoscope details
router.post("/gethoroscopedetailsupdate", cheackNormaladmin, async (req, res) => {
    const { email } = req.body;
    try {
        const data = await UserModel.findOne({ email }, {
            rashi: 1, nakshatra: 1, mangal: 1, charan: 1, time_of_birth: 1,
            place_of_birth: 1, nadi: 1, devak: 1, gan: 1
        })
        res.status(200).send(data)
    }
    catch (e) {
        res.status(400).send("sorrry some errro occured while partnerupdate.")
    }
})

//delted profiles from user side
router.get('/getdeletedprofiles', cheackNormaladmin, async (req, res) => {
    try {
        const data = await Deleted.find()
        res.status(200).send(data)
    }
    catch (e) {
        res.status(400).send("sorry error getting deletd profiles ")
    }

})
//**************update details 
//post only register related details
//family details
router.post("/updateregisterdetails", cheackNormaladmin, (req, res) => {
    const {
        firstname, email, mobile, lastname, gender, } = req.body
    UserModel.findOneAndUpdate({ email }, {
        $set: {
            firstname, email, mobile, lastname, gender, profile_completed: 100,
        }
    }).then(() => {
        res.status(200).send("register details updated succesfully...")
    }).catch(() => {
        res.status(400).send("sorry errro while register updating..")
    })

})
//basic info
router.post("/updatebasicdetails", cheackNormaladmin, async (req, res) => {
    const {
        //2.gettting basic info
        email, age,
        height, weight, bloodGroup, education, occupation, salaryPA, dob,
        birth_time, birth_place, caste, subCaste, complexion, disablity,
        maritalStatus, childrens_count, addressLine1, addressLine2, country_name, state_name,
        city_name, taluka, district, mother_tongue, image1, image2, image3, } = req.body
    let responseCloud1
    let responseCloud2
    let responseCloud3
    //cheack wheather user selected a image if not then set the image url directly to database
    image1.split(":")[0] === 'data' ? responseCloud1 = await cloudinary.uploader.upload(image1) : (responseCloud1 = image1)
    image2.split(":")[0] === 'data' ? responseCloud2 = await cloudinary.uploader.upload(image2) : (responseCloud2 = image2)
    image3.split(":")[0] === 'data' ? responseCloud3 = await cloudinary.uploader.upload(image3) : (responseCloud3 = image3)
    UserModel.findOneAndUpdate({ email }, {
        $set: {
            //2.getting perosnal details
            height, weight, bloodGroup, education, age,
            occupation, mother_tongue, salaryPA, dob, birth_time, birth_place, caste,
            subCaste, complexion, disablity, maritalStatus, childrens_count, addressLine1,
            addressLine2, country_name, state_name, city_name, taluka, district,
            image1: responseCloud1.url, image2: responseCloud2.url, image3: responseCloud3.url
        }
    }).then(() => {
        res.status(200).send("register details updated succesfully...")
    }).catch(() => {
        res.status(400).send("sorry errro while register updating..")
    })

})

//family details
router.post("/updatefamilydetails", cheackNormaladmin, (req, res) => {
    const { email,
        fathers_name, fathers_occupation, mothers_name, mothers_occupation,
        bother_select, bother_status, sister_select, sister_status,
        own_house, own_farm, own_plot, other_prop } = req.body
    UserModel.findOneAndUpdate({ email }, {
        $set: {
            fathers_name, fathers_occupation, mothers_name,
            mothers_occupation, bother_select, bother_status, sister_select, sister_status,
            own_house, own_farm, own_plot, other_prop
        }
    }).then(() => {
        res.status(200).send("family details updated succesfully...")
    }).catch(() => {
        res.status(400).send("sorry errro while family updating..")
    })

})

//partner prefrence
router.post("/updatepartnerdetails", cheackNormaladmin, (req, res) => {
    const { email,
        education_pref, occupation_pref, salary_pref, complexion_pref,
        height_pref, religion_pref, caste_pref, state_pref, location_pref, } = req.body

    UserModel.findOneAndUpdate({ email }, {
        $set: {
            education_pref, occupation_pref, salary_pref, complexion_pref,
            height_pref, religion_pref, caste_pref, state_pref, location_pref,
        }
    }).then(() => {
        res.status(200).send("family details updated succesfully...")
    }).catch(() => {
        res.status(400).send("sorry errro while partner prefrnece updating..")
    })

})

//horoscop details
router.post("/updatehoroscopedetails", cheackNormaladmin, (req, res) => {
    const { email,
        rashi, nakshatra, mangal, charan, time_of_birth,
        place_of_birth, nadi, devak, gan } = req.body

    UserModel.findOneAndUpdate({ email }, {
        $set: {
            rashi, nakshatra, mangal, charan, time_of_birth,
            place_of_birth, nadi, devak, gan
        }
    }).then(() => {
        res.status(200).send("family details updated succesfully...")
    }).catch(() => {
        res.status(400).send("sorry errro while partner prefrnece updating..")
    })

})

//**************crud for plans *********************/
//Create:
router.post("/createplan", cheackNormaladmin, (req, res) => {
    const { price, expiresinMonths, mediator, services, contact_count } = req.body
    const newservices = JSON.parse(services);
    const planmodel = new Plans({
        price, expiresinMonths, mediator, services: newservices, contact_count
    })
    planmodel.save().then((val) => {
        res.status(200).send("new plan created succesfully")
    }).catch((err) => {
        res.status(400).send("sorry some errro occured")
    })
})

//Read
router.get('/getallplans', async (req, res) => {
    try {
        const data = await Plans.find();
        res.status(200).send(data)
    }
    catch (e) {
        res.status(400).send("sorry some errro occured")

    }

})

//update
router.post("/updateplan", cheackNormaladmin, (req, res) => {
    const { id, price, expiresinMonths, mediator, services, contact_count } = req.body
    const newservices = JSON.parse(services);
    Plans.findByIdAndUpdate(id, {
        price,
        expiresinMonths,
        mediator,
        services: newservices,
        contact_count
    }).then(() => {
        res.status(200).send("plan updated succesfull...")
    }).catch(() => {
        res.status(400).send("sorry errro while updating...")
    })
})

//delete
router.post("/deleteplan", cheackNormaladmin, (req, res) => {
    const { id } = req.body;
    Plans.findByIdAndDelete(id).then(() => {
        res.status(200).send("plan deleted succesfully..")
    }).catch(() => {
        res.status(400).send("sorry plan not deleted..")
    })
})

//get single plan
router.post("/getsingleplan", cheackNormaladmin, async (req, res) => {
    const { id } = req.body
    try {
        const data = await Plans.findById(id)
        res.status(200).send(data)
    }
    catch (e) {
        res.status(400).send("sorry plan not found...")
    }
})

//getplan names only
router.get("/getplannamesonly", cheackNormaladmin, async (req, res) => {
    try {
        const data = await Plans.find({}, { price: 1 })
        res.status(200).send(data)
    }
    catch (e) {
        res.status(400).send("sorry some errror occured")
    }
})
//**************crud for plans end *********************/

//get recharges done by the admin
router.get("/gerrechargelist", cheackNormaladmin, async (req, res) => {
    try {
        const data = await Reacharges.find();
        res.status(200).send(data)
    }
    catch (e) {
        res.status(400).send("sorrry some errror occured...")
    }
})

// //Only Root admin can create new admin
// router.post('/createadminsample', async (req, res) => {
//     const { root, canrecharge, email, password } = req.body
//     //generate secure hashed password
//     const salt = await bcrypt.genSalt(10)
//     const secpass = await bcrypt.hash(password, salt)
//     const admin = new AdminModel({
//         root,
//         email,
//         canrecharge,
//         password: secpass
//     })

//     //save admin details
//     admin.save().then(() => {
//         res.status(200).send("user created succesfully")
//     }).catch(() => {
//         res.status(400).send("user already exist")
//     })
// })

module.exports = router