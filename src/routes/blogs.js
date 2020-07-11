const express = require('express');

const router = new express.Router();

const posts = require('../models/blogsCollection');

const users = require('../models/usersCollection');

const authentication = require('../middleware/authentication');

/*************************************** CREATE ********************************************/
router.post('/newpost', authentication, async(req,res)=>{ // -> User creating new post
    if (req.body.content==undefined) {
        res.status(400).send({error: "Request body should include post's content"})
    } else {
        try {
            const Prom1 = await new posts({
                author: req.body.foundUser.email,
                content: req.body.content
            });
            await Prom1.save();
            res.status(201).send({message: "Post successfully created"})
        } catch (error) {
            res.status(400).send({error: "Something went wrong"})
        }
    }
});

router.post('/likes', authentication, async(req,res)=>{ // -> User liking a post
    const id = req.query.id;
    try {
        const Prom1 = await posts.findById(id);
        const arr = [...Prom1.likes];
        arr.forEach(element => {
            if(element.person == req.body.foundUser.email){
                res.status(403).send({error: "You already liked this post"});
                throw new Error();
            }
        });
        await Prom1.likes.push({person: req.body.foundUser.email});
        await Prom1.save();
        res.status(201).send({message: "You successfully added a like"});
    } catch (error) {
        console.log(error)
        res.status(400).send({error: "Invalid ID"})
    }
});

router.post('/newcomment', authentication, async(req,res)=>{ // -> User coomenting on a post
    try {
        if(req.body.content==undefined || req.body.content.trim()==""){
            res.status(400).send({error: "Can't post an empty comment"});
        }else{
            const date = new Date()
            const id = req.query.id;
            const Prom1 = await posts.findById(id);
            await Prom1.comments.push({person: req.body.foundUser.email, content: req.body.content, time: date.getTime()});
            await Prom1.save();
            res.status(200).send({message: "You have successfully added a comment"});
        }
    } catch (error) {
        console.log(error)
        res.status(400).send({error: "Invalid ID"})
    }
});

/*************************************** READ ********************************************/

router.get('/view/myposts', authentication, async(req,res)=>{
    try {
        let Limit = parseInt(req.query.limit);
        let Sort = parseInt(req.query.sort);
        let results = [];
        if (Limit==NaN) {
            Limit = null
        }
        console.log(Sort);
        if(Sort!=-1 && Sort!=1){
            Sort = 1;
        }
        const Prom1 = await posts.find({author: req.body.foundUser.email}, null, {limit: Limit, sort: {createdAt: Sort}});
        if(Prom1.length==0){
            res.status(404).send({message: "You have no posts yet!"})
        }
        Prom1.forEach(element => {
            results.push({
                Post: element.content,
                likesCount: element.likes.length,
                commentsCount: element.comments.length
            })
        });

        res.status(200).send(results);   
    } catch (error) {
        res.status(400).send({error: "Something went wrong"})
    }
});

router.get('/view/posts', authentication, async(req,res)=>{
    try {
        let email = req.body.user;
        if(email==undefined || email.trim()==''){
            res.status(400).send({error: "Please indicate a user"})
        }
        let Limit = parseInt(req.query.limit);
        let Sort = parseInt(req.query.sort);
        let results = [];
        if (Limit==NaN) {
            Limit = null
        }
        if(Sort!=-1 && Sort!=1){
            Sort = 1;
        }
        const Prom1 = await posts.find({author: email}, null, {limit: Limit, sort: {createdAt: Sort}});
        if(Prom1==null){
            res.status(404).send({message: "Invalid post ID"})
        }
        if(Prom1.length==0){
            res.status(404).send({message: "Indicated user may not exist or doesn't have any posts yet"});
        }
        Prom1.forEach(element => {
            results.push({
                Post: element.content,
                likesCount: element.likes.length,
                commentsCount: element.comments.length
            })
        });
        res.status(200).send(results);   
    } catch (error) {
        res.status(400).send({error: "Something went wrong"})
    }
});

router.get('/view/likers', authentication, async(req,res)=>{
    try {
        let results = [];
        const id = req.query.id;
        if(id==undefined || id.trim()==''){
            res.status(400).send({error: "Please indicate a post ID"})
        }
        const Prom1 = await posts.findById(id);
        if(Prom1==null){
            res.status(404).send({message: "Invalid post ID"})
        }
        if(Prom1.likes.length==0){
            res.status(404).send({message: "No likes on this post"})
        }
        Prom1.likes.forEach(element => {
            results.push(element.person)
        });
        res.status(200).send(results);   
    } catch (error) {
        console.log(error)
        res.status(400).send({error: "ID should contain 24 characters"})
    }
});

router.get('/view/comments', authentication, async(req,res)=>{
    try {
        const id = req.query.id;
        if(id==undefined || id.trim()==''){
            res.status(400).send({error: "Please indicate a post ID"})
        }
        const Prom1 = await posts.findById(id);
        if(Prom1==null){
            res.status(404).send({message: "Invalid post ID"})
        }
        if(Prom1.comments.length==0){
            res.status(404).send({message: "Indicated post has no comments"});
        }
        res.status(200).send(Prom1.comments);   
    } catch (error) {
        console.log(error);
    }
});

/*************************************DELETE ***************************/

router.delete('/posts', authentication, async(req,res)=>{
    try {
        const author = req.body.foundUser.email; 
        const id = req.body.post_id;
        const Prom1 = await posts.findById(id);
        if(Prom1==null){
            res.status(400).send({error: "Invalid post ID"});
        }
        else{
            if (author==Prom1.author) {
                await posts.findByIdAndDelete(id);
                res.status(200).send({message: "Post successfully deleted"})
            } else {
                res.status(401).send({error: "You don't have a post with indicated ID"});
            }
        }
    } catch (error) {
        res.status(400).send({error: "Post ID should contain 24 characters"});
    }
});

router.delete('/comments', authentication, async(req,res)=>{
    try {
        var found = false;
        const author = req.body.foundUser.email; 
        const id = req.body.post_id;
        const cid = req.body.comment_id;
        const Prom1 = await posts.findById(id);
        if(Prom1==null){
            res.status(400).send({error: "Invalid post ID"});
        }
        else{
            Prom1.comments.forEach(async (element, index) => {
                if(element._id==cid && element.person == author){
                    found = true;
                    await Prom1.comments.splice(index, 1);
                    await Prom1.save();
                    return false;
                }
            });
            if (found) {
                res.status(200).send({message: "Comment deleted"})
            } else {
                res.status(400).send({error: "Invalid comment ID. Remember you can only delete your comments"});
            }
        }
    } catch (error) {
        res.status(400).send({error: "Post ID should contain 24 characters"});
    }
});

router.delete('/like', authentication, async(req,res)=>{
    try {
        let found = false;
        const person = req.body.foundUser.email;
        const id = req.body.post_id;
        const Prom1 = await posts.findById(id);
        console.log(Prom1);
        if(Prom1==null){
            res.status(400).send({error: "Invalid ID"})
        }else{
            Prom1.likes.forEach(async(element, index) => {
                if(element.person==person){
                    found = true;
                    await Prom1.likes.splice(index, 1);
                    await Prom1.save();
                    return false;
                }
            });
            if(found){
                res.status(200).send({message: "Successfully unliked the post"})
            }else{
                res.status(400).send({message: "You never liked the post"})
            }
        }
    } catch (error) {
        console.log(error)
        res.status(400).send({error: "Post ID should contain 24 characters"});
    }
})
module.exports = router;