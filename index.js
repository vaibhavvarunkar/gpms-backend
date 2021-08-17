const express = require("express");
const dotenv = require("dotenv")
const mongoose = require("mongoose")
const cors = require("cors")
const bodyParser = require('body-parser')


const app = express();

// parse application/json
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))



//cors
var corsOptions = {
    origin: "http://localhost:3000",
};
app.use(cors(corsOptions))
app.set('view engine', 'ejs');

//import routes
const authRoute = require("./routes/auth.js");

dotenv.config()



//connect to DB
mongoose.connect(process.env.DB_CONN, { useNewUrlParser: true, useUnifiedTopology: true }, () => {
    console.log("Connected to DB...");
})

//middleware
app.use(express.json())



//Route middleware
app.use("/api/user", authRoute);

app.listen(5000, () => console.log("Server up and running"));