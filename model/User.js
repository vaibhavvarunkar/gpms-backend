const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        min: 6,
        max: 255
    },
    email: {
        type: String,
        min: 6,
        max: 255,
        required: true
    },
    password: {
        type: String,
        min: 6,
        max: 1024,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    resetLink: {
        data: String,
        default: ""
    }
})

module.exports = mongoose.model("User", userSchema);