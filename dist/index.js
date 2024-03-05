"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config;
const routers_1 = require("./routers");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use('/api', routers_1.orderRouter);
app.get('/', (req, res) => {
    res.send('API is Working');
});
app.use(express_1.default.json());
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
