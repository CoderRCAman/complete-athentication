var jwt = require('jsonwebtoken');
const createError = require('http-errors');
require("dotenv").config();
const client = require('../Helper/init_redis');

module.exports = {
    signAccessToken: (userId) => {
        return new Promise((resolve, reject) => {
            const payload = { //contains all information of the client 
               aud : userId
            }
            const secret = process.env.ACCESS_TOKEN_SECRET; 
            const options = {
                expiresIn: '1h'
            } 
            jwt.sign(payload, secret, options, (err,token) => {
                if (err) {
                    reject(createError.InternalServerError());
                } 
                resolve(token);
            })
        })
    },
    
    verifyAccessToken: (req,res,next) => {
        if (!req.headers['authorization']) return next(createError.Unauthorized());
        const authHeader = req.headers['authorization'];
        const beareToken = authHeader.split(" ");
        const token = beareToken[1];
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
            if(err)err.name === 'JsonWebTokenError' ? next(createError.Unauthorized()) : next(createError.Unauthorized(err.message));
            req.payload = payload;
            next();
        })
    },

    signRefreshToken : (userId) => {
        return new Promise((resolve, reject) => {
            const payload = {}
            const secret = process.env.REFRESH_TOKEN_SECRET; 
            const options = {
                expiresIn: '10h',
                audience : userId
            } 
            jwt.sign(payload, secret, options, (err,token) => {
                if (err) {
                    reject(createError.InternalServerError());
                }
                client.SET(userId,  token , 'EX' , 10*60*60, (err, reply) => {
                    if (err) reject(createError.InternalServerError());
                    resolve(token);
                })
               
            })
        })
    },
    //verify refresh token
    verifyRefreshToken: (refreshToken) => {
        return new Promise((resolve, reject) => {
            jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, payload) => {
                if (err) {
                    return reject(createError.Unauthorized());
                }
                const userId = payload.aud;
                client.GET(userId, (err, result) => { //validation RT from redis cache 
                    if (err) return reject(createError.InternalServerError());
                    if (refreshToken === result) return resolve(userId);
                    reject(createError.Unauthorized());
                })
                resolve(userId);
          })
      })
    }
}