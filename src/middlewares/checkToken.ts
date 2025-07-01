import { Request, Response, NextFunction, ErrorRequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ''

import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    /** Populated by express‑bearer-token */
    token?: string;
  }
}

let supabase: SupabaseClient
export const checkToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.token
    const isVerified = jwt.verify(token || '', process.env.JWT_SECRET || '')

    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      next()
    } else {
      res.status(400).send({
        isError: true,
        message: 'No JWT Parsed',
      })
    }
  } catch (error) {
    const err = error as Error
    return res.status(401).send({ message: err.message })
  }
}
