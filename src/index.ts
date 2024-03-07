import express, { NextFunction, Request, Response } from 'express'
import dotenv from 'dotenv'
dotenv.config()
import bodyParser from 'body-parser'
import { orderRouter } from './routers'
import cors from 'cors'
import bearerToken from 'express-bearer-token'
const app = express()
const PORT = process.env.PORT || 5000

app.use(express.json())
app.use(bodyParser.json())
app.use(bearerToken())

const allowedOrigins = ['http://localhost:3000']

app.use(
  cors({
    origin: function (origin, callback) {
      // Check if the origin is allowed or not
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
  }),
)

app.use('/api/order', orderRouter)

app.get('/', (req: Request, res: Response) => {
  res.send('API is Working')
})

// Custom Error

interface CustomError extends Error {
  status?: number
  statusCode: number
}

app.use((err: CustomError, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500
  const statusMessage = err.message || 'Error'
  return res.status(statusCode).send({
    isError: true,
    message: statusMessage,
    data: null,
  })
})

app.listen(PORT, () => {
  console.log(`RUNNING ON PORT ${PORT}`)
})
