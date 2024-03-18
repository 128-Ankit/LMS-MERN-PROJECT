import express, { NextFunction } from 'express';
export const app = express();
import cors from 'cors';
import coolieParser from 'cookie-parser';
import {ErrorMiddleware} from './middleware/error'
require('dotenv').config();
const Origin =  process.env.ORIGIN;


//body parser 
app.use(express.json({limit: '50mb'}));

//cookie parser
app.use(coolieParser());

//cors --> cross origin resource sharing
app.use(cors({
    origin:Origin
}));

//testing api
app.get('/test', (req, res, next) => {
    res.status(200).json({
        success: "true",
        message: "API is working good"
    });
});

//unknown route
app.get('*', (req, res, next) => {
    const err = new Error(`Route ${req.originalUrl} not found`) as any;
    err.status = 404;
    next(err);
});

//using error function
app.use(ErrorMiddleware);