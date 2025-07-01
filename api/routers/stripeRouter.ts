import bodyParser from 'body-parser'
import * as stripeController from '../controllers'

import express from 'express'

const router = express.Router()

router.post('/webhook', express.raw({ type: '*/*' }), stripeController.stripeWebhook)

export default router
