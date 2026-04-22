import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { generalLimiter } from './middleware/rateLimiter'
import authRoutes from './routes/auth.routes'
import userRoutes from './routes/users.routes'
import buildingRoutes from './routes/buildings.routes'
import floorRoutes from './routes/floors.routes'
import companyRoutes from './routes/companies.routes'
import ticketRoutes from './routes/tickets.routes'
import categoryRoutes from './routes/categories.routes'
import analyticsRoutes from './routes/analytics.routes'

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())
app.use(generalLimiter)

app.get('/api/health', (_, res) => res.json({ status: 'ok' }))

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/buildings', buildingRoutes)
app.use('/api/floors', floorRoutes)
app.use('/api/companies', companyRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/analytics', analyticsRoutes)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

export default app
