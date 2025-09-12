import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import router from './routes/index.js';
import { errorHandler } from './middleware/error.js';
import pinoHttp from 'pino-http';
import logger from './config/logger.js';
import { CLIENT_URL } from './config/env.js';

const app = express();

// -------------------- Security Middleware --------------------
app.use(helmet());
const allowedOrigins = new Set([
    CLIENT_URL
    
]);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.has(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization']
}));

// -------------------- Body Parsers --------------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// -------------------- Rate Limiting --------------------
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(limiter);

// -------------------- Logger Middleware --------------------
// This will automatically log incoming requests and responses
app.use((pinoHttp as unknown as (opts: any) => any)({ logger }));

// -------------------- Routes --------------------
app.use('/api/v1', router);

// -------------------- Error Handler --------------------
app.use(errorHandler);

export default app;
