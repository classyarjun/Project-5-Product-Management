const express = require('express')
const app=express()
const mongoose= require('mongoose');
const route = require('./routes/route');
const multer= require('multer')

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(multer().any())
mongoose.set('strictQuery', true);
mongoose.connect("mongodb+srv://Avverma:Avverma95766@avverma.2g4orpk.mongodb.net/group10Database",{
    useNewUrlParser: true
})
.then( () => console.log("MongoDb is connected"))
.catch ( err => console.log(err) )



app.use('/',route)

app.listen(3000,()=>{console.log("Express run port 3000")})
