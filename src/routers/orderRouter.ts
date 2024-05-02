import express from 'express'

const router = express.Router()

import * as Controller from './../controllers'
import * as middlewares from './../middlewares'

router.post('/checkout', middlewares.checkToken, Controller.valorantEloCheckout)
router.post('/system', middlewares.checkToken, Controller.messageSendAsSystem)

export default router
