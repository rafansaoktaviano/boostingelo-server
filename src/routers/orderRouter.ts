import express from 'express'

const router = express.Router()

import * as orderController from './../controllers'
import * as middlewares from './../middlewares'

router.post('/checkout', middlewares.checkToken, orderController.valorantEloCheckout)

export default router
