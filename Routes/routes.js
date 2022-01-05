const express = require('express');
const Router = express.Router();
const createError = require('http-errors')
const User = require('../Models/user');
const { authSchema } = require("../Helper/validation_schema");
const { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } = require("../Helper/jwthelper");
const client = require('../Helper/init_redis');
Router.get('/',verifyAccessToken, (req, res) => {
    res.send("HEY YOU")
})
//login routes 
Router.post("/login", async (req, res, next) => {
    try {
        const result = await authSchema.validateAsync(req.body);
        const user = await User.findOne({ email: result.email })
        if (!user) throw createError.NotFound("User not registered");
        const isMatch = await user.isValidPassword(result.password); //check for password 
        if (!isMatch) throw createError.Unauthorized('Username/Password not valid');
        //we know user is valid now generate access token 
        console.log(user);
        const accessToken = await signAccessToken(user.id);
        const refreshToken = await signRefreshToken(user.id);
        res.send({ accessToken,refreshToken });
    } catch (error) {
        if (error.isJoi === true) return next(createError.BadRequest("Invalid Email/Password"));
        next(error); 
    }
})

//register route
Router.post("/register", async (req, res, next) => {
   try {
      
       const result = await authSchema.validateAsync(req.body);
       const doesExist = await User.findOne({ email: result.email });
       if (doesExist) throw createError.Conflict(`${result.email} already exist`);
      // console.log(result);
       const user = new User({ email: result.email, password:result.password });
       const savedUser = await user.save();
       const accessToken = await signAccessToken(savedUser.id);
       res.send(accessToken);
   } catch (error) {
       if (error.isJoi) error.status = 422;
       next(error);
   }
})
//Refresh Token Routes 
Router.post('/refresh-token', async(req,res,next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) throw createError.BadRequest();
        const userId = await verifyRefreshToken(refreshToken);
        const accessToken = await signAccessToken(userId);
        const refToken = await signRefreshToken(userId);
        res.send({ accessToken, refToken });
    } catch (error) {
        next(error);
    }
})

//log out 
Router.delete('/logout', async (req, res, next) => {
    try {
        const { refreshtoken } = req.body;
        console.log(refreshtoken);
        if (!refreshtoken) throw createError.BadRequest();
        const userId = await verifyRefreshToken(refreshtoken);
        client.DEL(userId, (err, val) =>{
            if (err) {
                throw createError.InternalServerError();
            }
            console.log(val);
            res.sendStatus(204);
        })
    } catch (error) {
        next(error);
    }
})
module.exports = Router;