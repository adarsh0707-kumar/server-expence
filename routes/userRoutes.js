// Import necessary modules
import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import { changePassword, getUser, updateUser } from '../controllers/userController.js'

const router = express.Router()

// Import your controller functions

router.get('/', authMiddleware, getUser)
// router.get('/alluser', authMiddleware, getAllUser)
router.put('/update-user', authMiddleware, updateUser)
router.put('/change-password', authMiddleware, changePassword)

export default router
