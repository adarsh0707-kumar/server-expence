// import necessary modules and functions

import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { addMoneyToAccount, createAccount, getAccount } from '../controllers/accountController.js';

const router = express.Router();

// Define routes for account operations

router.get("/:id?", authMiddleware, getAccount)
router.post("/create", authMiddleware, createAccount);
router.put("/add-money/:id", authMiddleware, addMoneyToAccount);

export default router;