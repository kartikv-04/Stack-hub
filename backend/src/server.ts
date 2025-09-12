import app from "./app.js";
import { connectDB } from "./config/db.js";
import logger from "./config/logger.js";
import { PORT, MONGO_URI } from './config/env.js';


const startServer = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error("MongoURI is not Defined");
    }
    if (!PORT) {
      throw new Error("PORT is undefined in envirnoment variable")
    }


    await connectDB(MONGO_URI);
    logger.info("Database Connected Successfully");

    app.listen(PORT, () => {
      logger.info(`Server running on PORT http://localhost:${PORT}`);
      logger.info(`Process Id : ${process.pid}`);
    })

  }
  catch (error) {
    logger.error(error, "Problem connecting to Server");
  }
}

startServer();

