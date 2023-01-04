const express = require("express");
const Reacharges = require("../../Models/Reacharges");
const router = express.Router();
const UserModel = require("../../Models/User");
const { v4: uuidv4 } = require('uuid');
//home page
router.get("/", (req, res) => {
    res.send("ok")
})

//admin can search a specific profile based on 
router.get("/getspecificuser", async (req, res) => {
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
router.post("/createspecificuser", (req, res) => {
    const { name, sirname, age } = req.body
    res.send(name)
})

//admin can delete specific profile
router.post("/deletespecificuser", (req, res) => {
    res.send("user deleted succesfulyy...")
})

//admin can update specific profile
router.post("/updatespecificuser", (req, res) => {
    res.send("user updated succesfulyy")
})

//admin can recharge a profile
router.post("/rechargeuser", async (req, res) => {
    const { email, coins, plan, days } = req.body
    const rid = uuidv4();
    const recharge = new Reacharges({ email, plan, rechargeDate: Date.now(), expireDate: Date.now() + days * 86400000, rechargeId: rid })
    recharge.save().then((val) => {
        UserModel.findOneAndUpdate({ email }, {
            $set: {
                coins,
                rechargeDate: Date.now(),
                rechargExpireDate:  Date.now() + days * 86400000
            }
        }).then(() => {
            res.status(200).send("recharge succsessfull...thanks !")
        }).catch((err) => {
            console.log(err)
            res.status(400).send("sorry errro while recharging")
        })
    }).catch((err) => {
        console.log(err)
        res.status(400).send("sorry erorr while recharging")
    })
})



module.exports = router