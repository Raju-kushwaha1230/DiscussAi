const mongoose = require('mongoose')

const connectDb = async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log('mongoDB connected')
    } catch (error) {
        console.log('mongodb getting errror',error)
        process.exit(1)
    }
}

module.exports = connectDb