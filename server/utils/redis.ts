// import { error } from 'console';
import {Redis} from 'ioredis';
require('dotenv').config();

const RedisUrl = process.env.REDIS_URL;
const redisClient = () => {
    if(RedisUrl){
        console.log(`Redis connected`);
        return RedisUrl; 
    }
    throw new Error(`Redis connection failed`);
};

export const redis = new Redis(redisClient());