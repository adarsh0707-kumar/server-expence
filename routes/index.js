import express from 'express'
import authRoutes from './authRoutes.js'
import userRoutes from './userRoutes.js'
import accountRoutes from './accountRoutes.js'
import transactionRoutes from './transactionRoutes.js'

const router = express.Router()

// ✅ Add this root endpoint
router.get('/', (req, res) => {
  res.json({
    status: 'API working',
    message: 'Welcome to the API',
    endpoints: {
      auth: '/auth',
      users: '/users',
      accounts: '/accounts',
      transactions: '/transactions'
    }
  })
})

router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/accounts', accountRoutes)
router.use('/transactions', transactionRoutes)

// Handle 404 for any unmatched routes
router.use('*', (req, res) => {
  res.status(404).json({
    status: 'Not Found',
    message: 'Route not found'
  })
})

export default router
