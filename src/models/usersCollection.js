const mongoose = require('mongoose');
const validator = require('validator');

const userCollection = new mongoose.Schema({
    username:{
        type: String,
        required: true,
        trim: true,
        validate(input){
            let bool = /\d/.test(input);
            if(bool==true){
                throw new Error("Username should not contain numbers")
            }
        }
    },
    email:{
        type: String,
        unique: true,
        trim: true,
        validate(input){
            if(validator.isEmail(input)==false){
                throw new Error("Invalid email address");
            }
        }
    },
    password:{
        type: String,
        required: true,
        validate(input){
            if(input.length<6){
                throw new Error('Password too short')
            }
        }
    }
});

const Users = mongoose.model('Users', userCollection);
module.exports = Users;