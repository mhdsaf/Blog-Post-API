const mongoose = require('mongoose');
const validator = require('validator');
const blogSchema = new mongoose.Schema({
    author:{
        type: String,
        required: true
    },
    content:{
        type: String,
        required: true
    },
    likes:[
        {
            person:{
                type: String
            }
        }
    ],
    comments:[
        {
            person: {
                type: String
            },
            content: {
                type: String
            },
            time: {
                type: Number
            }
        }
    ]
}, {timestamps: true});

const Blogs = mongoose.model('Posts', blogSchema);

module.exports = Blogs;