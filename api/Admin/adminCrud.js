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
router.get("/deleteadmin", adminAuthorizaton, (req, res) => {
    const { id } = req.body
    AdminModel.findByIdAndDelete(id).then(() => {
        res.status(200).send("admin deleted succesfully..")
    }).catch((err) => {
        console.log(err)
        res.status(400).send("sorrry user not deleted..")
    })

})
//get all admin details
router.get("/getalladmins", async (req, res) => {
    try {
        const data = await AdminModel.find()
        res.status(200).send(data)
    }
    catch (e) {
        console.log(e)
        res.status(400).send("sorry some errro occured..")

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
                    res.status(200).send({ accesstoken: await getadminaccesstoken(admindata.email, admindata.root) })
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
router.get("/getspecificuser", cheackNormaladmin, async (req, res) => {
    const { name, email } = req.query
    try {
        const result = await UserModel.find({ $or: [{ email: email }, { firstname: name }] })
        res.send(result)
    }
    catch (e) {
        res.status(400).send('sorry errror found..')
    }

}
)

//admin can create specific profile without emil authentication
router.post("/createspecificuser", cheackNormaladmin, (req, res) => {
    const { name, sirname, age } = req.body
    res.send(name)
})

//admin can delete specific profile
router.post("/deletespecificuser", adminAuthorizaton, (req, res) => {
    const { id } = req.body
    UserModel.findOneAndDelete(id).then(() => {
        res.status(200).send("profile deleted succesfully...")
    }).catch(() => {
        res.status(400).send("sorry profile not deleted")
    })
})

//admin can update specific profile
router.post("/updatespecificuser", adminAuthorizaton, (req, res) => {
    res.send("user updated succesfulyy.........")
})

//admin can recharge a profile
router.post("/rechargeuser", async (req, res) => {
    const { email, coins, plan, days } = req.body
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
            res.status(200).send("recharge succsessfull...thanks... !")
        }).catch(() => {
            res.status(400).send("sorry errro while recharging....")
        })
    }).catch(() => {
        res.status(400).send("sorry erorr while recharging...")
    })
})

//api to get expired users from database
router.get("/getexpiredusers", (req, res) => {
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
router.post("/addstories", async (req, res) => {
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
router.post("/updatestories", async (req, res) => {
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
            const split1 = val1.url.split("/").pop()
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

//Delete:delete perticular story from database
router.post("/deletestory", (req, res) => {
    const { id } = req.body
    Stories.findByIdAndDelete(id).then(async (val1) => {
        const split1 = val1.url.split("/").pop()
        try {
            //delete image from cloudinary
            await cloudinary.uploader.destroy(split1.split(".")[0])
            res.status(200).send("deleted succesfully")
        }
        catch (e) {
            res.status(400).send("sorry seome error occurs in cloudinary")
        }
    }).catch(() => {
        res.status(400).send("sorrry some error found in mongodb")
    })
})

//get customer queries 
router.post("/getqueries", (req, res) => {
    const { name, email, contact, message } = req.body;
    const newQuery = Queries({
        name, email, contact, message
    })
    newQuery.save().then(() => [
        res.status(200).send("query added succesfully..")
    ]).catch(() => {
        res.status(400).send("sorry query not added...")
    })

})
//send customer queries back
router.get('/customerqueries', adminAuthorizaton, (req, res) => {

    Queries.find().then((val) => {
        res.status(200).send(val)
    }).catch(() => {
        res.status(400).send("sorry error in mongodb..")
    })
})

//********* normal admin can create users without email verification */
//1.get register informaton
router.post('/register', adminAuthorizaton, async (req, res) => {
    const { firstname, email, mobile, password, lastname, gender } = req.body

    //generate secure hashed password
    const salt = await bcrypt.genSalt(10)
    const secpass = await bcrypt.hash(password, salt)

    //otp generator
    const otp = otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });

    //create user instance
    UserModel.create({
        firstname, email, mobile, secure_password: secpass, lastname, gender, verified: true,
        profile_completed: 20
    }).then((val1) => {
        res.status(200).send("registartion details submited succesfully..")
    }).catch(() => {
        res.status(400).send("sorry useralready exist..")
    })

})

//2.gettting basic info
router.post('/getbasicinfo', adminAuthorizaton, async (req, res) => {
    const {
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
    User.findByIdAndUpdate({ email }, {
        $set: {
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
router.post("/getfamilydetails", (req, res) => {
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
    User.findByIdAndUpdate({ email }, {
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
        res.status(200).send("family details submited succesfully..")
    }).catch((err) => {
        res.status(400).send("sorry some error occured")
    })

});
//3.partner prefrence
router.post('/getpartnerprefrence', (req, res) => {
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
    User.findByIdAndUpdate({ email }, {
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
router.post('/gethoroscopedetails', (req, res) => {
    const { email, rashi, nakshatra, mangal, charan, time_of_birth, place_of_birth, nadi, devak, gan } = req.body
    User.findByIdAndUpdate({ email }, {
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
router.post('/updateuserprofile',(req,res)=>{
    
}) 

module.exports = router