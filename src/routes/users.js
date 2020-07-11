const express = require('express');
const bcrypt = require('bcrypt');
const router = new express.Router();
const jwt = require('jsonwebtoken');
const users = require("../models/usersCollection");
const authentication = require('../middleware/authentication');
const Blogs = require('../models/blogsCollection');
router.post('/signup', async(req,res)=>{ // --> user signup
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    if(req.body.username==undefined || req.body.password==undefined || req.body.email==undefined){
        res.status(400).send({error: "Request body should include username, email, and password"})
    }
    else{
        const cipherPassword = await bcrypt.hash(password, 8);
        try {
            const Prom1 = await new users({
                username,
                email,
                password
            });
            await Prom1.save();
            await users.updateOne({email:email},{
                password: cipherPassword
            })
            res.status(201).send({message: "You have successfully signed up!"});
        } catch (error) {
            if(error.driver){
                res.status(403).send({error: "Email already in use"});
            }else{
                res.status(403).send(error.message);
            }
        }
    }
});

router.post('/login', async(req,res)=>{ // --> user login: Here we grant a JWT to the user
    const email = req.body.email;
    const password = req.body.password;
    if (req.body.email==undefined || req.body.password==undefined) {
        res.status(400).send({error: "Request body should include email and password"});
    } else {
        try {
            const Prom1 = await users.findOne({email: email});
            const isMatched = await bcrypt.compare(password, Prom1.password);
            if(isMatched){
                const token = jwt.sign({email: email}, process.env.secret, {expiresIn: '21600000'});
                res.status(200).send({
                    message: `Successfully logged in`,
                    JWT: token
                })
            }else{
                res.status(401).send({Error: "Invalid credentials"});
            }
        } catch (error) {
            console.log(error);
            res.status(401).send({error:"Invalid credentials"});
        }   
    }
});

router.delete('/deactivate', authentication, async(req,res)=>{
    try {
        await users.findOneAndDelete({email: req.body.foundUser.email});
        res.status(200).send({message: "Account successfully de-activated"});
    } catch (error) {
        res.status(400).send({error: "Something went wrong"})
    }
});

router.patch('/changepassword', authentication, async(req,res)=>{
    if(req.body.oldpassword==undefined || req.body.newpassword==undefined){
        res.status(400).send({error: "Request body should include old password and new password"});
    }
    else{
        try {
            if((req.body.newpassword.length)<6){
                res.status(401).send({error: "New password must be at least 6 characters"});
            }else{
                const isMatched = await bcrypt.compare(req.body.oldpassword, req.body.foundUser.password);
                if(isMatched){
                    const newHash = await bcrypt.hash(req.body.newpassword, 8);
                    await users.findOneAndUpdate({email: req.body.foundUser.email},{
                        password: newHash
                    });
                    res.status(200).send({message: "Password successfully changed"});
                }else{
                    throw new Error();
                }
            }
        } catch (error) {
            //console.log(error);
            res.status(401).send({error: "Wrong password"});
        }
    }
});

router.get('/myprofile', authentication, async(req,res)=>{
    try {
        const Prom1 = await users.findOne({email: req.body.foundUser.email});
        const n = await Blogs.find({author: req.body.foundUser.email}).count();
        res.status(400).send({username: Prom1.username, email: Prom1.email, postsCount: n});
    } catch (error) {
        res.status(400).send({error: "Something went wrong"})
    }
});

router.get('/profile', authentication, async(req,res)=>{
    try {
        email = req.query.email;
        if(email==undefined){
            res.status(400).send({error: "Please indicate an email account"});
        }
        const Prom1 = await users.findOne({email: email});
        if(Prom1==null){
            res.status(400).send({message: "Email you inserted may be invalid or doesn't exist"})
        }
        const n = await Blogs.find({author: email}).count();
        res.status(400).send({username: Prom1.username, email: Prom1.email, postsCount: n});
    } catch (error) {
        res.status(400).send({error: "Something went wrong"})
    }
})

module.exports = router;