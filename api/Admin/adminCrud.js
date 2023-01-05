const express = require("express");
const Reacharges = require("../../Models/Reacharges");
const router = express.Router();
const UserModel = require("../../Models/User");
const AdminModel = require("../../Models/Admin")
const { v4: uuidv4 } = require('uuid');
const bcrypt = require("bcryptjs");

const getadminaccesstoken = require("../../Functions/jwtforadmin");
const adminAuthorizaton = require("../../Middlewears/cheackrootadmin");
const cheackNormaladmin = require("../../Middlewears/cheackNormaladmin")
const cheackRecharge = require("../../Middlewears/cheackRecharge")
//const getAccesstoken = require("../../Functions/getaccessToken");
//const getDatatoken = require("../../Functions/getDatatoken");

//home page
router.get("/", (req, res) => {
    res.send("ok")
})

//Only Root admin can create new admin
router.post('/createadmin', async (req, res) => {
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

//admin can search a specific profile based on 
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
router.post("/rechargeuser", cheackRecharge, async (req, res) => {
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
        }).catch((err) => {

            res.status(400).send("sorry errro while recharging....")
        })
    }).catch(() => {
        res.status(400).send("sorry erorr while recharging...")
    })
})



module.exports = router