import { NODE_ENV } from "./env.js";
import pino from "pino";

// Export and customize configuration
export const logger = pino({
    level: NODE_ENV == 'production' ? 'info' : 'debug',        //Set minimum loggin level
    timestamp: pino.stdTimeFunctions.isoTime,                  //Format timestamp
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: 'true',
            ingnore: 'hostname, pid'
        }
    }
});
export default logger
