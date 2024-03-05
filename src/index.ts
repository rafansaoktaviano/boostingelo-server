import express, { NextFunction, Request, Response } from 'express'
import dotenv from 'dotenv'
dotenv.config

import { orderRouter } from './routers'

const app = express()
const PORT = process.env.PORT || 5000

app.use('/api', orderRouter)

app.get('/', (req: Request, res: Response) => {
  res.send('API is Working')
})
app.use(express.json())

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
