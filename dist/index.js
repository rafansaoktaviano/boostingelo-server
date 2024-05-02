"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const body_parser_1 = __importDefault(require("body-parser"));
const routers_1 = require("./routers");
const cors_1 = __importDefault(require("cors"));
const express_bearer_token_1 = __importDefault(require("express-bearer-token"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const uuid_1 = require("uuid");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const PORT = process.env.PORT || 5000;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const sessionStore_1 = require("./utils/sessionStore");
const supabase_1 = __importDefault(require("./config/supabase"));
const io = new socket_io_1.Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT'],
    },
});
io.use((socket, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { sessionId } = socket.handshake.auth;
    const { token } = socket.handshake.auth;
    let userId;
    if (token) {
        userId = jsonwebtoken_1.default.verify(token || '', process.env.JWT_SECRET || '');
    }
    if (sessionId != undefined) {
        const session = yield (0, sessionStore_1.findSession)(sessionId);
        (0, sessionStore_1.saveSession)(sessionId, socket.id, userId === null || userId === void 0 ? void 0 : userId.sub);
        socket.sessionID = sessionId;
        socket.userID = userId === null || userId === void 0 ? void 0 : userId.sub;
        return next();
    }
    socket.sessionID = (0, uuid_1.v4)();
    socket.userID = userId === null || userId === void 0 ? void 0 : userId.sub;
    (0, sessionStore_1.saveSession)(socket.sessionID, socket.id, userId === null || userId === void 0 ? void 0 : userId.sub);
    next();
}));
io.on('connection', (socket) => __awaiter(void 0, void 0, void 0, function* () {
    const test = yield (0, sessionStore_1.findUserSocket)(socket.userID);
    console.log(test);
    const order = socket.handshake.query;
    console.log('connection succcess', socket.id);
    socket.emit('session', {
        sessionID: socket.sessionID,
    });
    socket.on('message', ({ message, id }) => __awaiter(void 0, void 0, void 0, function* () {
        const { data, error } = yield supabase_1.default
            .from('chat_messages')
            .insert([{ room_id: id, message: message, is_read: false, user_id: socket.userID }])
            .select();
        console.log(data);
        io.to(id).emit('message sent', { message: 'message has been sent' });
    }));
    socket.on('join', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room: ${room}`);
    });
}));
app.use((0, express_bearer_token_1.default)());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
}));
app.use('/api/stripe', routers_1.stripeRouter);
app.use(express_1.default.json());
app.use(body_parser_1.default.json());
const allowedOrigins = ['http://localhost:3000'];
app.use('/api/order', routers_1.orderRouter);
app.get('/', (req, res) => {
    res.send('API is Working');
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
server.listen(PORT, () => {
    console.log(`RUNNING ON PORT ${PORT}`);
});
