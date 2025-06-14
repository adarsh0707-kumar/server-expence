import express from 'express';
import { signupUser, loginUser } from '../controllers/authController.js';

const router = express.Router();

// Define your routes here

router.post('/signup', signupUser);
router.post('/login', loginUser);

export default router
