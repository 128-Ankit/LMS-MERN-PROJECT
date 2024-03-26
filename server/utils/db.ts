const mongoose = require("mongoose")
require('dotenv').config();

const dbUrl:string = process.env.BD_URL || '';

const connectDB = async () => {
    try{
        await mongoose.connect(dbUrl).then((data:any) => {
            console.log(`Database connected with: ${data.Connection.host}`);
        })
    } catch(error:any) {
        console.log("DB Connection Failed", error.message);
        setTimeout(connectDB, 5000);
    }
}

export default connectDB;