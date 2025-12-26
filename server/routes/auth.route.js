import { Router } from "express";
import { login, register, logout, changePassword } from "../contollers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/change-password', authMiddleware, changePassword);

export default router;

