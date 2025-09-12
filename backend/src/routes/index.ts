import express, { Router } from 'express';
import authRouter from '../modules/auth/auth.route.js'
// import { authenticate } from '../middleware/authenticate.js';
import trackRouter from '../modules/priceTracker/tracker.route.js';

const router : Router = express.Router();

router.use('/auth', authRouter)
router.get('/check',  (req, res) => {
    res.send('API is running...');
})
router.use('/priceTrack', trackRouter);


export default router;
