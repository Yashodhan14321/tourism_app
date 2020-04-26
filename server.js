const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const config = require('./config/database')
const userrouter = require('./router/userroute')

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({
    extended: true
}))

mongoose.connect(config.database)
let db = mongoose.connection
db.on('error',(err)=>{
    console.log(err)
})
db.once('open',()=>{
    console.log("connected to mongodb ...")
})

app.use('/users',userrouter)


app.listen(5000,(err)=>{
    if(err){
        console.log(err)
    }
    else{
        console.log("App running on port 5000 ...")
    }
})