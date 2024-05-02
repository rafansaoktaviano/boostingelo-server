import { redis } from '../lib/redis'

export const saveSession = (sessionID: string, socketId: string, userID: string): void => {
  const details = {
    socketId: socketId,
    session: sessionID,
  }
  redis.hset(`session:${sessionID}`, { socketId })
  redis.hmset(`userID:${userID}`, details)
}

export const findSession = async (sessionID: any) => {
  return redis.hget(`session:${sessionID}`, 'socketId')
}
export const findUserSocket = (sessionID: any) => {
  return redis.hmget(`userID:${sessionID}`, 'socketId')
}
