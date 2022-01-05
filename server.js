const express = require("express");
const mongoose = require("mongoose");
const app = express();
const PORT = 3000;
const Routes = require('./Routes/routes');
const client = require('./Helper/init_redis');

//middlewares 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((err,req,res,next) => {
    res.status(err.status || 500)
    res.send({
        error: {
            status: err.status || 500,
            message : err.message
        }
    })
})
//routes
app.use('/auth', Routes);
mongoose.connect('mongodb://localhost:27017/COMPAUTH', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("DB CONNECTED");
    })
    .catch(() => {
        console.log("ERROR");
    })



app.listen(PORT, (req,res) => {
    console.log("SERVER UP AND RUNNING");
})
     