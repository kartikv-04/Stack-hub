import { NODE_ENV } from "./env.js";
import pino from "pino";

const isProd = NODE_ENV === "production";

let logger: pino.Logger;

if (isProd) {
  // Production: JSON logs only
  logger = pino({
    level: "info",
    timestamp: pino.stdTimeFunctions.isoTime
  });
} else {
  // Development: pretty logs
  logger = pino({
    level: "debug",
    timestamp: pino.stdTimeFunctions.isoTime,
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        ignore: "hostname,pid"
      }
    }
  });
}

export default logger;
