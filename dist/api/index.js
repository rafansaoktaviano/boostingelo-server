"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const body_parser_1 = __importDefault(require("body-parser"));
const routers_1 = require("../src/routers");
const cors_1 = __importDefault(require("cors"));
const express_bearer_token_1 = __importDefault(require("express-bearer-token"));
const http_1 = __importDefault(require("http"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const PORT = process.env.PORT;
// import jwt from 'jsonwebtoken'
// import { findSession, findUserSocket, saveSession } from './utils/sessionStore'
// import supabase from './config/supabase'
const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:3000'];
// // const io = new Server(server, {
// //   cors: {
// //     origin: allowedOrigins[0],
// //     methods: ['GET', 'POST', 'PUT'],
// //   },
// // })
// // declare module 'socket.io' {
// //   interface Socket {
// //     sessionID?: string | undefined
// //     userID?: string
// //   }
// // }
// // io.use(async (socket, next) => {
// //   const { sessionId } = socket.handshake.auth
// //   const { token } = socket.handshake.auth
// //   let userId
// //   if (token) {
// //     userId = jwt.verify(token || '', process.env.JWT_SECRET || '')
// //   }
// //   if (sessionId != undefined) {
// //     const session = await findSession(sessionId)
// //     saveSession(sessionId, socket.id, userId?.sub as string)
// //     socket.sessionID = sessionId as string
// //     socket.userID = userId?.sub as string
// //     return next()
// //   }
// //   socket.sessionID = uuidv4()
// //   socket.userID = userId?.sub as string
// //   saveSession(socket.sessionID, socket.id, userId?.sub as string)
// //   next()
// // })
// // io.on('connection', async (socket) => {
// //   const test = await findUserSocket(socket.userID)
// //   const order = socket.handshake.query
// //   console.log('connection succcess', socket.id)
// //   socket.emit('session', {
// //     sessionID: socket.sessionID,
// //   })
// //   socket.on('message', async ({ message, id }) => {
// //     const { data, error } = await supabase
// //       .from('chat_messages')
// //       .insert([{ room_id: id, message: message, is_read: false, user_id: socket.userID }])
// //       .select()
// //     console.log(data)
// //     io.to(id).emit('message sent', { message: 'message has been sent' })
// //   })
// //   socket.on('join', (room) => {
// //     socket.join(room)
// //     console.log(`User ${socket.id} joined room: ${room}`)
// //   })
// // })
app.use((0, express_bearer_token_1.default)());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        console.log('CORS origin:', origin);
        if (!origin || allowedOrigins.includes(origin)) {
            console.log(true);
            callback(null, true);
        }
        else {
            console.log(false);
            callback(new Error('Not allowed by CORS'));
        }
    },
}));
app.use('/api/stripe', routers_1.stripeRouter);
app.use(express_1.default.json());
app.use(body_parser_1.default.json());
app.use('/api/order', routers_1.orderRouter);
app.get('/', (req, res) => {
    res.send('API is Working');
});
// ✅ Health check endpoint
app.get('/health', (req, res) => {
    res.sendStatus(200);
});
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const statusMessage = err.message || 'Error';
    return res.status(statusCode).send({
        isError: true,
        message: statusMessage,
        data: null,
    });
});
exports.default = app;
