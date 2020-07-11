const express = require('express');

require('./database/databaseConnection');

const app = express();

const blogsRouter = require("./routes/blogs");

const usersRouter = require("./routes/users");

app.use(express.json());

const port = process.env.PORT;

app.use(blogsRouter);

app.use(usersRouter);

app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
})