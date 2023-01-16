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
    //url.split(":")[0]
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

module.exports = router