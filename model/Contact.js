const mongoose = require("mongoose")

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        min: 6,
        max: 255,
        required: true
    },
    email: {
        type: String,
        min: 6,
        max: 255,
        required: true
    },
    mobile: {
        type: String,
        min: 8,
        max: 12,
        required: true
    },
    query: {
        type: String,
        min: 1,
        max: 10000,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model("Contact", contactSchema);