import cors from 'cors'
import express from 'express'
import dotenv from 'dotenv'
import routes from './routes/index.js'; // Assuming you have a routes/index.js file

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8000

// ✅ Fixed CORS setup
app.use(cors({
  origin: ['http://localhost:5173',
    'https://expense-tracker-ten-drab.vercel.app', // Your deployed frontend URL
  ], // Your Vite frontend
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
})); // or app.use(cors({ origin: "*" }))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.use('/api-v1', routes)

// app.use('*', (req, res) => {
//   res.status(404).json({
//     status: 'Not Found',
//     message: 'Route not found'
//   })
// })

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  })
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
