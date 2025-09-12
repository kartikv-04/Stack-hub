import Router from 'express';
import { validateAndCheckURL } from '../../middleware/tracker.js';
import { getProductDetails, getUserTrackedProducts, setPriceAlert, deleteProduct } from './track.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

router.use(authenticate);
router.get('/', getUserTrackedProducts);
router.post('/', validateAndCheckURL, getProductDetails);
router.post('/:productId/alert', setPriceAlert);
router.delete('/:productId', deleteProduct)


export default router;