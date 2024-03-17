import { app } from "./app";
require('dotenv').config();
const PORT = process.env.PORT || 3000;

//create server
 app.listen(PORT, () => {
    console.log(`server is started at port ${PORT}`);
    
 })