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
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserSocket = exports.findSession = exports.saveSession = void 0;
const redis_1 = require("../lib/redis");
const saveSession = (sessionID, socketId, userID) => {
    const details = {
        socketId: socketId,
        session: sessionID,
    };
    redis_1.redis.hset(`session:${sessionID}`, { socketId });
    redis_1.redis.hmset(`userID:${userID}`, details);
};
exports.saveSession = saveSession;
const findSession = (sessionID) => __awaiter(void 0, void 0, void 0, function* () {
    return redis_1.redis.hget(`session:${sessionID}`, 'socketId');
});
exports.findSession = findSession;
const findUserSocket = (sessionID) => {
    return redis_1.redis.hmget(`userID:${sessionID}`, 'socketId');
};
exports.findUserSocket = findUserSocket;
