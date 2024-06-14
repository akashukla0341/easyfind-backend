const mongoose = require("mongoose")

async function connectDB(){
    try{
        const options = {
            dbName:process.env.DATABASE_NAME
          }
        await mongoose.connect(process.env.MONGODB_URI,options)
    }catch(err){
        console.log(err)
    }
}

module.exports = connectDB