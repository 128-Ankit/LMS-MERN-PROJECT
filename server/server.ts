import { app } from "./app";
import connectDB from './utils/db'
require('dotenv').config();
const PORT = process.env.PORT || 3000;

//create server
 app.listen(PORT, () => {
   console.log(`server is started at port: ${PORT}`);
   connectDB();
 })