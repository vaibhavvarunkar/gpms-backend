const router = require("express").Router()
const User = require("../model/User")
const jwt = require("jsonwebtoken")
const { registerValidation, loginValidation } = require("../validation")
const bcrypt = require("bcryptjs")
const verify = require("./verifyToken")
const { OAuth2Client } = require("google-auth-library")
const fetch = require('node-fetch');
const Contact = require("../model/Contact")
const client = new OAuth2Client("909681480373-6v1aj3pb3opujc1qfiihn4aifc168v40.apps.googleusercontent.com")

//register
router.post("/register", async (req, res) => {

    //LETS VALIDATE THE DATA BEFORE ADDING TO DB
    const { error } = registerValidation(req.body)
    if (error) {
        res.json({
            status: 400,
            message: error.details[0].message
        })
    }

    //Check user is in DB 
    const emailExist = await User.findOne({ email: req.body.email })
    if (emailExist) {
        res.json({
            status: 400,
            message: "Email Already Exist. Kindly Login."
        })
    }

    // Hash The Passwords
    const salt = await bcrypt.genSalt(10)
    const hashPassword = await bcrypt.hash(req.body.password, salt)

    //Create  A NEw User
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashPassword
    })
    if (!emailExist) {
        try {
            const savedUser = await user.save()
            const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET, { expiresIn: "1d" })
            res.header("auth-token", token).json({
                status: 200,
                token: token,
                message: "Logged In Successfully !",
                info: user
            })
        } catch (err) {
            res.json({
                status: 400,
                message: err
            })
        }
    }
})



//Login
router.post("/login", async (req, res) => {
    //validate data before we add a user
    const { error } = loginValidation(req.body)
    if (error) {
        res.json({
            status: 400,
            message: error.details[0].message
        })
    }


    //Check user is in DB 
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        res.json({
            status: 400,
            message: "Email is not registered. Kindly Register please..."
        })
    }

    //Password is correct 
    const validPassword = await bcrypt.compare(req.body.password, user.password)
    if (!validPassword) {
        res.json({
            status: 400,
            message: "Invalid Password"
        })
    }

    //create and assign token
    const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET, { expiresIn: "1d" })
    res.header("auth-token", token).json({
        status: 200,
        token: token,
        message: "Logged In Successfully !",
        info: user
    })

})


//logout
router.get("/logout", (req, res) => {
    const token = ""
    res.json({
        status: 200,
        token: token,
        message: "Logout Successfully..."
    })
})



//login using google
router.post("/googlelogin", async (req, res) => {
    const { tokenId } = req.body
    const response = await client.verifyIdToken({ idToken: tokenId, audience: "909681480373-6v1aj3pb3opujc1qfiihn4aifc168v40.apps.googleusercontent.com" })
    const { email_verified, name, email } = response.payload
    if (email_verified) {
        const user = await User.findOne({ email })
        if (user) {
            const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET, { expiresIn: "1d" })
            res.header("auth-token", token).json({
                status: 200,
                token: token,
                message: "Logged In Successfully !",
                info: user,
                login: "Google"
            })
        }
        else {
            const salt = await bcrypt.genSalt(10)
            const newPassword = email + process.env.TOKEN_SECRET
            password = await bcrypt.hash(newPassword, salt)
            console.log(password);
            let newUser = new User({ name, email, password })
            await newUser.save((err, data) => {
                if (err) {
                    return res.status(400).json({
                        message: "something went wrong!"
                    })
                }
                const token = jwt.sign({ _id: data._id }, process.env.TOKEN_SECRET, { expiresIn: "1d" })
                const { _id, name, email } = newUser
                res.header("auth-token", token).json({
                    status: 200,
                    token: token,
                    message: "Logged In Successfully !",
                    info: newUser,
                    login: "Google"
                })
            })
        }

    }
})

//login with fb

router.post("/facebooklogin", async (req, res) => {
    const { userID, accessToken } = req.body
    let urlGraphFacebook = `https://graph.facebook.com/v2.11/${userID}/?fields=id,name,email&access_token=${accessToken}`
    const result = await fetch(urlGraphFacebook)
    const data = await result.json()
    console.log(data);
    const { email, name } = data
    const user = await User.findOne({ email })
    if (user) {
        const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET, { expiresIn: "1d" })
        res.header("auth-token", token).json({
            status: 200,
            token: token,
            message: "Logged In Successfully !",
            info: user,
            login: "Facebook"
        })
    }
    else {
        const salt = await bcrypt.genSalt(10)
        const newpassword = email + process.env.TOKEN_SECRET
        password = await bcrypt.hash(newpassword, salt)
        let newUser = new User({ name, email, password })
        newUser.save((err, data) => {
            if (err) {
                return res.status(400).json({
                    message: "something went wrong!"
                })
            }
            const token = jwt.sign({ _id: data._id }, process.env.TOKEN_SECRET, { expiresIn: "1d" })
            const { _id, name, email } = newUser
            res.header("auth-token", token).json({
                status: 200,
                token: token,
                message: "Logged In Successfully !",
                info: newUser,
                login: "Facebook"
            })
        })
    }
})

//changeProfile

router.post("/changeprofile", verify, async (req, res) => {
    const { currentPassword, newPassword, email } = req.body
    const user = await User.findOne({ email })
    const validPassword = await bcrypt.compare(currentPassword, user.password)
    if (!validPassword) {
        res.json({
            message: "Password is wrong..."
        })
    }
    else {
        const salt = await bcrypt.genSalt(10)
        const hashPassword = await bcrypt.hash(newPassword, salt)
        try {
            const result = await User.updateOne({ email: email }, { $set: { password: hashPassword } })
            if (result) {
                res.status(200).json({
                    message: "Password Changed Successfully"
                })
            }
        }
        catch (err) {
            res.status(400).json({
                error: err
            })
        }
    }

})

//contact

router.post("/contact", async (req, res) => {
    const { name, email, mobile, query } = req.body
    const contact = new Contact({
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile,
        query: req.body.query
    })
    try {
        const newContact = await contact.save()
        if (newContact) {
            res.status(200).json({
                message: "Your query is submitted !"
            })
        }
        else {
            res.status(500).json({
                message: "something went wrong !"
            })
        }
    }
    catch (err) {
        res.status(400).json({
            error: err
        })
    }
})


//Twilio
router.post("/twilio", (req, res) => {
    console.log(req.body.message);
    console.log("run")
    const msg = req.body.message
    const accountSid = 'ACfc3f9e5da54e20b470e226d98e7116c4';
    const authToken = 'e43270cc6fa815e578419abd259cd674';
    const client = require('twilio')(accountSid, authToken);

    client.messages
        .create({
            body: msg,
            messagingServiceSid: 'MG6e457bc6733f08f93a70960edf8fa5eb',
            to: '+918975106433',
            // from: "+13477123936"
        })
        .then(message => res.status(200).json(message))
})

module.exports = router

