const users = require('../models/usersCollection');
const jwt = require('jsonwebtoken');

const authentication = async(req,res, next) => {
    try {
        const userToken = req.body.JWT;
        if(userToken==undefined){
            res.status(400).send({error: "Need to include JWT in the request body"});
        };
        const decoded = jwt.verify(userToken, process.env.secret);
        if(decoded){
            const email = decoded.email;
            const Prom1 = await users.findOne({email: email});
            req.body.foundUser = Prom1;
            next();
        }else{
            res.status(401).send({error: "Provided JWT is expired or invalid"});
        }
    } catch (error) {
        //console.log(error);
        res.status(401).send({error: "You need to be signed in"});
    }
}

module.exports = authentication;