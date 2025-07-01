"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
let supabase;
const checkToken = (req, res, next) => {
    try {
        const token = req.token;
        const isVerified = jsonwebtoken_1.default.verify(token || '', process.env.JWT_SECRET || '');
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            next();
        }
        else {
            res.status(400).send({
                isError: true,
                message: 'No JWT Parsed',
            });
        }
    }
    catch (error) {
        const err = error;
        return res.status(401).send({ message: err.message });
    }
};
exports.checkToken = checkToken;
