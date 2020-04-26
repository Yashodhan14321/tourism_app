const express = require('express')
const router = express.Router()
const USER = require('../models/users')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

function verifyToken(req, res, next) {
    // Get auth header value
    const bearerHeader = req.headers['authorization']
    // Check if bearer is undefined
    if(typeof bearerHeader !== 'undefined') {
      // Split at the space
      const bearer = bearerHeader.split(' ')
      // Get token from array
      const bearerToken = bearer[1]
      // Set the token
      req.token = bearerToken
      // Next middleware
      next()
    } else {
      // Forbidden
      res.json({"status":"not authorized"})
    }
  
  }

router.post('/register',(req,res)=>{
    USER.findOne({$or:[{username:req.body.username},{email:req.body.email},{phone:req.body.phone}]},(err,user)=>{
        if(user){
            if(user.username === req.body.username){
                res.json({"status":"username already exists"})
            }
            else if(user.email === req.body.email){
                res.json({"status":"email already exists"})
            }
            else if(user.phone === req.body.phone){
                res.json({"status":"phone already exists"})
            }
        }
        else{
            bcrypt.genSalt(10,(err,salt)=>{
                bcrypt.hash(req.body.password,salt, (err,hash)=>{
                    const user = new USER({
                        username: req.body.username,
                        email: req.body.email,
                        password: hash,
                        name: req.body.name,
                        phone: req.body.phone
                    })
                    user.save((err)=>{
                        if(err){
                            console.log(err)
                            res.json({"status":"cannot save try after sometime"})
                        }
                        else{
                            res.json({"status":"user data saved"})
                        }
                    })
                })
            })
        }
    })
})

router.post('/login',(req, res)=>{
    USER.findOne({username:req.body.username},(err,user)=>{
        if(user){
            bcrypt.compare(req.body.password, user.password, function(err, result) {
                if(result){
                    jwt.sign({user}, 'secretkey', { expiresIn: '5h' }, (err, token) => {
                        res.json({"status":"logged in","jwt":token})
                    })
                }
                else{
                    res.json({"status":"incorrect password"})
                }
            })
        }
        else{
            res.json({"status":"username not found"})
        }
    })
})

router.post('/edit',verifyToken,(req,res)=>{
    jwt.verify(req.token, 'secretkey', (err, authData)=>{
        if(err){
            res.sendStatus(403)
        }
        else{
            let user = {
                username: req.body.username,
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                password: authData.user.password
            }
            USER.findOne({$or:[{email: req.body.email},{username: req.body.username},{phone: req.body.phone}]},(err, user)=>{
                if(user){
                    if(user.username === req.body.username && req.body.username !== authData.user.username){
                        res.json({"status":"username already exists"})
                    }
                    else if(user.email === req.body.email && req.body.email !== authData.user.email){
                        res.json({"status":"email already exists"})
                    }
                    else if(user.phone === req.body.phone && req.body.phone !== authData.user.phone){
                        res.json({"status":"phone already exists"})
                    }
                    else{
                        USER.findOneAndUpdate({username: authData.user.username},user,(err)=>{
                            if(err){
                                console.log(err)
                                res.json({"status":"couldnot edit userdetails"})
                            }
                            else{
                                jwt.sign({user}, 'secretkey', { expiresIn: '5h' }, (err, token) => {
                                    res.json({"status":"success","jwt":token})
                                })
                            }
                        })
                    }
                }
                else{
                    console.log(err)
                }
            })
        }
    })
})

router.get('/checktoken',verifyToken,(req,res)=>{
    jwt.verify(req.token, 'secretkey', (err, authData) => {
        if(err){
          res.sendStatus(403)
        } 
        else{
            res.json({"status":"hooray!! it worked"})
        }
    })
})

router.get('/getuser',verifyToken,(req,res)=>{
    jwt.verify(req.token, 'secretkey', (err, authData) => {
        if(err){
          res.sendStatus(403)
        } 
        else{
            res.json({
                "username": authData.user.username,
                "email": authData.user.email,
                "phone": authData.user.phone,
                "name": authData.user.name
            })
        }
    })
})


module.exports = router