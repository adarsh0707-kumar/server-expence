import express from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import accountRoutes from './accountRoutes.js';
import transactionRoutes from './transactionRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);

// Handle 404 for any unmatched routes
router.use('*', (req, res) => {
  res.status(404).json({
    status: 'Not Found',
    message: 'Route not found',
  });
});






export default router;