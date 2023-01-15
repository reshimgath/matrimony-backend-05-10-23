const mongoose = require("mongoose")
const storiesScheama = new mongoose.Schema({
    image: {
        type: String,
        require: true
    },
    date: {
        type: Date,
        require: true
    },
    men: {
        type: String,
        require: true
    },
    women: {
        type: String,
        require: true
    }
})
module.exports = mongoose.model("stories", storiesScheama)