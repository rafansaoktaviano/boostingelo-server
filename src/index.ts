import express, { NextFunction, Request, Response } from 'express'
import dotenv from 'dotenv'
dotenv.config()
import bodyParser from 'body-parser'
import { orderRouter, stripeRouter } from './routers'
import cors from 'cors'
import bearerToken from 'express-bearer-token'
import http from 'http'
import { Server, Socket } from 'socket.io'
import { v4 as uuidv4 } from 'uuid'

const app = express()
const server = http.createServer(app)
const PORT = process.env.PORT || 5001

import jwt from 'jsonwebtoken'
import { findSession, findUserSocket, saveSession } from './utils/sessionStore'
import supabase from './config/supabase'

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT'],
  },
})
declare module 'socket.io' {
  interface Socket {
    sessionID?: string | undefined
    userID?: string
  }
}

io.use(async (socket, next) => {
  const { sessionId } = socket.handshake.auth
  const { token } = socket.handshake.auth
  let userId
  if (token) {
    userId = jwt.verify(token || '', process.env.JWT_SECRET || '')
  }

  if (sessionId != undefined) {
    const session = await findSession(sessionId)
    saveSession(sessionId, socket.id, userId?.sub as string)

    socket.sessionID = sessionId as string
    socket.userID = userId?.sub as string
    return next()
  }

  socket.sessionID = uuidv4()
  socket.userID = userId?.sub as string

  saveSession(socket.sessionID, socket.id, userId?.sub as string)

  next()
})

io.on('connection', async (socket) => {
  const test = await findUserSocket(socket.userID)

  const order = socket.handshake.query

  console.log('connection succcess', socket.id)

  socket.emit('session', {
    sessionID: socket.sessionID,
  })

  socket.on('message', async ({ message, id }) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{ room_id: id, message: message, is_read: false, user_id: socket.userID }])
      .select()

    console.log(data)

    io.to(id).emit('message sent', { message: 'message has been sent' })
  })

  socket.on('join', (room) => {
    socket.join(room)
    console.log(`User ${socket.id} joined room: ${room}`)
  })
})

app.use(bearerToken())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(
  cors({
    origin: function (origin, callback) {
      console.log('CORS origin:', origin)
      if (!origin || allowedOrigins.includes(origin)) {
        console.log(true)
        callback(null, true)
      } else {
        console.log(false)
        callback(new Error('Not allowed by CORS'))
      }
    },
  }),
)

app.use('/api/stripe', stripeRouter)

app.use(express.json())
app.use(bodyParser.json())

const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:3000']

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

server.listen(PORT, () => {
  console.log(`RUNNING ON PORT ${PORT}`)
})
