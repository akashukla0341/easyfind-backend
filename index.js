const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
require('dotenv').config()
const connectDB = require('./config/db')
const router = require('./routes')


const app = express()
const PORT = 8080 || process.env.PORT
app.use(cors({
    origin : process.env.FRONTEND_URL,
    credentials : true
}))
app.use(express.json())
app.use(cookieParser())

app.use("/api",router)


app.use('/api/webhook', bodyParser.raw({ type: 'application/json' }));

connectDB().then(()=>{
    app.listen(PORT,()=>{
        console.log("connnect to DB")
        console.log("Server is running "+PORT)
    })
})
