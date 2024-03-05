import { NextFunction, Request, Response } from 'express'

export const valorantEloCheckout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.send('ok')
  } catch (error) {
    next(error)
  }
}


