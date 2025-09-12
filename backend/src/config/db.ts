import mongoose from "mongoose";
import logger from "./logger.js";

export const connectDB  = async(MongoURI : string) : Promise<void>=>{
    try{
        await mongoose.connect(MongoURI);
        const hostname = mongoose.connection.host;
        logger.info("MongoDB Connected Succesfully");
        logger.info(`MongoDB Hostname : ${hostname}`);
    }
    catch(error : any){
    
        logger.error({error, msg : "Error Connecting MongoDB"});
        logger.error(error.stack);
        process.exit(1);
    }
}

