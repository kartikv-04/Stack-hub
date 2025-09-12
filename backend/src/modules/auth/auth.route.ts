import { Router } from "express";
import {registerController, loginController, logoutController, meController} from './auth.controller.js';
import { asyncHandler } from "../../util/asyncHandler.js";
import { userValidationRules, signinValidationRules, checkValidationResults } from "./auth.validator.js";


const router = Router();

router.post('/register' , userValidationRules(), checkValidationResults, asyncHandler(registerController));
router.post('/signin', signinValidationRules(), checkValidationResults, asyncHandler(loginController));
router.post('/signout', asyncHandler(logoutController));
router.get("/me", meController);


export default router;