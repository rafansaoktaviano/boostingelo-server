"use strict";
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
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use(express_1.default.json());
app.use(body_parser_1.default.json());
app.use((0, express_bearer_token_1.default)());
const allowedOrigins = ['http://localhost:3000'];
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Check if the origin is allowed or not
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
}));
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
app.listen(PORT, () => {
    console.log(`RUNNING ON PORT ${PORT}`);
});
